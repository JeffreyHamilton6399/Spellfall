"use client";

import { Skull, Shield, EyeOff, Snowflake, ArrowLeftRight } from "lucide-react";
import type { VisibleStatusType } from "@/engine/types";

const ICON_MAP: Record<VisibleStatusType, { icon: React.ReactNode; color: string; title: string }> = {
  POISONED:   { icon: <Skull size={10} />,           color: "text-green-400",   title: "Poisoned"  },
  SHIELDED:   { icon: <Shield size={10} />,           color: "text-sky-400",     title: "Shielded"  },
  BLINDED:    { icon: <EyeOff size={10} />,           color: "text-violet-400",  title: "Blinded"   },
  FROZEN:     { icon: <Snowflake size={10} />,        color: "text-cyan-300",    title: "Frozen"    },
  REFLECTING: { icon: <ArrowLeftRight size={10} />,   color: "text-amber-300",   title: "Reflecting" },
};

export default function StatusIcons({ statuses }: { statuses: VisibleStatusType[] }) {
  if (statuses.length === 0) return null;
  return (
    <span className="flex gap-0.5">
      {statuses.map((s) => {
        const { icon, color, title } = ICON_MAP[s];
        return (
          <span key={s} title={title} className={color}>
            {icon}
          </span>
        );
      })}
    </span>
  );
}
