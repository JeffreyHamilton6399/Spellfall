export const RANKED_K_FACTOR = 32;

/**
 * Compute Elo rating deltas for a battle royale match.
 * Only human players are included; bots are excluded before calling this.
 *
 * Actual score  = normalized placement: 1.0 for 1st, 0.0 for last.
 * Expected score = 1 / (1 + 10^((avg_opponent_rating − player_rating) / 400)).
 * Delta          = K × (actual − expected), rounded to nearest integer.
 */
export function computeRatingDeltas(
  players: Array<{ userId: string; rating: number; placement: number }>
): Map<string, number> {
  const n = players.length;
  const deltas = new Map<string, number>();
  if (n < 2) {
    for (const p of players) deltas.set(p.userId, 0);
    return deltas;
  }

  for (const player of players) {
    const actual = (n - player.placement) / (n - 1);
    const others = players.filter((p) => p.userId !== player.userId);
    const avgOpponent = others.reduce((s, p) => s + p.rating, 0) / others.length;
    const expected = 1 / (1 + Math.pow(10, (avgOpponent - player.rating) / 400));
    deltas.set(player.userId, Math.round(RANKED_K_FACTOR * (actual - expected)));
  }

  return deltas;
}
