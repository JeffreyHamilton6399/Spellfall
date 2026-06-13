"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import RankedBadge from "@/components/RankedBadge";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  rating: number;
  ranked_matches_played: number;
  ranked_wins: number;
  rank_position: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [myRank,  setMyRank]  = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers: Record<string, string> = {};
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

    fetch("/api/leaderboard", { headers })
      .then((r) => r.json() as Promise<{ entries: LeaderboardEntry[]; myRank: number | null }>)
      .then((d) => {
        setEntries(d.entries ?? []);
        setMyRank(d.myRank ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  return (
    <div className="min-h-dvh bg-arena-950 flex flex-col">
      <div className="border-b border-rim px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-ink-3 hover:text-ink hover:bg-arena-800 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display font-bold text-xl text-white flex-1">Leaderboard</h1>
        {myRank && (
          <span className="text-ink-4 text-sm">Your rank: <span className="text-emerald-400 font-bold">#{myRank}</span></span>
        )}
      </div>

      <div className="max-w-lg mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="text-ink-4 text-sm text-center py-12">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="text-ink-4 text-sm text-center py-12">
            No ranked players yet. Complete 5 placement matches to appear here.
          </div>
        ) : (
          <div className="bg-arena-900 border border-rim rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-rim flex items-center gap-2">
              <Trophy size={13} className="text-amber-400" />
              <span className="text-[10px] text-ink-4 uppercase tracking-widest font-semibold">Top Players</span>
            </div>
            <div className="divide-y divide-rim">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                  <span
                    className="font-display font-black text-base w-8 text-center tabular-nums"
                    style={{
                      color: entry.rank_position === 1 ? "#f59e0b"
                           : entry.rank_position === 2 ? "#94a3b8"
                           : entry.rank_position === 3 ? "#cd7f32"
                           : undefined,
                    }}
                  >
                    #{entry.rank_position}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-ink font-semibold text-sm truncate">{entry.display_name}</div>
                    <div className="text-ink-4 text-xs">{entry.ranked_matches_played}g · {entry.ranked_wins}W</div>
                  </div>
                  <RankedBadge
                    rating={entry.rating}
                    rankedMatchesPlayed={entry.ranked_matches_played}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
