"use client";

import { memo } from "react";
import { Flame } from "lucide-react";
import AbilityIcon from "./AbilityIcon";
import type { GameState, Player } from "@/engine/types";
import { getVisibleStatuses } from "@/engine/types";
import { ABILITIES } from "@/engine/abilities";
import StatusIcons from "./StatusIcons";
import HpBar from "./HpBar";

// ── Individual row — memo'd so only changed players re-render ───────────────
const PlayerRow = memo(function PlayerRow({
  player,
  rank,
  isHuman,
  wordCount,
}: {
  player: Player;
  rank: number;
  isHuman: boolean;
  wordCount: number;
}) {
  const ability = player.abilityId ? ABILITIES[player.abilityId] : null;
  const visibleStatuses = getVisibleStatuses(player.statuses);

  return (
    <div
      className={`rounded-lg px-2 py-1.5 transition-opacity ${
        player.isAlive ? "opacity-100" : "opacity-25"
      } ${isHuman ? "bg-white/8 ring-1 ring-emerald-500/30" : "bg-white/4"}`}
    >
      <div className="flex items-center gap-1 mb-1">
        <span className="text-slate-600 text-[10px] w-4 flex-shrink-0 font-mono">
          {player.isAlive ? rank + 1 : "—"}
        </span>
        <span
          className={`text-xs font-semibold truncate flex-1 leading-none ${
            isHuman ? "text-emerald-300" : "text-slate-300"
          }`}
        >
          {player.name}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {wordCount > 0 && player.isAlive && (
            <span className="flex items-center gap-0.5 text-orange-400">
              <Flame size={9} />
              <span className="text-[10px] font-mono font-bold">{wordCount}</span>
            </span>
          )}
          {ability && (
            <span title={ability.name} className="text-slate-500 opacity-50">
              <AbilityIcon name={ability.icon} size={9} />
            </span>
          )}
          <StatusIcons statuses={visibleStatuses} />
          <span className="text-slate-500 font-mono text-[10px]">
            {player.isAlive ? `${player.hp}` : "—"}
          </span>
        </div>
      </div>
      <HpBar hp={player.hp} />
    </div>
  );
});

// ── List container — shallow-compares key fields to skip ticks with no change
interface Props {
  state: GameState;
  humanId: string;
  wordCounts?: Record<string, number>;
}

function playerListEqual(prev: Props, next: Props): boolean {
  if (prev.humanId !== next.humanId) return false;
  if (prev.state.playerIds.length !== next.state.playerIds.length) return false;
  // Check each player's relevant fields
  for (const id of prev.state.playerIds) {
    const p = prev.state.players[id];
    const n = next.state.players[id];
    if (!n) return false;
    if (
      p.hp !== n.hp ||
      p.isAlive !== n.isAlive ||
      p.statuses.length !== n.statuses.length ||
      (prev.wordCounts?.[id] ?? 0) !== (next.wordCounts?.[id] ?? 0)
    )
      return false;
  }
  return true;
}

const PlayerList = memo(function PlayerList({
  state,
  humanId,
  wordCounts = {},
}: Props) {
  const alive = state.playerIds
    .filter((id) => state.players[id].isAlive)
    .sort((a, b) => state.players[b].hp - state.players[a].hp);

  const dead = state.playerIds
    .filter((id) => !state.players[id].isAlive)
    .reverse();

  const rows = [...alive, ...dead];

  return (
    <div className="flex flex-col gap-0.5">
      {rows.map((id, rank) => (
        <PlayerRow
          key={id}
          player={state.players[id]}
          rank={rank}
          isHuman={id === humanId}
          wordCount={wordCounts[id] ?? 0}
        />
      ))}
    </div>
  );
}, playerListEqual);

export default PlayerList;
