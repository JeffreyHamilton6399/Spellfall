"use client";

import { X, Trophy, Swords, Star, Zap, Cloud } from "lucide-react";
import { getStats, type PlayerStats } from "@/lib/stats";
import { useAuth } from "@/contexts/AuthContext";
import { supabase, type DbPlayerStats } from "@/lib/supabase";
import { useEffect, useState } from "react";

interface Props {
  onClose: () => void;
}

export default function StatsModal({ onClose }: Props) {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [remoteStats, setRemoteStats] = useState<DbPlayerStats | null>(null);

  useEffect(() => {
    setStats(getStats());
    if (user) {
      supabase
        .from("player_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data }) => { if (data) setRemoteStats(data as DbPlayerStats); });
    }
  }, [user]);

  // Prefer Supabase stats for logged-in users; fall back to local
  const matches = remoteStats?.matches_played ?? stats?.matches ?? 0;
  const wins = remoteStats?.wins ?? stats?.wins ?? 0;
  const eliminations = remoteStats?.total_eliminations ?? stats?.totalEliminations ?? 0;
  const top3 = stats?.top3 ?? 0;
  const pangrams = remoteStats?.pangrams ?? stats?.pangrams ?? 0;
  const bestWord = remoteStats
    ? (remoteStats.best_word ? { word: remoteStats.best_word, score: remoteStats.best_word_score } : null)
    : stats?.bestWord ?? null;

  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const top3Rate = matches > 0 ? Math.round((top3 / matches) * 100) : 0;

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

        {matches === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="text-sm">No matches played yet.</p>
            <p className="text-xs mt-1">Play a game to start tracking stats.</p>
          </div>
        ) : (
          <div className="p-5 flex flex-col gap-4">
            {user && remoteStats && (
              <div className="flex items-center gap-1.5 text-ink-4 text-xs">
                <Cloud size={11} />
                <span>Synced to account</span>
              </div>
            )}

            {/* Top grid */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard icon={<Trophy size={14} />} label="Matches" value={matches} color="text-amber-400" />
              <StatCard icon={<Trophy size={14} />} label="Wins" value={`${wins} (${winRate}%)`} color="text-emerald-400" />
              <StatCard icon={<Trophy size={14} />} label="Top 3" value={`${top3} (${top3Rate}%)`} color="text-sky-400" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatCard icon={<Swords size={14} />} label="Eliminations" value={eliminations} color="text-rose-400" />
              <StatCard icon={<Zap size={14} />} label="Pangrams" value={pangrams} color="text-orange-400" />
            </div>

            {/* Best word */}
            <div className="bg-arena-800 rounded-xl p-4 flex items-center gap-4">
              <Star size={18} className="text-amber-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500 uppercase tracking-wider">Best word</div>
                {bestWord ? (
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-mono font-bold text-white text-lg uppercase tracking-widest">
                      {bestWord.word}
                    </span>
                    <span className="text-amber-400 text-sm font-semibold">
                      {bestWord.score} pts
                    </span>
                  </div>
                ) : (
                  <span className="text-slate-500 text-sm">—</span>
                )}
              </div>
            </div>
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
