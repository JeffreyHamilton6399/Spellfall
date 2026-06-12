"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings, BarChart2, Swords, ChevronRight } from "lucide-react";
import { unlock } from "@/lib/audio";
import SettingsModal from "./SettingsModal";
import StatsModal from "./StatsModal";
import Button from "./ui/Button";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateSession(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getOrCreateSession(): string {
  if (typeof window === "undefined") return "";
  let s = localStorage.getItem("spellfall_session");
  if (!s) { s = generateSession(); localStorage.setItem("spellfall_session", s); }
  return s;
}

interface Props { initialName?: string; }

export default function HomeScreen({ initialName }: Props) {
  const router = useRouter();
  const [name, setName]         = useState(initialName ?? "");
  const [nameSet, setNameSet]   = useState(!!initialName);
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats]       = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const joinRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!nameSet) nameRef.current?.focus(); }, [nameSet]);
  useEffect(() => { if (showJoin) joinRef.current?.focus(); }, [showJoin]);

  const saveName = () => {
    const n = name.replace(/[^a-zA-Z0-9_\s\-]/g, "").trim().slice(0, 20);
    if (!n) return;
    setName(n);
    localStorage.setItem("spellfall_name", n);
    setNameSet(true);
    unlock();
  };

  const go = (path: string) => {
    unlock();
    const session = getOrCreateSession();
    router.push(`${path}?name=${encodeURIComponent(name)}&session=${session}`);
  };

  /* ── Name entry screen ─────────────────────────────────────────────── */
  if (!nameSet) {
    return (
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h1 className="font-display font-black text-7xl tracking-wide text-white leading-none">
            SPELL<span className="text-emerald-400">FALL</span>
          </h1>
          <p className="mt-2 text-ink-3 text-sm">Enter a name to play</p>
        </div>
        <div className="flex gap-2 w-full max-w-xs">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_\s\-]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            maxLength={20}
            placeholder="Your name…"
            className="flex-1 bg-arena-800 border border-rim focus:border-rim-hi rounded-xl px-4 py-3.5 text-ink placeholder-ink-4 text-base font-semibold outline-none transition-colors"
            autoComplete="off"
            spellCheck={false}
          />
          <Button variant="primary" size="lg" onClick={saveName} aria-label="Continue">
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    );
  }

  /* ── Main menu ─────────────────────────────────────────────────────── */
  return (
    <>
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-8 px-4 relative">
        {/* Top-right controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-9 h-9 p-0"
            onClick={() => setShowStats(true)}
            aria-label="Stats"
          >
            <BarChart2 size={18} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-9 h-9 p-0"
            onClick={() => setShowSettings(true)}
            aria-label="Settings"
          >
            <Settings size={18} />
          </Button>
        </div>

        {/* Logo */}
        <div className="text-center">
          <h1 className="font-display font-black text-7xl tracking-wide text-white leading-none">
            SPELL<span className="text-emerald-400">FALL</span>
          </h1>
          <p className="mt-2 text-ink-3 text-sm">
            Welcome back,{" "}
            <button
              onClick={() => setNameSet(false)}
              className="text-ink-2 hover:text-ink transition-colors underline decoration-rim-hi underline-offset-2"
            >
              {name}
            </button>
          </p>
        </div>

        {/* Mode buttons */}
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            displayFont
            className="text-2xl py-4 h-auto"
            onClick={() => go("/play")}
          >
            Quick Play
          </Button>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => go(`/play/${generateRoomCode()}`)}
          >
            Create Private Room
          </Button>

          {!showJoin ? (
            <Button
              variant="ghost"
              size="md"
              fullWidth
              onClick={() => setShowJoin(true)}
            >
              Join with Code
            </Button>
          ) : (
            <div className="flex gap-2">
              {/* SPELL- is cosmetic; players type only the 4-char code */}
              <div className="flex-1 flex items-center bg-arena-800 border border-rim focus-within:border-rim-hi rounded-xl overflow-hidden transition-colors">
                <span className="pl-4 pr-0.5 text-ink-4 font-mono text-sm select-none pointer-events-none">
                  SPELL-
                </span>
                <input
                  ref={joinRef}
                  value={joinCode}
                  onChange={(e) => {
                    const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                    setJoinCode(v.slice(0, 4));
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const raw = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "");
                    // Strip SPELL prefix if pasted in full
                    const stripped = raw.startsWith("SPELL") ? raw.slice(5) : raw;
                    setJoinCode(stripped.slice(0, 4));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && joinCode.length >= 2) go(`/play/${joinCode}`);
                    if (e.key === "Escape") setShowJoin(false);
                  }}
                  placeholder="XXXX"
                  maxLength={4}
                  className="flex-1 bg-transparent py-3 pr-4 text-ink placeholder-ink-4 font-mono text-base outline-none min-w-0"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <Button
                variant="primary"
                size="md"
                disabled={joinCode.length < 2}
                onClick={() => { if (joinCode) go(`/play/${joinCode}`); }}
              >
                Join
              </Button>
            </div>
          )}

          <div className="border-t border-rim pt-2">
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              icon={<Swords size={14} />}
              onClick={() => go("/practice")}
            >
              Practice vs Bots
            </Button>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showStats    && <StatsModal    onClose={() => setShowStats(false)}    />}
    </>
  );
}
