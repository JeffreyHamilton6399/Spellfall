"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";

interface Props {
  hp: number;
  maxHp?: number;
  colorblind?: boolean;
}

export default function HpBar({ hp, maxHp = 100 }: Props) {
  const { settings } = useSettings();
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const prevPctRef = useRef(pct);
  const [lagPct, setLagPct] = useState(pct);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pct < prevPctRef.current) {
      // HP dropped — lag bar stays, then catches up
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setLagPct(pct), settings.reducedMotion ? 0 : 480);
    } else {
      // HP healed or unchanged
      if (timerRef.current) clearTimeout(timerRef.current);
      setLagPct(pct);
    }
    prevPctRef.current = pct;
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [pct, settings.reducedMotion]);

  const barColor = settings.colorblindMode
    ? pct > 60 ? "#3b82f6" : pct > 30 ? "#f59e0b" : "#f43f5e"
    : pct > 60 ? "#10b981"  : pct > 30 ? "#f59e0b" : "#f43f5e";

  return (
    <div className="relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      {/* Lag bar */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-rose-900/80"
        style={{
          width: `${lagPct}%`,
          transition: settings.reducedMotion ? "none" : "width 0.7s ease-out",
        }}
      />
      {/* Current HP */}
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${pct}%`,
          backgroundColor: barColor,
          transition: settings.reducedMotion ? "none" : "width 0.15s ease-out, background-color 0.3s",
        }}
      />
    </div>
  );
}
