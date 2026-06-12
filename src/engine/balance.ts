// All tunable balance numbers live here — edit freely between sessions.

export const BALANCE = {
  energy: {
    maxEnergy: 100,
    gainPerDamage: 0.4,     // energy points per damage point dealt (pre-shield, pre-target-mult)
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
