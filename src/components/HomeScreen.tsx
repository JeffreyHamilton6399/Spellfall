"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Zap, Globe, Lock, Hash, Swords, Trophy, Settings } from "lucide-react";
import { unlock } from "@/lib/audio";
import { useAuth } from "@/contexts/AuthContext";
import ProfileCorner from "./ProfileCorner";
import RankedBadge from "./RankedBadge";
import FloatingLetters from "./FloatingLetters";
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
  const { user, profile, session: authSession } = useAuth();
  const [name, setName]         = useState(initialName ?? "");
  const [nameSet, setNameSet]   = useState(!!initialName);
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
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

  // Auto-populate name from profile for signed-in users
  useEffect(() => {
    if (profile?.display_name && !nameSet) {
      setName(profile.display_name);
      setNameSet(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.display_name]);

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
    const sessionId = user ? user.id : getOrCreateSession();
    const displayName = name || "Player";
    const params = new URLSearchParams({ name: displayName, session: sessionId });
    if (authSession?.access_token) params.set("token", authSession.access_token);
    router.push(`${path}?${params.toString()}`);
  };

  /* ── Name entry screen ─────────────────────────────────────────────── */
  if (!nameSet) {
    return (
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-8 px-4 relative">
        <FloatingLetters />
        <div className="relative z-[1] flex flex-col items-center gap-8 w-full">
          <div className="text-center animate-slide-in-up" style={{ animationDelay: "0ms" }}>
            <h1 className="font-display font-black text-7xl tracking-wide text-white leading-none">
              SPELL<span className="text-emerald-400">FALL</span>
            </h1>
            <p className="mt-2 text-ink-3 text-sm">Enter a name to play</p>
          </div>
          <div className="flex gap-2 w-full max-w-xs animate-slide-in-up" style={{ animationDelay: "80ms" }}>
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
          <button
            onClick={() => router.push("/auth/login")}
            className="text-ink-4 hover:text-ink-3 text-xs transition-colors animate-slide-in-up"
            style={{ animationDelay: "140ms" }}
          >
            Have an account? Sign in
          </button>
        </div>
      </div>
    );
  }

  /* ── Main menu ─────────────────────────────────────────────────────── */
  return (
    <>
      <FloatingLetters />
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-6 px-4 relative z-[1]">

        {/* Top-right controls */}
        <div className="absolute top-4 right-4">
          <ProfileCorner />
        </div>

        {/* App settings — bottom-left corner */}
        <div className="absolute bottom-4 left-4">
          <button
            onClick={() => router.push("/settings")}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-4 hover:text-ink-3 hover:bg-arena-900 transition-colors"
            aria-label="App Settings"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Logo */}
        <div className="text-center animate-slide-in-up" style={{ animationDelay: "0ms" }}>
          <h1 className="font-display font-black text-7xl tracking-wide text-white leading-none">
            SPELL<span className="text-emerald-400">FALL</span>
          </h1>
          <p className="mt-1.5 text-ink-4 text-xs tracking-widest uppercase">
            Word Battle Royale
          </p>
        </div>

        <div className="w-full max-w-xs flex flex-col gap-3 animate-slide-in-up" style={{ animationDelay: "90ms" }}>

          {/* ── Primary CTA: Quick Play ──────────────────────────── */}
          <button
            onClick={() => go("/play")}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:brightness-90 rounded-2xl py-5 px-5 flex flex-col items-center gap-1 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <Zap size={20} className="text-emerald-200" />
              <span className="font-display font-black text-2xl tracking-wide text-white">Quick Play</span>
            </div>
            <span className="text-emerald-200/70 text-sm">Jump into the next public match</span>
          </button>

          {/* ── Ranked CTA ───────────────────────────────────────── */}
          {user ? (
            <button
              onClick={() => go("/play/ranked")}
              className="w-full bg-amber-950/60 hover:bg-amber-900/60 border border-amber-700/40 hover:border-amber-600/60 active:brightness-90 rounded-2xl py-4 px-5 flex items-center gap-3 transition-colors"
            >
              <Trophy size={18} className="text-amber-400 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="font-display font-black text-lg tracking-wide text-amber-200">Ranked</div>
                <div className="text-amber-400/60 text-xs">Compete for rating and tiers</div>
              </div>
              {profile && (
                <RankedBadge
                  rating={profile.rating}
                  rankedMatchesPlayed={profile.ranked_matches_played}
                  size="sm"
                  showLabel={false}
                />
              )}
            </button>
          ) : (
            <button
              onClick={() => router.push("/auth/login?mode=signin")}
              className="w-full bg-arena-900/60 border border-rim/60 rounded-2xl py-4 px-5 flex items-center gap-3 transition-colors hover:bg-arena-800/60"
            >
              <Trophy size={18} className="text-ink-4 flex-shrink-0" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-base text-ink-3">Ranked</div>
                <div className="text-ink-4 text-xs">Sign in to play ranked mode</div>
              </div>
            </button>
          )}

          {/* ── Secondary row: Create + Browse ───────────────────── */}
          <div className="grid grid-cols-2 gap-2.5">
            <SecondaryCard
              icon={<Lock size={15} className="text-amber-400" />}
              label="Create Room"
              description="Host a private game"
              onClick={() => go(`/play/${generateRoomCode()}`)}
            />
            <SecondaryCard
              icon={<Globe size={15} className="text-sky-400" />}
              label="Browse Rooms"
              description="Find open lobbies"
              onClick={() => go("/browse")}
            />
          </div>

          {/* ── Tertiary: Join with Code ──────────────────────────── */}
          <div className="bg-arena-900/60 border border-rim/60 rounded-xl overflow-hidden">
            {!showJoin ? (
              <button
                onClick={() => setShowJoin(true)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-arena-800/60 transition-colors group"
              >
                <Hash size={14} className="text-violet-400 flex-shrink-0" />
                <span className="text-sm text-ink-3 font-medium flex-1">Join with Code</span>
                <ChevronRight size={12} className="text-rim-hi group-hover:translate-x-0.5 transition-transform" />
              </button>
            ) : (
              <div className="px-3 py-3 flex flex-col gap-2.5">
                <div className="flex items-center gap-2">
                  <Hash size={13} className="text-violet-400 flex-shrink-0" />
                  <span className="text-sm text-ink-3 font-medium flex-1">Join with Code</span>
                  <button
                    onClick={() => { setShowJoin(false); setJoinCode(""); }}
                    className="text-ink-4 hover:text-ink-3 text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-2">
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
                    placeholder="Enter code (e.g. 7XK4)"
                    maxLength={4}
                    className="flex-1 bg-arena-800 border border-rim focus:border-rim-hi rounded-xl px-3 py-2.5 text-ink placeholder-ink-4 font-mono text-sm outline-none transition-colors"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={joinCode.length < 2}
                    onClick={() => { if (joinCode) go(`/play/${joinCode}`); }}
                  >
                    Join
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── Ghost link: Practice ──────────────────────────────── */}
          <button
            onClick={() => go("/practice")}
            className="w-full flex items-center justify-center gap-2 py-2 text-ink-4 hover:text-ink-3 transition-colors"
          >
            <Swords size={13} />
            <span className="text-sm">Practice vs Bots</span>
          </button>
        </div>
      </div>

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

function SecondaryCard({
  icon, label, description, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start gap-2 bg-arena-900 border border-rim hover:border-rim-hi hover:bg-arena-800 rounded-xl px-4 py-4 text-left transition-colors group"
    >
      <span className="flex-shrink-0">{icon}</span>
      <div>
        <div className="text-sm font-semibold text-ink leading-tight">{label}</div>
        <div className="text-xs text-ink-4 mt-0.5">{description}</div>
      </div>
    </button>
  );
}
