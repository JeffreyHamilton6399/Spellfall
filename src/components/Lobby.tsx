"use client";

import type { ReactNode } from "react";
import { Swords, TrendingDown, Sparkles, Skull, Zap, ArrowLeft } from "lucide-react";

interface TipItem {
  icon: ReactNode;
  text: string;
}

const TIPS: TipItem[] = [
  { icon: <Swords size={14} />,        text: "7 letters, 20 sec rounds" },
  { icon: <Swords size={14} />,        text: "Damage the 3 nearest rivals" },
  { icon: <TrendingDown size={14} />,  text: "25% decay per extra word" },
  { icon: <Sparkles size={14} />,      text: "Pangram = heal + bonus dmg" },
  { icon: <Skull size={14} />,         text: "Submit nothing = zone damage" },
  { icon: <Zap size={14} />,           text: "Sudden death at final 3" },
];

interface Props {
  onPlay: () => void;
  onLeave?: () => void;
  abilityPicker?: ReactNode;
}

export default function Lobby({ onPlay, onLeave, abilityPicker }: Props) {
  return (
    <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-8 px-4 py-10 relative">
      {onLeave && (
        <div className="absolute top-4 left-4">
          <button
            onClick={onLeave}
            className="flex items-center gap-1.5 text-ink-4 hover:text-ink-3 text-xs font-medium transition-colors py-1.5 px-2 rounded-lg hover:bg-arena-900"
          >
            <ArrowLeft size={13} />
            Home
          </button>
        </div>
      )}
      <div className="text-center">
        <h1 className="font-display font-black text-7xl tracking-wide text-white leading-none">
          SPELL<span className="text-emerald-400">FALL</span>
        </h1>
        <p className="mt-3 text-slate-500 max-w-xs text-sm leading-relaxed mx-auto">
          Battle royale word game. Submit words each round to damage opponents. Last player standing wins.
        </p>
      </div>

      {/* Tips grid */}
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
        {TIPS.map(({ icon, text }, i) => (
          <div
            key={i}
            className="bg-arena-900 border border-rim rounded-xl px-3 py-2.5 flex items-center gap-2.5"
          >
            <span className="text-slate-500 flex-shrink-0">{icon}</span>
            <span className="text-slate-400 text-xs leading-snug">{text}</span>
          </div>
        ))}
      </div>

      {abilityPicker}

      <button
        onClick={onPlay}
        className="w-full max-w-xs py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-display font-black text-2xl tracking-wide rounded-2xl transition-all shadow-lg shadow-emerald-900/40"
      >
        Play
      </button>

      <p className="text-slate-700 text-xs">Practice mode · 1 human vs 19 bots</p>
    </div>
  );
}
