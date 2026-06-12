import {
  SCRABBLE_VALUES,
  LENGTH_MULTIPLIERS,
  DECAY_FACTOR,
  PANGRAM_HEAL,
  PANGRAM_DAMAGE_BONUS,
} from "./constants";
import { canMakeWord } from "./dictionary";

export function tileScore(word: string): number {
  return word
    .toUpperCase()
    .split("")
    .reduce((sum, ch) => sum + (SCRABBLE_VALUES[ch] ?? 0), 0);
}

export function getLengthMultiplier(length: number): number {
  const capped = Math.min(length, 7);
  return LENGTH_MULTIPLIERS[capped] ?? LENGTH_MULTIPLIERS[7];
}

/** A pangram uses all rack tiles exactly as many times as they appear (word.length === rack.length). */
export function isPangram(word: string, rack: string[]): boolean {
  return word.length === rack.length && canMakeWord(word, rack);
}

export function calculateWordDamage(
  word: string,
  rack: string[],
  submissionIndex: number
): {
  baseScore: number;
  lengthMultiplier: number;
  decayMultiplier: number;
  finalDamage: number;
  isPangram: boolean;
  heal: number;
} {
  const pangram = isPangram(word, rack);
  const baseScore = tileScore(word);
  const lengthMultiplier = getLengthMultiplier(word.length);
  const decayMultiplier = Math.pow(DECAY_FACTOR, submissionIndex);
  const bonus = pangram ? PANGRAM_DAMAGE_BONUS : 1.0;
  const finalDamage = Math.max(
    1,
    Math.round(baseScore * lengthMultiplier * decayMultiplier * bonus)
  );
  const heal = pangram ? PANGRAM_HEAL : 0;

  return {
    baseScore,
    lengthMultiplier,
    decayMultiplier,
    finalDamage,
    isPangram: pangram,
    heal,
  };
}
