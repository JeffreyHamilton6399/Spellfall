// Local-first player stats. Persisted in localStorage.
// Structured so a backend sync can be added later.

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
