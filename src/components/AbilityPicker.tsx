"use client";

import { ABILITIES, ABILITY_IDS } from "@/engine/abilities";
import AbilityIcon from "./AbilityIcon";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export default function AbilityPicker({ selectedId, onSelect, disabled }: Props) {
  return (
    <div className="w-full max-w-sm">
      <p className="text-slate-500 text-xs uppercase tracking-widest mb-3 text-center">
        Choose your ability
      </p>
      <div className="grid grid-cols-3 gap-2">
        {ABILITY_IDS.map((id) => {
          const ab = ABILITIES[id];
          const selected = selectedId === id;
          return (
            <button
              key={id}
              onClick={() => !disabled && onSelect(id)}
              disabled={disabled}
              title={ab.longDescription}
              className={`flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 border transition-all text-center touch-manipulation ${
                selected
                  ? "border-emerald-500 bg-emerald-900/30 ring-1 ring-emerald-500/40"
                  : "border-rim bg-arena-800 hover:bg-arena-700 hover:border-rim-hi"
              } ${disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <span className="flex items-center justify-center h-7">
                <AbilityIcon name={ab.icon} size={22} />
              </span>
              <span
                className={`text-xs font-bold leading-tight ${
                  selected ? "text-emerald-300" : "text-slate-300"
                }`}
              >
                {ab.name}
              </span>
              <span className="text-slate-500 text-[10px] leading-snug">
                {ab.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
