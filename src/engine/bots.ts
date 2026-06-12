import type { BotConfig, BotTier } from "./types";
import { BOT_ABILITY_POOL } from "./abilities";

// Names are intentionally mis-matched with skill tier ~30% of the time.
// grandma_carol (expert) and xX_LexMaster_Xx (novice) are load-bearing jokes.
interface BotTemplate {
  name: string;
  tier: BotTier;
}

const BOT_POOL: BotTemplate[] = [
  // Novice — some with absurdly tryhard names
  { name: "TippyToes92", tier: "novice" },
  { name: "xX_LexMaster_Xx", tier: "novice" },
  { name: "W0RD_G0D_2012", tier: "novice" },
  { name: "Bingo_Bongo", tier: "novice" },
  { name: "CoolKid_xD", tier: "novice" },
  { name: "VocabDestroyer", tier: "novice" },

  // Casual
  { name: "just_here4fun", tier: "casual" },
  { name: "MidnightMuncher", tier: "casual" },
  { name: "TacoBellGaming", tier: "casual" },
  { name: "beige_rectangle", tier: "casual" },
  { name: "noodlearms66", tier: "casual" },
  { name: "QuietRoger", tier: "casual" },
  { name: "GardenSnail_7", tier: "casual" },

  // Skilled — a couple sandbagging names
  { name: "cozy_knitter", tier: "skilled" }, // sandbagger
  { name: "just_vibing22", tier: "skilled" }, // sandbagger
  { name: "professor_plum", tier: "skilled" },
  { name: "VelvetHammer", tier: "skilled" },
  { name: "ThatcherMoss", tier: "skilled" },
  { name: "CipherThyme", tier: "skilled" },

  // Expert — grandma_carol leads the pack
  { name: "grandma_carol", tier: "expert" }, // ultimate sandbagger
  { name: "LexiconReaper", tier: "expert" },
  { name: "VoidSpeller", tier: "expert" },
  { name: "silent_storm", tier: "expert" },
  { name: "QuantumQuill", tier: "expert" },
  { name: "AbyssalScribe", tier: "expert" },
  { name: "ZeroHourWren", tier: "expert" },
];

const TIER_CONFIGS: Record<BotTier, BotConfig> = {
  novice: {
    tier: "novice",
    reactionDelayMs: [5000, 14000],
    wordLengthBias: "short",
    vocabFraction: 0.25,
    wordsPerRound: [1, 2],   // guaranteed at least 1 word; previously could play 0
  },
  casual: {
    tier: "casual",
    reactionDelayMs: [3000, 10000],
    wordLengthBias: "balanced",   // upgraded from "short" — plays 4-5 letter words
    vocabFraction: 0.45,
    wordsPerRound: [1, 3],
  },
  skilled: {
    tier: "skilled",
    reactionDelayMs: [2000, 7000],
    wordLengthBias: "balanced",
    vocabFraction: 0.72,
    wordsPerRound: [2, 4],
  },
  expert: {
    tier: "expert",
    reactionDelayMs: [800, 4000],
    wordLengthBias: "long",
    vocabFraction: 1.0,          // knows all words; previously 0.90
    wordsPerRound: [3, 6],       // high output; previously [2, 4]
  },
};

/** Fisher-Yates shuffle (mutates). */
function shuffle<T>(arr: T[], rng: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Seeded LCG so bot order is reproducible per match seed. */
function makeRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

/** Returns configs for `count` bots, shuffled from the pool. */
export function generateBotConfigs(
  count: number,
  seed: number = Date.now()
): Array<{ name: string; config: BotConfig; abilityId: string }> {
  const rng = makeRng(seed);
  const pool = shuffle([...BOT_POOL], rng);
  const results: Array<{ name: string; config: BotConfig; abilityId: string }> = [];
  for (let i = 0; i < count; i++) {
    const template = pool[i % pool.length];
    const name = i >= pool.length ? `${template.name}_${i}` : template.name;
    const abilityPool = BOT_ABILITY_POOL[template.tier];
    const abilityId = abilityPool[Math.floor(rng() * abilityPool.length)];
    results.push({ name, config: TIER_CONFIGS[template.tier], abilityId });
  }
  return results;
}

/** Returns a USE_ABILITY target for bots with targeted abilities (e.g. blind). */
export function pickAbilityTarget(
  botId: string,
  playerIds: string[],
  players: Record<string, { isAlive: boolean; id: string }>,
  rng: () => number
): string | undefined {
  const targets = playerIds.filter((id) => id !== botId && players[id]?.isAlive);
  if (targets.length === 0) return undefined;
  return targets[Math.floor(rng() * targets.length)];
}

// Deterministic hash for per-bot vocabulary — same bot always knows the same words.
function fnv1a(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function botKnowsWord(
  botId: string,
  word: string,
  vocabFraction: number
): boolean {
  if (vocabFraction >= 1.0) return true;
  return (fnv1a(botId + word) % 1000) / 1000 < vocabFraction;
}

/** Picks bot's words for a round: filters possible words by vocab and length bias,
 *  returns up to `maxWords` entries sorted by the bot's preference. */
export function pickBotWords(
  botId: string,
  config: BotConfig,
  possibleWords: string[],
  alreadyPlayed: Set<string>,
  maxWords: number
): string[] {
  const known = possibleWords.filter(
    (w) =>
      !alreadyPlayed.has(w) && botKnowsWord(botId, w, config.vocabFraction)
  );

  // Sort by length bias
  known.sort((a, b) => {
    if (config.wordLengthBias === "long") return b.length - a.length;
    if (config.wordLengthBias === "short") return a.length - b.length;
    // balanced: prefer medium lengths (4-5)
    const score = (l: number) => -Math.abs(l - 4.5);
    return score(b.length) - score(a.length);
  });

  return known.slice(0, maxWords);
}

export function randInt(min: number, max: number, rng: () => number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export { makeRng };
