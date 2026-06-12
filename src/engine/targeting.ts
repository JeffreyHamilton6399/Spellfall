import type { GameState } from "./types";
import { TARGETS_PER_ATTACK } from "./constants";

/** Returns IDs of the `count` living players nearest to the attacker in HP rank. */
export function selectTargets(
  attackerId: string,
  state: GameState,
  count: number = TARGETS_PER_ATTACK
): string[] {
  const alive = state.playerIds.filter(
    (id) => state.players[id].isAlive && id !== attackerId
  );

  if (alive.length === 0) return [];

  // Build HP-sorted ranking of ALL living players (including attacker)
  const ranked = [...alive, attackerId]
    .filter((id) => state.players[id].isAlive)
    .sort((a, b) => state.players[b].hp - state.players[a].hp);

  const attackerRank = ranked.indexOf(attackerId);

  // Sort other alive players by absolute rank distance from attacker
  const sorted = alive
    .map((id) => ({
      id,
      distance: Math.abs(ranked.indexOf(id) - attackerRank),
    }))
    .sort((a, b) => a.distance - b.distance || a.id.localeCompare(b.id));

  return sorted.slice(0, count).map((x) => x.id);
}
