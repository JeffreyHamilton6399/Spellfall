"use client";

import { useState } from "react";
import { Zap, Clock, Shield, Skull, Droplets } from "lucide-react";
import { ABILITIES } from "@/engine/abilities";
import { BALANCE } from "@/engine/balance";
import type { StatusEffect } from "@/engine/types";
import TargetPicker from "./TargetPicker";
import { playAbilityFired } from "@/lib/audio";

interface Props {
  abilityId: string | null;
  energy: number;
  statuses: StatusEffect[];
  alivePlayers: { id: string; name: string }[];
  yourPlayerId: string;
  onUse: (abilityId: string, targetId?: string) => void;
}

export default function EnergyMeter({
  abilityId,
  energy,
  statuses,
  alivePlayers,
  yourPlayerId,
  onUse,
}: Props) {
  const [showTargetPicker, setShowTargetPicker] = useState(false);

  if (!abilityId) return null;
  const ability = ABILITIES[abilityId];
  if (!ability) return null;

  const pct = Math.min(100, (energy / BALANCE.energy.maxEnergy) * 100);
  const charged = energy >= BALANCE.energy.maxEnergy;

  const hasVenom   = statuses.some((s) => s.type === "VENOM");
  const hasLeech   = statuses.some((s) => s.type === "LIFELEECH");
  const hasShield  = statuses.some((s) => s.type === "SHIELD");
  const hasPending = statuses.some((s) => s.type === "SNIPE_PENDING" || s.type === "BLIND_PENDING");

  const statusNode = hasVenom ? (
    <span className="flex items-center gap-1 text-green-400"><Skull size={10} /> Venom</span>
  ) : hasLeech ? (
    <span className="flex items-center gap-1 text-rose-400"><Droplets size={10} /> Leech</span>
  ) : hasShield ? (
    <span className="flex items-center gap-1 text-sky-400"><Shield size={10} /> Shielded</span>
  ) : hasPending ? (
    <span className="flex items-center gap-1 text-amber-400"><Clock size={10} /> Next round</span>
  ) : null;

  const fire = () => {
    if (!charged) return;
    if (ability.targeting === "player") {
      setShowTargetPicker(true);
    } else {
      playAbilityFired();
      onUse(abilityId);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5 min-w-[90px]">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-400 flex items-center gap-1">
              <span>{ability.icon}</span>
              <span>{ability.name}</span>
            </span>
            <span className="text-slate-500 font-mono">{Math.floor(pct)}%</span>
          </div>
          <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                charged ? "bg-amber-400 animate-pulse" : "bg-blue-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {statusNode && (
            <div className="text-[10px] mt-0.5 font-medium">{statusNode}</div>
          )}
        </div>

        <button
          onClick={fire}
          disabled={!charged}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation ${
            charged
              ? "bg-amber-400 text-black hover:bg-amber-300 shadow-lg shadow-amber-400/25"
              : "bg-white/8 text-slate-600 cursor-not-allowed"
          }`}
        >
          <Zap size={12} />
          {charged ? "USE" : ""}
        </button>
      </div>

      {showTargetPicker && (
        <TargetPicker
          players={alivePlayers.filter((p) => p.id !== yourPlayerId)}
          onSelect={(targetId) => {
            setShowTargetPicker(false);
            playAbilityFired();
            onUse(abilityId, targetId);
          }}
          onCancel={() => setShowTargetPicker(false)}
          abilityName={ability.name}
          abilityIcon={ability.icon}
        />
      )}
    </>
  );
}
