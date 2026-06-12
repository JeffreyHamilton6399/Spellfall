"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings, BarChart2, ChevronRight, Swords } from "lucide-react";
import { unlock } from "@/lib/audio";
import SettingsModal from "./SettingsModal";
import StatsModal from "./StatsModal";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SPELL-";
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
  const [name, setName] = useState(initialName ?? "");
  const [nameSet, setNameSet] = useState(!!initialName);
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
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

  if (!nameSet) {
    return (
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-8 px-4">
        <div className="text-center">
          <h1 className="font-display font-black text-7xl tracking-wide text-white">
            SPELL<span className="text-emerald-400">FALL</span>
          </h1>
          <p className="mt-2 text-slate-500 text-sm">Enter a name to play</p>
        </div>
        <div className="flex gap-2 w-full max-w-xs">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z0-9_\s\-]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && saveName()}
            maxLength={20}
            placeholder="Your name…"
            className="flex-1 bg-arena-800 border border-rim focus:border-slate-500 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 text-base font-semibold outline-none transition-colors"
            autoComplete="off"
            spellCheck={false}
          />
          <button
            onClick={saveName}
            className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-8 px-4 relative">
        {/* Top-right controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <button
            onClick={() => setShowStats(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/8 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Stats"
          >
            <BarChart2 size={18} />
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/8 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Logo */}
        <div className="text-center">
          <h1 className="font-display font-black text-7xl tracking-wide text-white leading-none">
            SPELL<span className="text-emerald-400">FALL</span>
          </h1>
          <p className="mt-2 text-slate-500 text-sm">
            Welcome back,{" "}
            <button
              onClick={() => setNameSet(false)}
              className="text-slate-300 hover:text-white transition-colors underline decoration-slate-600 underline-offset-2"
            >
              {name}
            </button>
          </p>
        </div>

        {/* Mode buttons */}
        <div className="flex flex-col gap-2.5 w-full max-w-xs">
          <button
            onClick={() => go("/play")}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-display font-black text-2xl tracking-wide rounded-2xl transition-all shadow-lg shadow-emerald-900/40"
          >
            Quick Play
          </button>

          <button
            onClick={() => go(`/play/${generateRoomCode()}`)}
            className="w-full py-3.5 bg-arena-800 hover:bg-arena-700 text-slate-200 font-bold text-base rounded-2xl transition-colors border border-rim"
          >
            Create Private Room
          </button>

          {!showJoin ? (
            <button
              onClick={() => setShowJoin(true)}
              className="w-full py-3 bg-arena-900 hover:bg-arena-800 text-slate-400 hover:text-slate-200 font-semibold rounded-2xl transition-colors border border-rim"
            >
              Join with Code
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                ref={joinRef}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && joinCode.length >= 4) {
                    const code = joinCode.startsWith("SPELL-") ? joinCode : `SPELL-${joinCode}`;
                    go(`/play/${code}`);
                  }
                }}
                placeholder="SPELL-XXXX"
                maxLength={10}
                className="flex-1 bg-arena-800 border border-rim focus:border-slate-500 rounded-xl px-4 py-3 text-white placeholder-slate-600 font-mono text-base outline-none transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
              <button
                onClick={() => {
                  if (!joinCode) return;
                  const code = joinCode.startsWith("SPELL-") ? joinCode : `SPELL-${joinCode}`;
                  go(`/play/${code}`);
                }}
                className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
              >
                Join
              </button>
            </div>
          )}

          <div className="border-t border-rim pt-2">
            <button
              onClick={() => go("/practice")}
              className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Swords size={14} />
              Practice vs Bots
            </button>
          </div>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </>
  );
}
