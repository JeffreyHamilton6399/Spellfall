"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Swords, Star, BarChart2 } from "lucide-react";
import type { GameState } from "@/engine/types";
import { recordMatch, type MatchResult } from "@/lib/stats";
import { playVictory, playDefeat } from "@/lib/audio";
import { useSettings } from "@/contexts/SettingsContext";
import StatsModal from "./StatsModal";

interface Props {
  state: GameState;
  humanId: string;
  onPlayAgain: () => void;
}

export default function EndScreen({ state, humanId, onPlayAgain }: Props) {
  const { settings } = useSettings();
  const [showStats, setShowStats] = useState(false);
  const [statsRecorded, setStatsRecorded] = useState(false);

  const human = state.players[humanId];
  const ranked = state.playerIds
    .map((id) => state.players[id])
    .sort((a, b) => {
      if (a.isAlive && !b.isAlive) return -1;
      if (!a.isAlive && b.isAlive) return 1;
      return b.hp - a.hp;
    });

  const placement = ranked.findIndex((p) => p.id === humanId) + 1;
  const total = ranked.length;
  const isWinner = state.winnerId === humanId;
  const topThree = ranked.slice(0, 3);

  useEffect(() => {
    if (isWinner) playVictory();
    else playDefeat();

    if (!statsRecorded) {
      const result: MatchResult = {
        placement,
        totalPlayers: total,
        eliminations: human?.eliminations ?? 0,
        bestWord: human?.bestWord ?? null,
        pangrams: 0,
        totalDamageDealt: human?.damageDealtTotal ?? 0,
      };
      recordMatch(result);
      setStatsRecorded(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const placementText =
    isWinner ? "WINNER" : placement <= 3 ? `#${placement}` : `#${placement}`;

  const placementColor =
    isWinner ? "text-amber-400" : placement <= 3 ? "text-emerald-400" : "text-slate-200";

  const subText =
    isWinner
      ? `You outlasted all ${total - 1} opponents`
      : placement <= 3
      ? "Top 3 finish!"
      : placement <= 10
      ? "Solid performance"
      : "Keep practising";

  return (
    <>
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          className="w-full max-w-md flex flex-col items-center gap-6"
          initial={settings.reducedMotion ? {} : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Placement headline */}
          <div className="text-center">
            {isWinner && (
              <motion.div
                initial={settings.reducedMotion ? {} : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="text-amber-400 flex justify-center mb-2"
              >
                <Trophy size={48} />
              </motion.div>
            )}
            <h1
              className={`font-display font-black tracking-wide ${placementColor} ${
                isWinner ? "text-7xl" : "text-6xl"
              }`}
            >
              {placementText}
              {!isWinner && (
                <span className="text-slate-600 text-3xl ml-2 font-semibold">/ {total}</span>
              )}
            </h1>
            <p className="text-slate-400 mt-1 text-sm">{subText}</p>
          </div>

          {/* Stats row */}
          <div className="w-full grid grid-cols-3 gap-3">
            <StatCard label="Damage" value={human.damageDealtTotal} icon={<Swords size={14} />} />
            <StatCard label="Kills" value={human.eliminations} icon={<Swords size={14} />} />
            <StatCard
              label="Best word"
              value={human.bestWord?.word ?? "—"}
              sub={human.bestWord ? `${human.bestWord.score} pts` : undefined}
              icon={<Star size={14} />}
            />
          </div>

          {/* Top 3 */}
          <div className="w-full bg-arena-900 rounded-2xl border border-rim overflow-hidden">
            <div className="px-4 py-2.5 border-b border-rim flex items-center gap-2">
              <Trophy size={13} className="text-amber-400" />
              <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                Final standings
              </span>
            </div>
            <div className="divide-y divide-rim">
              {topThree.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="font-display font-black text-lg w-7 text-center"
                    style={{ color: i === 0 ? "#f59e0b" : i === 1 ? "#94a3b8" : "#cd7f32" }}>
                    {i + 1}
                  </span>
                  <span
                    className={`font-semibold truncate flex-1 ${
                      p.id === humanId ? "text-emerald-400" : "text-slate-200"
                    }`}
                  >
                    {p.name}
                  </span>
                  <span className="text-slate-500 text-sm font-mono">
                    {p.damageDealtTotal} dmg
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col gap-2">
            <button
              onClick={onPlayAgain}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold text-base rounded-xl transition-all"
            >
              Play Again
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="w-full py-3 bg-arena-800 hover:bg-arena-700 text-slate-300 font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-rim"
            >
              <BarChart2 size={15} />
              Career stats
            </button>
          </div>
        </motion.div>
      </div>

      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
    </>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-arena-900 border border-rim rounded-xl p-3 text-center">
      {icon && (
        <div className="text-slate-600 flex justify-center mb-1">{icon}</div>
      )}
      <div className="text-white font-bold text-lg font-display truncate">{value}</div>
      {sub && <div className="text-amber-400 text-xs font-semibold">{sub}</div>}
      <div className="text-slate-600 text-xs uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
