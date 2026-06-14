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
    gainPerDamage: 2.5,         // energy per damage dealt (was 1.2 — buffed for more frequent activation)
    gainPerDamageTaken: 0.6,    // comeback mechanic: taking hits also charges your ability
    gainPerRound: 5,            // passive energy every round regardless of activity
  },
  poison: {
    damagePerRound: 6,          // per-round poison tick (was 5)
    durationRounds: 3,          // refreshes on re-application (does NOT stack)
  },
  shield: {
    durationRounds: 1,          // rounds of incoming-word-damage immunity
  },
  lifeleech: {
    healFraction: 0.45,         // fraction of (finalDamage × targetCount) returned as HP (was 0.5)
  },
  blind: {
    durationMs: 5000,           // ms the rack is hidden at next round start
  },
  freeze: {
    durationMs: 5000,           // ms the target can't submit at next round start
  },
  cleanse: {
    healAmount: 20,             // HP healed when cleansing debuffs
  },
  reflect: {
    durationRounds: 1,          // rounds of damage reflection
    fraction: 0.35,             // fraction of incoming word damage reflected back
  },
  energy_steal: {
    drainFraction: 0.6,         // fraction of target's energy drained
    selfGainCap: 30,            // max energy absorbed by caster from the steal
  },
};
