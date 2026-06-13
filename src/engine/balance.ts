// All tunable balance numbers live here — edit freely between sessions.

export const BALANCE = {
  ranked: {
    kFactor: 32,
    ratingFloor: 100,
    placementMatchesRequired: 5,
    queueWindowMs: 3 * 60 * 1000,  // 3-minute matchmaking windows
  },
  energy: {
    maxEnergy: 100,
    gainPerDamage: 1.2,         // energy per damage dealt — tuned for ~2-3 activations per match
    gainPerDamageTaken: 0.4,    // comeback mechanic: taking hits also charges your ability
  },
  poison: {
    damagePerRound: 5,
    durationRounds: 3,      // refreshes to this on re-application (does NOT stack damage)
  },
  shield: {
    durationRounds: 1,      // rounds of incoming-word-damage immunity
  },
  lifeleech: {
    healFraction: 0.5,      // fraction of (finalDamage × targetCount) returned as HP
  },
  blind: {
    durationMs: 5000,       // ms the rack is hidden at next round start
  },
};
