"use client";

import { Flame } from "lucide-react";
import type { GameState } from "@/engine/types";
import { getVisibleStatuses } from "@/engine/types";
import { ABILITIES } from "@/engine/abilities";
import StatusIcons from "./StatusIcons";
import HpBar from "./HpBar";

interface Props {
  state: GameState;
  humanId: string;
  wordCounts?: Record<string, number>;
}

export default function PlayerList({ state, humanId, wordCounts = {} }: Props) {
  const alive = state.playerIds
    .filter((id) => state.players[id].isAlive)
    .sort((a, b) => state.players[b].hp - state.players[a].hp);

  const dead = state.playerIds
    .filter((id) => !state.players[id].isAlive)
    .reverse();

  const rows = [...alive, ...dead];

  return (
    <div className="flex flex-col gap-0.5 overflow-y-auto max-h-full">
      {rows.map((id, rank) => {
        const p = state.players[id];
        const isHuman = id === humanId;
        const wc = wordCounts[id] ?? 0;
        const ability = p.abilityId ? ABILITIES[p.abilityId] : null;
        const visibleStatuses = getVisibleStatuses(p.statuses);

        return (
          <div
            key={id}
            className={`rounded-lg px-2 py-1.5 transition-opacity ${
              p.isAlive ? "opacity-100" : "opacity-25"
            } ${isHuman ? "bg-white/8 ring-1 ring-emerald-500/30" : "bg-white/4"}`}
          >
            <div className="flex items-center gap-1 mb-1">
              {/* Rank */}
              <span className="text-slate-600 text-[10px] w-4 flex-shrink-0 font-mono">
                {p.isAlive ? rank + 1 : "—"}
              </span>

              {/* Name */}
              <span
                className={`text-xs font-semibold truncate flex-1 leading-none ${
                  isHuman ? "text-emerald-300" : "text-slate-300"
                }`}
              >
                {p.name}
              </span>

              {/* Indicators */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {wc > 0 && p.isAlive && (
                  <span className="flex items-center gap-0.5 text-orange-400">
                    <Flame size={9} />
                    <span className="text-[10px] font-mono font-bold">{wc}</span>
                  </span>
                )}
                {ability && (
                  <span title={ability.name} className="text-[10px] opacity-50">
                    {ability.icon}
                  </span>
                )}
                <StatusIcons statuses={visibleStatuses} />
                <span className="text-slate-500 font-mono text-[10px]">
                  {p.isAlive ? `${p.hp}` : "✗"}
                </span>
              </div>
            </div>

            <HpBar hp={p.hp} />
          </div>
        );
      })}
    </div>
  );
}
