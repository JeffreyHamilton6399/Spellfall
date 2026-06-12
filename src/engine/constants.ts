export const MAX_HP = 100;
export const PLAYER_COUNT = 20;
export const RACK_SIZE = 7;
export const MIN_VOWELS = 2;
export const MIN_GUARANTEE_LENGTH = 5;
export const PANGRAM_HEAL = 20;
export const DECAY_FACTOR = 0.75;
export const TARGETS_PER_ATTACK = 3;
export const CHIP_DAMAGE_BASE = 5;
export const CHIP_DAMAGE_PER_ROUND = 2;
export const SUDDEN_DEATH_CHIP_MULTIPLIER = 3;
export const PANGRAM_DAMAGE_BONUS = 1.5;

export const SCRABBLE_VALUES: Record<string, number> = {
  A: 1, E: 1, I: 1, O: 1, U: 1, L: 1, N: 1, S: 1, T: 1, R: 1,
  D: 2, G: 2,
  B: 3, C: 3, M: 3, P: 3,
  F: 4, H: 4, V: 4, W: 4, Y: 4,
  K: 5,
  J: 8, X: 8,
  Q: 10, Z: 10,
};

// Standard Scrabble tile distribution
export const TILE_DISTRIBUTION: Record<string, number> = {
  A: 9, B: 2, C: 2, D: 4, E: 12, F: 2, G: 3, H: 2, I: 9,
  J: 1, K: 1, L: 4, M: 2, N: 6, O: 8, P: 2, Q: 1, R: 6,
  S: 4, T: 6, U: 4, V: 2, W: 2, X: 1, Y: 2, Z: 1,
};

export const VOWELS = new Set(["A", "E", "I", "O", "U"]);

// Length multipliers cap at 7 (pangram length)
export const LENGTH_MULTIPLIERS: Record<number, number> = {
  2: 0.5,
  3: 1.0,
  4: 1.2,
  5: 1.5,
  6: 2.0,
  7: 2.5,
};

export const DEFAULT_LOBBY_CONFIG = {
  mode: "public" as const,
  maxPlayers: 20,
  botBackfill: true,
  countdownSeconds: 5,
  roundSeconds: 20,
  suddenDeathRoundSeconds: 12,
  suddenDeathThreshold: 3,
};
