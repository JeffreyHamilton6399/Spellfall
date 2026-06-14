// Local-first player stats. Persisted in localStorage.
// Supabase sync added for logged-in users.

import { supabase } from "@/lib/supabase";

export interface BestWord {
  word: string;
  score: number;
}

export interface PlayerStats {
  playerId: string;
  matches: number;
  wins: number;
  top3: number;
  totalEliminations: number;
  bestWord: BestWord | null;
  pangrams: number;
  totalDamageDealt: number;
  lastPlayedAt: string | null; // ISO string
}

const STATS_KEY = "spellfall_stats";
const ID_KEY = "spellfall_player_id";

function makeId(): string {
  return "plr_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = makeId();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getStats(): PlayerStats {
  const id = getOrCreatePlayerId();
  const empty: PlayerStats = {
    playerId: id,
    matches: 0,
    wins: 0,
    top3: 0,
    totalEliminations: 0,
    bestWord: null,
    pangrams: 0,
    totalDamageDealt: 0,
    lastPlayedAt: null,
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return empty;
    return { ...empty, ...JSON.parse(raw), playerId: id };
  } catch {
    return empty;
  }
}

export interface MatchResult {
  placement: number;
  totalPlayers: number;
  eliminations: number;
  bestWord: BestWord | null;
  pangrams: number;
  totalDamageDealt: number;
}

export function recordMatch(result: MatchResult): PlayerStats {
  const current = getStats();
  const updated: PlayerStats = {
    ...current,
    matches: current.matches + 1,
    wins: current.wins + (result.placement === 1 ? 1 : 0),
    top3: current.top3 + (result.placement <= 3 ? 1 : 0),
    totalEliminations: current.totalEliminations + result.eliminations,
    pangrams: current.pangrams + result.pangrams,
    totalDamageDealt: current.totalDamageDealt + result.totalDamageDealt,
    lastPlayedAt: new Date().toISOString(),
    bestWord:
      result.bestWord &&
      (!current.bestWord || result.bestWord.score > current.bestWord.score)
        ? result.bestWord
        : current.bestWord,
  };
  if (typeof window !== "undefined") {
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  }
  return updated;
}

// ── Supabase sync ──────────────────────────────────────────────────────────

export async function migrateLocalStatsToSupabase(userId: string): Promise<void> {
  try {
    const local = getStats();
    if (local.matches === 0) return;

    const { data: existing } = await supabase
      .from("player_stats")
      .select("matches_played, wins, total_eliminations, best_word, best_word_score, pangrams")
      .eq("user_id", userId)
      .maybeSingle();

    const serverMatches = (existing as { matches_played?: number } | null)?.matches_played ?? 0;
    if (serverMatches >= local.matches) return;

    const row = existing as {
      wins?: number; total_eliminations?: number;
      best_word?: string | null; best_word_score?: number; pangrams?: number;
    } | null;

    await supabase.from("player_stats").upsert({
      user_id: userId,
      matches_played: Math.max(local.matches, serverMatches),
      wins: Math.max(local.wins, row?.wins ?? 0),
      total_eliminations: Math.max(local.totalEliminations, row?.total_eliminations ?? 0),
      best_word:
        local.bestWord && local.bestWord.score > (row?.best_word_score ?? 0)
          ? local.bestWord.word
          : (row?.best_word ?? null),
      best_word_score: Math.max(local.bestWord?.score ?? 0, row?.best_word_score ?? 0),
      pangrams: Math.max(local.pangrams, row?.pangrams ?? 0),
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Migration is best-effort; don't crash the app
  }
}

export async function syncMatchToSupabase(userId: string, result: MatchResult): Promise<void> {
  try {
    const { data: current } = await supabase
      .from("player_stats")
      .select("matches_played, wins, total_eliminations, best_word, best_word_score, pangrams")
      .eq("user_id", userId)
      .maybeSingle();

    const row = current as {
      matches_played?: number; wins?: number; total_eliminations?: number;
      best_word?: string | null; best_word_score?: number; pangrams?: number;
    } | null;

    await supabase.from("player_stats").upsert({
      user_id: userId,
      matches_played: (row?.matches_played ?? 0) + 1,
      wins: (row?.wins ?? 0) + (result.placement === 1 ? 1 : 0),
      total_eliminations: (row?.total_eliminations ?? 0) + result.eliminations,
      best_word:
        result.bestWord && result.bestWord.score > (row?.best_word_score ?? 0)
          ? result.bestWord.word
          : (row?.best_word ?? null),
      best_word_score:
        result.bestWord && result.bestWord.score > (row?.best_word_score ?? 0)
          ? result.bestWord.score
          : (row?.best_word_score ?? 0),
      pangrams: (row?.pangrams ?? 0) + result.pangrams,
      updated_at: new Date().toISOString(),
    });
  } catch {
    // Sync is best-effort; local stats are the fallback
  }
}
