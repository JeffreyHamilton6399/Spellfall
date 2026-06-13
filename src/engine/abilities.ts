export type AbilityTargeting = "none" | "player";
export type AbilityTrigger = "instant" | "next-word" | "next-round";

export interface AbilityDef {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  /** Lucide icon name — rendered via AbilityIcon component */
  icon: string;
  targeting: AbilityTargeting;
  trigger: AbilityTrigger;
}

export const ABILITIES: Record<string, AbilityDef> = {
  letter_snipe: {
    id: "letter_snipe",
    name: "Letter Snipe",
    description: "Secret 8th letter next round.",
    longDescription: "Next round you get a private 8th letter no one else has.",
    icon: "Crosshair",
    targeting: "none",
    trigger: "next-round",
  },
  venom_word: {
    id: "venom_word",
    name: "Venom Word",
    description: "Poison targets for 5 dmg/round.",
    longDescription: "Your next word poisons targets: 5 dmg/round for 3 rounds.",
    icon: "Skull",
    targeting: "none",
    trigger: "next-word",
  },
  word_shield: {
    id: "word_shield",
    name: "Word Shield",
    description: "Block all word damage this round.",
    longDescription: "Block all incoming word damage this round.",
    icon: "Shield",
    targeting: "none",
    trigger: "instant",
  },
  lifeleech: {
    id: "lifeleech",
    name: "Lifeleech",
    description: "Next word heals 50% of damage dealt.",
    longDescription: "Your next word heals you for 50% of its total damage.",
    icon: "Droplets",
    targeting: "none",
    trigger: "next-word",
  },
  scramble: {
    id: "scramble",
    name: "Scramble",
    description: "Reroll the shared rack instantly.",
    longDescription: "Immediately reroll the shared rack. Timer continues.",
    icon: "Shuffle",
    targeting: "none",
    trigger: "instant",
  },
  blind: {
    id: "blind",
    name: "Blind",
    description: "Hide a target's rack for 5s.",
    longDescription: "Target's rack is hidden for the first 5s of next round.",
    icon: "EyeOff",
    targeting: "player",
    trigger: "instant",
  },
};

export const ABILITY_IDS = Object.keys(ABILITIES);

// Tier-based bot ability assignment
export const BOT_ABILITY_POOL: Record<string, string[]> = {
  novice:  ["letter_snipe", "word_shield"],
  casual:  ["word_shield", "lifeleech"],
  skilled: ["venom_word", "letter_snipe", "lifeleech"],
  expert:  ["scramble", "blind", "venom_word"],
};
