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
  double_tap: {
    id: "double_tap",
    name: "Double Tap",
    description: "Next word hits twice.",
    longDescription: "Your next word deals double damage to all targets.",
    icon: "Zap",
    targeting: "none",
    trigger: "next-word",
  },
  energy_steal: {
    id: "energy_steal",
    name: "Steal",
    description: "Drain a target's energy by 60%.",
    longDescription: "Drain 60% of a target's energy and absorb a portion yourself.",
    icon: "TrendingDown",
    targeting: "player",
    trigger: "instant",
  },
  freeze: {
    id: "freeze",
    name: "Freeze",
    description: "Target can't submit for 5s next round.",
    longDescription: "Target cannot submit words for the first 5s of the next round.",
    icon: "Snowflake",
    targeting: "player",
    trigger: "instant",
  },
  cleanse: {
    id: "cleanse",
    name: "Cleanse",
    description: "Remove debuffs + heal 20 HP.",
    longDescription: "Remove all negative status effects and heal 20 HP.",
    icon: "Wind",
    targeting: "none",
    trigger: "instant",
  },
  reflect: {
    id: "reflect",
    name: "Reflect",
    description: "Bounce 35% of damage back for 1 round.",
    longDescription: "For 1 round, 35% of incoming word damage is reflected back to attackers.",
    icon: "ArrowLeftRight",
    targeting: "none",
    trigger: "instant",
  },
};

export const ABILITY_IDS = Object.keys(ABILITIES);

// Tier-based bot ability assignment
export const BOT_ABILITY_POOL: Record<string, string[]> = {
  novice:  ["letter_snipe", "word_shield", "cleanse"],
  casual:  ["word_shield", "lifeleech", "double_tap"],
  skilled: ["venom_word", "letter_snipe", "lifeleech", "freeze"],
  expert:  ["scramble", "blind", "venom_word", "reflect", "energy_steal"],
};
