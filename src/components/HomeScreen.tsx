"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Settings, BarChart2, ChevronRight, Zap, Globe, Lock, Hash, Swords } from "lucide-react";
import { unlock } from "@/lib/audio";
import SettingsModal from "./SettingsModal";
import StatsModal from "./StatsModal";
import Button from "./ui/Button";

const TOS_KEY = "spellfall_terms_v1";

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
  const [showTos, setShowTos]           = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const joinRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!nameSet) nameRef.current?.focus(); }, [nameSet]);
  useEffect(() => { if (showJoin) joinRef.current?.focus(); }, [showJoin]);

  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem(TOS_KEY)) {
      setShowTos(true);
    }
  }, []);

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
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-6 px-4 relative">

        {/* Top-right controls */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={() => setShowStats(true)} aria-label="Stats">
            <BarChart2 size={18} />
          </Button>
          <Button variant="ghost" size="sm" className="w-9 h-9 p-0" onClick={() => setShowSettings(true)} aria-label="Settings">
            <Settings size={18} />
          </Button>
        </div>

        {/* Logo + greeting */}
        <div className="text-center">
          <h1 className="font-display font-black text-7xl tracking-wide text-white leading-none">
            SPELL<span className="text-emerald-400">FALL</span>
          </h1>
          <p className="mt-2 text-ink-3 text-sm">
            Playing as{" "}
            <button
              onClick={() => setNameSet(false)}
              className="text-ink-2 hover:text-ink transition-colors underline decoration-rim-hi underline-offset-2"
            >
              {name}
            </button>
          </p>
        </div>

        {/* ── Action cards ─────────────────────────────────────────────── */}
        <div className="w-full max-w-xs flex flex-col gap-2">

          {/* Quick Play */}
          <MenuCard
            icon={<Zap size={18} className="text-emerald-400" />}
            label="Quick Play"
            description="Jump into the next public match"
            accent
            onClick={() => go("/play")}
          />

          {/* Browse Rooms */}
          <MenuCard
            icon={<Globe size={18} className="text-sky-400" />}
            label="Browse Rooms"
            description="Pick an open public lobby"
            onClick={() => go("/browse")}
          />

          {/* Create Room */}
          <MenuCard
            icon={<Lock size={18} className="text-amber-400" />}
            label="Create Room"
            description="Host a private game for friends"
            onClick={() => go(`/play/${generateRoomCode()}`)}
          />

          {/* Join with Code — expands inline */}
          {!showJoin ? (
            <MenuCard
              icon={<Hash size={18} className="text-violet-400" />}
              label="Join with Code"
              description="Enter a SPELL-XXXX invite code"
              onClick={() => setShowJoin(true)}
            />
          ) : (
            <div className="bg-arena-900 border border-rim-hi rounded-2xl px-4 py-3.5 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <Hash size={18} className="text-violet-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-ink">Join with Code</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 flex items-center bg-arena-800 border border-rim focus-within:border-rim-hi rounded-xl overflow-hidden transition-colors">
                  <span className="pl-3 pr-0.5 text-ink-4 font-mono text-xs select-none pointer-events-none">
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
                      const stripped = raw.startsWith("SPELL") ? raw.slice(5) : raw;
                      setJoinCode(stripped.slice(0, 4));
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && joinCode.length >= 2) go(`/play/${joinCode}`);
                      if (e.key === "Escape") { setShowJoin(false); setJoinCode(""); }
                    }}
                    placeholder="XXXX"
                    maxLength={4}
                    className="flex-1 bg-transparent py-2.5 pr-3 text-ink placeholder-ink-4 font-mono text-sm outline-none min-w-0"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={joinCode.length < 2}
                  onClick={() => { if (joinCode) go(`/play/${joinCode}`); }}
                >
                  Join
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setShowJoin(false); setJoinCode(""); }}
                >
                  ✕
                </Button>
              </div>
            </div>
          )}

          {/* Practice — secondary, below divider */}
          <div className="border-t border-rim/50 pt-2 mt-1">
            <button
              onClick={() => go("/practice")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-ink-3 hover:text-ink-2 hover:bg-arena-900 transition-colors"
            >
              <Swords size={15} className="flex-shrink-0" />
              <span className="text-sm font-medium">Practice vs Bots</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4 text-ink-4 text-xs">
          <a href="/terms"   className="hover:text-ink-3 transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-ink-3 transition-colors">Privacy</a>
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showStats    && <StatsModal    onClose={() => setShowStats(false)}    />}

      {/* First-visit ToS modal */}
      {showTos && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-arena-900 border border-rim rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="font-display font-bold text-xl text-white">Welcome to Spellfall</h2>
            <p className="text-ink-3 text-sm leading-relaxed">
              By playing, you agree to our{" "}
              <a href="/terms" target="_blank" className="text-emerald-400 underline">Terms of Service</a>
              {" "}and{" "}
              <a href="/privacy" target="_blank" className="text-emerald-400 underline">Privacy Policy</a>.
              No account required — just pick a name and play.
            </p>
            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={() => {
                localStorage.setItem(TOS_KEY, "1");
                setShowTos(false);
              }}
            >
              Got it — Let&apos;s Play
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/* ── Menu card component ───────────────────────────────────────────────────── */
function MenuCard({
  icon,
  label,
  description,
  accent = false,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  accent?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border text-left transition-all group
        ${accent
          ? "bg-emerald-900/20 border-emerald-600/50 hover:border-emerald-500 hover:bg-emerald-900/30"
          : "bg-arena-900 border-rim hover:border-rim-hi hover:bg-arena-800"
        }`}
    >
      <span className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl bg-arena-800/80">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-bold leading-tight ${accent ? "text-emerald-200" : "text-ink"}`}>
          {label}
        </div>
        <div className="text-xs text-ink-4 mt-0.5 truncate">{description}</div>
      </div>
      <ChevronRight
        size={16}
        className={`flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
          accent ? "text-emerald-500" : "text-ink-4"
        }`}
      />
    </button>
  );
}
