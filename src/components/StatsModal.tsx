"use client";

import { X, Trophy, Swords, Star, Zap } from "lucide-react";
import { getStats, type PlayerStats } from "@/lib/stats";
import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
}

export default function StatsModal({ onClose }: Props) {
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    setStats(getStats());
  }, []);

  const winRate =
    stats && stats.matches > 0
      ? Math.round((stats.wins / stats.matches) * 100)
      : 0;

  const top3Rate =
    stats && stats.matches > 0
      ? Math.round((stats.top3 / stats.matches) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-arena-900 border border-rim rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rim">
          <h2 className="font-display font-bold text-xl text-white tracking-wide">Your Stats</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {!stats || stats.matches === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm">No matches played yet.</p>
            <p className="text-xs mt-1">Play a game to start tracking stats.</p>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            {/* Top grid */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                icon={<Trophy size={14} />}
                label="Matches"
                value={stats.matches}
                color="text-amber-400"
              />
              <StatCard
                icon={<Trophy size={14} />}
                label="Wins"
                value={`${stats.wins} (${winRate}%)`}
                color="text-emerald-400"
              />
              <StatCard
                icon={<Trophy size={14} />}
                label="Top 3"
                value={`${stats.top3} (${top3Rate}%)`}
                color="text-sky-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<Swords size={14} />}
                label="Eliminations"
                value={stats.totalEliminations}
                color="text-rose-400"
              />
              <StatCard
                icon={<Zap size={14} />}
                label="Total damage"
                value={stats.totalDamageDealt}
                color="text-orange-400"
              />
            </div>

            {/* Best word */}
            <div className="bg-arena-800 rounded-xl p-4 flex items-center gap-4">
              <Star size={18} className="text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Best word</div>
                {stats.bestWord ? (
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-mono font-bold text-white text-lg uppercase tracking-widest">
                      {stats.bestWord.word}
                    </span>
                    <span className="text-amber-400 text-sm font-semibold">
                      {stats.bestWord.score} pts
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 text-sm">—</span>
                )}
              </div>
            </div>

            {stats.pangrams > 0 && (
              <div className="text-center text-xs text-emerald-400/70">
                {stats.pangrams} pangram{stats.pangrams !== 1 ? "s" : ""} found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-arena-800 rounded-xl p-3 flex flex-col gap-1">
      <div className={`flex items-center gap-1.5 ${color}`}>{icon}</div>
      <div className="text-white font-bold text-base leading-tight">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
