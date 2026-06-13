"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { playDamageTaken } from "@/lib/audio";

interface Floater {
  id: number;
  value: number;
  isHeal: boolean;
  x: number; // % offset
}

let nextId = 0;

interface Props {
  hp: number;
}

export default function DamageNumbers({ hp }: Props) {
  const { settings } = useSettings();
  const prevRef = useRef(hp);
  const [floaters, setFloaters] = useState<Floater[]>([]);

  useEffect(() => {
    const delta = hp - prevRef.current;
    prevRef.current = hp;
    if (delta === 0) return;

    const isHeal = delta > 0;
    if (!isHeal) playDamageTaken();

    const id = ++nextId;
    setFloaters((prev) => [
      ...prev.slice(-6),
      { id, value: Math.abs(delta), isHeal, x: 30 + Math.random() * 40 },
    ]);

    const t = setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 1200);
    return () => clearTimeout(t);
  }, [hp]);

  if (settings.reducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-30" aria-hidden>
      {floaters.map((f) => (
        <div
          key={f.id}
          className="absolute animate-float-up font-display font-black text-xl select-none"
          style={{
            left: `${f.x}%`,
            bottom: "50%",
            color: f.isHeal ? "#10b981" : "#f43f5e",
            textShadow: "0 2px 8px rgba(0,0,0,0.8)",
          }}
        >
          {f.isHeal ? "+" : "-"}{f.value}
        </div>
      ))}
    </div>
  );
}
