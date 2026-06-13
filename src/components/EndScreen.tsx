"use client";

import { useEffect, useRef, useState } from "react";
import { Trophy, Swords, Star, BarChart2, LogOut, RotateCcw } from "lucide-react";
import type { GameState } from "@/engine/types";
import { recordMatch, type MatchResult } from "@/lib/stats";
import { playVictory, playDefeat } from "@/lib/audio";
import { useSettings } from "@/contexts/SettingsContext";
import StatsModal from "./StatsModal";
import Button from "./ui/Button";

interface Props {
  state: GameState;
  humanId: string;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
}

function useCountUp(target: number, delay: number = 0, duration: number = 1000): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf: number;
    const timeout = setTimeout(() => {
      const start = Date.now();
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
      const tick = () => {
        const progress = Math.min((Date.now() - start) / duration, 1);
        setValue(Math.round(target * easeOut(progress)));
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf); };
  }, [target, delay, duration]);
  return value;
}

export default function EndScreen({ state, humanId, isHost, onPlayAgain, onLeave }: Props) {
  const { settings } = useSettings();
  const [showStats, setShowStats] = useState(false);
  const [visible, setVisible] = useState(false);
  const statsRecordedRef = useRef(false);

  const human   = state.players[humanId];
  // killFeed index = elimination order: index 0 = died first = worst placement
  const elimOrder = new Map<string, number>();
  state.killFeed.forEach((k, idx) => {
    if (!elimOrder.has(k.killedId)) elimOrder.set(k.killedId, idx);
  });

  const ranked  = state.playerIds
    .map((id) => state.players[id])
    .sort((a, b) => {
      if (a.isAlive && !b.isAlive) return -1;
      if (!a.isAlive && b.isAlive) return 1;
      // higher index = died later = better placement = sorts first in array
      const aOrder = elimOrder.get(a.id) ?? -1;
      const bOrder = elimOrder.get(b.id) ?? -1;
      return bOrder - aOrder;
    });

  const placement = ranked.findIndex((p) => p.id === humanId) + 1;
  const total     = ranked.length;
  const isWinner  = state.winnerId === humanId;
  const topThree  = ranked.slice(0, 3);
  const isPublic  = state.config.mode === "public";

  // Find who eliminated the human player from kill feed
  const elimEntry = !isWinner && state.killFeed
    ? [...state.killFeed].reverse().find(
        (k) => k.killedId === humanId && k.killerId !== null
      )
    : null;
  const killerName = elimEntry?.killerName ?? null;

  const dmgDisplay  = useCountUp(human?.damageDealtTotal ?? 0, 500,  1200);
  const killDisplay = useCountUp(human?.eliminations      ?? 0, 650,  900);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isWinner) {
      playVictory();
      if (!settings.reducedMotion) {
        import("canvas-confetti").then(({ default: confetti }) => {
          const colors = ["#10b981", "#34d399", "#6ee7b7", "#f59e0b", "#fbbf24", "#a78bfa"];
          const end = Date.now() + 2800;
          const sides = () => {
            confetti({ particleCount: 4, angle: 60,  spread: 55, origin: { x: 0 }, colors });
            confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors });
            if (Date.now() < end) requestAnimationFrame(sides);
          };
          setTimeout(() => {
            confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, colors, scalar: 1.2 });
          }, 150);
          requestAnimationFrame(sides);
        }).catch(() => {});
      }
    } else {
      playDefeat();
    }

    if (!statsRecordedRef.current) {
      statsRecordedRef.current = true;
      const result: MatchResult = {
        placement,
        totalPlayers: total,
        eliminations:    human?.eliminations     ?? 0,
        bestWord:        human?.bestWord          ?? null,
        pangrams:        0,
        totalDamageDealt: human?.damageDealtTotal ?? 0,
      };
      recordMatch(result);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subText = isWinner
    ? `You outlasted all ${total - 1} opponents`
    : placement <= 3 ? "Top 3 finish!"
    : placement <= 10 ? "Solid run"
    : "Keep practising";

  // Determine Play Again affordance:
  // Public rooms: anyone can rematch immediately
  // Private rooms: host can restart; non-host waits
  const canRematch = isPublic || isHost;

  return (
    <>
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center px-4 py-12">
        <div
          className={`w-full max-w-md flex flex-col items-center gap-6 transition-all duration-500 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* ── Headline ──────────────────────────── */}
          <div className="text-center">
            {isWinner ? (
              <>
                <div
                  className="text-amber-400 flex justify-center mb-3"
                  style={{
                    transform: visible ? "scale(1)" : "scale(0)",
                    transition: "transform 0.5s cubic-bezier(0.34,1.56,0.64,1) 150ms",
                  }}
                >
                  <Trophy size={52} strokeWidth={1.5} />
                </div>
                <h1
                  className={`font-display font-black text-7xl tracking-wide text-amber-400 leading-none ${
                    settings.reducedMotion ? "" : "animate-victory-glow"
                  }`}
                >
                  VICTORY
                </h1>
              </>
            ) : (
              <h1 className="font-display font-black text-6xl tracking-wide leading-none text-ink">
                #{placement}
                <span className="text-ink-4 text-2xl ml-2 font-semibold">/ {total}</span>
              </h1>
            )}
            <p className="text-ink-3 mt-2 text-sm">{subText}</p>
          </div>

          {/* ── Eliminated-by card ─────────────────── */}
          {!isWinner && killerName && (
            <div
              className="w-full bg-rose-950/40 border border-rose-800/40 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 200ms" }}
            >
              <Swords size={14} className="text-rose-400 flex-shrink-0" />
              <div className="text-sm text-rose-200 flex-1 min-w-0">
                Eliminated by{" "}
                <span className="font-semibold text-rose-100">{killerName}</span>
              </div>
            </div>
          )}

          {/* ── Stats ─────────────────────────────── */}
          <div
            className="w-full grid grid-cols-3 gap-3"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 300ms" }}
          >
            <StatCard label="Damage" value={dmgDisplay}  icon={<Swords size={14} />} />
            <StatCard label="Kills"  value={killDisplay} icon={<Swords size={14} />} />
            <StatCard
              label="Best word"
              value={human?.bestWord?.word ?? "—"}
              sub={human?.bestWord ? `${human.bestWord.score} pts` : undefined}
              icon={<Star size={14} />}
              mono={false}
            />
          </div>

          {/* ── Final standings ───────────────────── */}
          <div
            className="w-full bg-arena-900 rounded-2xl border border-rim overflow-hidden"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 450ms" }}
          >
            <div className="px-4 py-2.5 border-b border-rim flex items-center gap-2">
              <Trophy size={13} className="text-amber-400" />
              <span className="text-[10px] text-ink-4 uppercase tracking-widest font-semibold">
                Final standings
              </span>
            </div>
            <div className="divide-y divide-rim">
              {topThree.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className="font-display font-black text-lg w-7 text-center"
                    style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#cd7f32" }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`font-semibold truncate flex-1 text-sm ${
                      p.id === humanId ? "text-emerald-400" : "text-ink"
                    }`}
                  >
                    {p.name}
                  </span>
                  <span className="text-ink-4 text-xs font-mono">{p.damageDealtTotal} dmg</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Actions ───────────────────────────── */}
          <div
            className="w-full flex flex-col gap-2"
            style={{ opacity: visible ? 1 : 0, transition: "opacity 0.5s ease 550ms" }}
          >
            {canRematch ? (
              <Button variant="primary" size="lg" fullWidth displayFont icon={<RotateCcw size={16} />} onClick={onPlayAgain}>
                Play Again
              </Button>
            ) : (
              <div className="text-center text-ink-3 text-sm py-2">
                Waiting for host to restart…
              </div>
            )}
            <Button
              variant="ghost"
              size="md"
              fullWidth
              icon={<BarChart2 size={15} />}
              onClick={() => setShowStats(true)}
            >
              Career stats
            </Button>
            <Button
              variant="ghost"
              size="md"
              fullWidth
              icon={<LogOut size={15} />}
              onClick={onLeave}
            >
              Leave
            </Button>
          </div>
        </div>
      </div>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </>
  );
}

function StatCard({
  label, value, sub, icon, mono = true,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="bg-arena-900 border border-rim rounded-xl p-3 text-center">
      {icon && <div className="text-ink-4 flex justify-center mb-1">{icon}</div>}
      <div className={`text-white font-bold text-lg font-display truncate ${mono ? "tabular-nums" : ""}`}>
        {value}
      </div>
      {sub && <div className="text-amber-400 text-xs font-semibold">{sub}</div>}
      <div className="text-ink-4 text-[10px] uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
