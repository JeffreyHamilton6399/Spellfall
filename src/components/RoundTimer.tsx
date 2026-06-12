"use client";

import { useEffect, useRef, useState } from "react";
import { playCountdownTick } from "@/lib/audio";

interface Props {
  endsAt: number;
  durationMs: number;
  isSuddenDeath: boolean;
  clockOffset?: number;
}

export default function RoundTimer({ endsAt, durationMs, isSuddenDeath, clockOffset = 0 }: Props) {
  const [remaining, setRemaining] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(-1);

  useEffect(() => {
    const update = () => {
      // clockOffset = serverNow - clientNow, corrects for client/server clock skew
      const r = Math.max(0, endsAt - (Date.now() + clockOffset));
      setRemaining(r);
      const s = Math.ceil(r / 1000);
      if (s <= 5 && s !== lastTickRef.current && s > 0) {
        lastTickRef.current = s;
        playCountdownTick(s === 1);
      }
      if (r > 0) rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [endsAt, clockOffset]);

  const seconds  = Math.ceil(remaining / 1000);
  const fraction = remaining / durationMs;
  const urgent   = seconds <= 5;

  const R = 40;
  const C = 2 * Math.PI * R;
  const offset = C * (1 - Math.max(0, Math.min(1, fraction)));

  const strokeColor = isSuddenDeath ? "#f43f5e" : urgent ? "#f59e0b" : "#10b981";

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" strokeWidth="7" stroke="rgba(255,255,255,0.07)" />
          <circle
            cx="50" cy="50" r={R}
            fill="none" strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            stroke={strokeColor}
            style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-display font-black text-3xl tabular-nums"
          style={{ color: urgent ? "#f59e0b" : "#e2e8f0" }}
        >
          {seconds}
        </span>
      </div>
      {isSuddenDeath && (
        <span className="text-[11px] font-bold text-rose-400 uppercase tracking-[0.15em] mt-1 animate-pulse">
          Sudden Death
        </span>
      )}
    </div>
  );
}
