"use client";

import { X } from "lucide-react";
import AbilityIcon from "./AbilityIcon";

interface Props {
  players: { id: string; name: string }[];
  onSelect: (targetId: string) => void;
  onCancel: () => void;
  abilityName: string;
  abilityIcon: string;
}

export default function TargetPicker({ players, onSelect, onCancel, abilityName, abilityIcon }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-arena-900 border border-rim rounded-2xl p-5 w-full max-w-xs flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-slate-300 mb-1.5">
              <AbilityIcon name={abilityIcon} size={22} />
            </div>
            <div className="text-white font-bold text-base">{abilityName}</div>
            <div className="text-slate-500 text-sm">Choose a target</div>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className="w-full py-3 px-4 bg-arena-800 hover:bg-arena-700 text-white font-semibold rounded-xl transition-colors text-left border border-rim hover:border-rim-hi touch-manipulation"
            >
              {p.name}
            </button>
          ))}
          {players.length === 0 && (
            <div className="text-slate-500 text-center py-4 text-sm">No valid targets</div>
          )}
        </div>
      </div>
    </div>
  );
}
