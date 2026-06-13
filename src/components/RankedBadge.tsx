"use client";

import { getTier, getTierDef, PLACEMENT_MATCHES_REQUIRED, type Tier } from "@/lib/tiers";

interface Props {
  rating: number;
  rankedMatchesPlayed: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function RankedBadge({
  rating,
  rankedMatchesPlayed,
  size = "md",
  showLabel = true,
}: Props) {
  const tier = getTier(rating, rankedMatchesPlayed);
  const def  = getTierDef(tier);

  const sizeStyles = {
    sm: { wrap: "gap-1",   badge: "w-5 h-5 text-[10px]", text: "text-xs" },
    md: { wrap: "gap-1.5", badge: "w-6 h-6 text-xs",     text: "text-sm" },
    lg: { wrap: "gap-2",   badge: "w-8 h-8 text-sm",     text: "text-base" },
  }[size];

  if (tier === "unranked") {
    const remaining = PLACEMENT_MATCHES_REQUIRED - rankedMatchesPlayed;
    return (
      <span className={`inline-flex items-center ${sizeStyles.wrap}`}>
        <span
          className={`${sizeStyles.badge} rounded-md bg-arena-700 border border-rim flex items-center justify-center font-bold text-ink-4`}
        >
          ?
        </span>
        {showLabel && (
          <span className={`text-ink-4 ${sizeStyles.text}`}>
            {rankedMatchesPlayed === 0 ? "Unranked" : `${remaining} placement${remaining !== 1 ? "s" : ""} left`}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center ${sizeStyles.wrap}`}>
      <span
        className={`${sizeStyles.badge} rounded-md flex items-center justify-center font-display font-black border`}
        style={{
          backgroundColor: def.color + "22",
          borderColor: def.color + "55",
          color: def.color,
        }}
      >
        {def.abbr}
      </span>
      {showLabel && (
        <span className={`font-semibold tabular-nums ${sizeStyles.text}`} style={{ color: def.color }}>
          {def.label} {rating}
        </span>
      )}
    </span>
  );
}
