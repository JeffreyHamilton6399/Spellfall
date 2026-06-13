export type Tier = "unranked" | "bronze" | "silver" | "gold" | "platinum" | "diamond" | "master";

export interface TierDef {
  tier: Tier;
  label: string;
  minRating: number;
  color: string;
  abbr: string;
}

export const PLACEMENT_MATCHES_REQUIRED = 5;
export const RATING_FLOOR = 100;

export const TIER_DEFS: TierDef[] = [
  { tier: "bronze",   label: "Bronze",   minRating: 0,    color: "#cd7f32", abbr: "B" },
  { tier: "silver",   label: "Silver",   minRating: 1200, color: "#94a3b8", abbr: "S" },
  { tier: "gold",     label: "Gold",     minRating: 1400, color: "#fbbf24", abbr: "G" },
  { tier: "platinum", label: "Platinum", minRating: 1600, color: "#e2e8f0", abbr: "P" },
  { tier: "diamond",  label: "Diamond",  minRating: 1800, color: "#7dd3fc", abbr: "D" },
  { tier: "master",   label: "Master",   minRating: 2000, color: "#f87171", abbr: "M" },
];

export function getTier(rating: number, rankedMatchesPlayed: number): Tier {
  if (rankedMatchesPlayed < PLACEMENT_MATCHES_REQUIRED) return "unranked";
  for (let i = TIER_DEFS.length - 1; i >= 0; i--) {
    if (rating >= TIER_DEFS[i].minRating) return TIER_DEFS[i].tier;
  }
  return "bronze";
}

export function getTierDef(tier: Tier): TierDef {
  return TIER_DEFS.find((t) => t.tier === tier) ?? TIER_DEFS[0];
}

/** Rating band for matchmaking: players within ±200 points can be matched. */
export function ratingBucket(rating: number): number {
  return Math.floor(rating / 200) * 200;
}
