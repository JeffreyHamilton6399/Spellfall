import {
  MAX_HP,
  RACK_SIZE,
  MIN_VOWELS,
  MIN_GUARANTEE_LENGTH,
  TILE_DISTRIBUTION,
  VOWELS,
  CHIP_DAMAGE_BASE,
  CHIP_DAMAGE_PER_ROUND,
  SUDDEN_DEATH_CHIP_MULTIPLIER,
} from "./constants";
import type {
  GameState,
  Player,
  RoundState,
  KillEvent,
  LobbyConfig,
  ScoredWord,
  PlayerRoundResult,
  StatusEffect,
  AbilityEvent,
} from "./types";
import type { GameEvent } from "./events";
import { isValidWord, canMakeWord, rackHasWordOfLength } from "./dictionary";
import { calculateWordDamage } from "./scoring";
import { selectTargets } from "./targeting";
import { ABILITIES } from "./abilities";
import { BALANCE } from "./balance";

// ── Rack generation ──────────────────────────────────────────────────────────

function buildTilePool(): string[] {
  const pool: string[] = [];
  for (const [letter, count] of Object.entries(TILE_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) pool.push(letter);
  }
  return pool;
}

const TILE_POOL = buildTilePool();

function sampleRack(pool: string[]): string[] {
  const available = [...pool];
  const rack: string[] = [];
  for (let i = 0; i < RACK_SIZE; i++) {
    const idx = Math.floor(Math.random() * available.length);
    rack.push(available[idx]);
    available.splice(idx, 1);
  }
  return rack;
}

function countVowels(rack: string[]): number {
  return rack.filter((l) => VOWELS.has(l)).length;
}

export function generateRack(dictionary: Set<string>): string[] {
  const pool = buildTilePool();
  for (let attempt = 0; attempt < 200; attempt++) {
    const rack = sampleRack(pool);
    if (countVowels(rack) < MIN_VOWELS) continue;
    if (!rackHasWordOfLength(rack, dictionary, MIN_GUARANTEE_LENGTH)) continue;
    return rack;
  }
  return ["A", "E", "I", "N", "R", "S", "T"];
}

function randomLetter(): string {
  return TILE_POOL[Math.floor(Math.random() * TILE_POOL.length)];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function nanoid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function tickStatuses(statuses: StatusEffect[]): StatusEffect[] {
  return statuses
    .map((s): StatusEffect => {
      if (s.type === "POISON") return { ...s, roundsLeft: s.roundsLeft - 1 };
      if (s.type === "SHIELD") return { ...s, roundsLeft: s.roundsLeft - 1 };
      return s;
    })
    .filter((s) => {
      if (s.type === "POISON" || s.type === "SHIELD") return s.roundsLeft > 0;
      return true; // BLIND, BLIND_PENDING, SNIPE_PENDING, LIFELEECH, VENOM persist until consumed
    });
}

function applyPoison(statuses: StatusEffect[]): StatusEffect[] {
  const existing = statuses.find((s) => s.type === "POISON");
  if (existing) {
    // Refresh duration, don't stack damage
    return statuses.map((s) =>
      s.type === "POISON"
        ? { type: "POISON", damagePerRound: BALANCE.poison.damagePerRound, roundsLeft: BALANCE.poison.durationRounds }
        : s
    );
  }
  return [
    ...statuses,
    { type: "POISON", damagePerRound: BALANCE.poison.damagePerRound, roundsLeft: BALANCE.poison.durationRounds },
  ];
}

// ── State constructors ───────────────────────────────────────────────────────

function createInitialState(config: LobbyConfig): GameState {
  return {
    phase: "lobby",
    players: {},
    playerIds: [],
    round: null,
    roundNumber: 0,
    countdownEndsAt: null,
    killFeed: [],
    winnerId: null,
    config,
    chipDamage: CHIP_DAMAGE_BASE,
    abilityFeed: [],
  };
}

function createPlayer(
  id: string,
  name: string,
  kind: "human" | "bot",
  bot: Player["bot"],
  abilityId: string | null
): Player {
  return {
    id,
    name,
    kind,
    hp: MAX_HP,
    isAlive: true,
    wordsPlayedThisMatch: [],
    damageDealtTotal: 0,
    eliminations: 0,
    bestWord: null,
    bot,
    abilityId,
    energy: 0,
    statuses: [],
    privateLetters: [],
  };
}

// ── Round lifecycle ──────────────────────────────────────────────────────────

function startRound(state: GameState, now: number, dictionary: Set<string>): GameState {
  const roundNumber = state.roundNumber + 1;
  const isSuddenDeath = state.phase === "sudden_death";
  const duration = isSuddenDeath
    ? state.config.suddenDeathRoundSeconds
    : state.config.roundSeconds;

  const letters = generateRack(dictionary);
  const chipDamage =
    (CHIP_DAMAGE_BASE + roundNumber * CHIP_DAMAGE_PER_ROUND) *
    (isSuddenDeath ? SUDDEN_DEATH_CHIP_MULTIPLIER : 1);

  // Process pending statuses for each player
  let players = { ...state.players };
  for (const pid of state.playerIds) {
    const p = players[pid];
    if (!p.isAlive) continue;

    let statuses = p.statuses;
    let privateLetters: string[] = []; // clear previous round's private letters

    // SNIPE_PENDING → assign bonus letter
    if (statuses.some((s) => s.type === "SNIPE_PENDING")) {
      privateLetters = [randomLetter()];
      statuses = statuses.filter((s) => s.type !== "SNIPE_PENDING");
    }

    // BLIND_PENDING → BLIND with timestamp
    if (statuses.some((s) => s.type === "BLIND_PENDING")) {
      statuses = [
        ...statuses.filter((s) => s.type !== "BLIND_PENDING"),
        { type: "BLIND", endsAt: now + BALANCE.blind.durationMs },
      ];
    }

    players[pid] = { ...p, statuses, privateLetters };
  }

  const round: RoundState = {
    roundNumber,
    letters,
    phase: "active",
    startedAt: now,
    endsAt: now + duration * 1000,
    submittedWords: {},
    results: null,
    taggedWords: {},
  };

  return { ...state, players, round, roundNumber, chipDamage };
}

// ── Round resolution ─────────────────────────────────────────────────────────

function resolveRound(state: GameState, now: number, dictionary: Set<string>): GameState {
  if (!state.round) return state;

  const round = { ...state.round, phase: "resolving" as const };
  const players = { ...state.players };
  const rack = round.letters;

  const results: Record<string, PlayerRoundResult> = {};

  for (const [playerId, words] of Object.entries(round.submittedWords)) {
    const scored: ScoredWord[] = [];
    let totalHeal = 0;

    const tempState = { ...state, players };
    const targets = selectTargets(playerId, tempState);
    const tagged = round.taggedWords[playerId] ?? {};

    words.forEach((word, i) => {
      const calc = calculateWordDamage(word, rack, i);
      const isVenom = tagged[word] === "venom";
      const isLeech = tagged[word] === "leech";
      const leechHeal = isLeech
        ? calc.finalDamage * targets.length * BALANCE.lifeleech.healFraction
        : 0;

      const sw: ScoredWord = {
        word,
        baseScore: calc.baseScore,
        lengthMultiplier: calc.lengthMultiplier,
        decayMultiplier: calc.decayMultiplier,
        finalDamage: calc.finalDamage,
        targetIds: targets,
        isPangram: calc.isPangram,
        heal: calc.heal,
        isVenom,
        isLeech,
        leechHeal,
      };
      scored.push(sw);
      totalHeal += calc.heal;
      if (isLeech) totalHeal += leechHeal;
    });

    const damageDealt = scored.reduce((s, w) => s + w.finalDamage, 0);
    results[playerId] = {
      playerId,
      words: scored,
      healedHp: totalHeal,
      tookChipDamage: false,
      chipDamageTaken: 0,
      damageDealt,
    };
  }

  // Non-submitters take chip damage
  const aliveIds = state.playerIds.filter((id) => players[id].isAlive);
  for (const pid of aliveIds) {
    if (!results[pid]) {
      results[pid] = {
        playerId: pid,
        words: [],
        healedHp: 0,
        tookChipDamage: true,
        chipDamageTaken: state.chipDamage,
        damageDealt: 0,
      };
    }
  }

  // Apply heals + damage
  const damageToPlayer: Record<string, Record<string, number>> = {};

  for (const result of Object.values(results)) {
    const { playerId } = result;

    // Pangram + lifeleech heals
    if (result.healedHp > 0) {
      const p = players[playerId];
      if (p) {
        players[playerId] = { ...p, hp: Math.min(MAX_HP, p.hp + result.healedHp) };
      }
    }

    // Word damage
    for (const sw of result.words) {
      for (const targetId of sw.targetIds) {
        const target = players[targetId];
        if (!target?.isAlive) continue;

        const shielded = target.statuses.some((s) => s.type === "SHIELD");
        if (!shielded) {
          if (!damageToPlayer[targetId]) damageToPlayer[targetId] = {};
          damageToPlayer[targetId][playerId] =
            (damageToPlayer[targetId][playerId] ?? 0) + sw.finalDamage;
          players[targetId] = { ...target, hp: target.hp - sw.finalDamage };
        }

        // Apply poison from venom word (even through shield — spec doesn't say shield blocks it)
        if (sw.isVenom) {
          players[targetId] = {
            ...players[targetId],
            statuses: applyPoison(players[targetId].statuses),
          };
        }
      }
    }

    // Chip damage
    if (result.tookChipDamage) {
      const p = players[playerId];
      if (p) players[playerId] = { ...p, hp: p.hp - result.chipDamageTaken };
    }

    // Energy gain from damage dealt
    const energyGain = result.damageDealt * BALANCE.energy.gainPerDamage;
    if (energyGain > 0) {
      const p = players[playerId];
      if (p) {
        players[playerId] = {
          ...p,
          energy: Math.min(BALANCE.energy.maxEnergy, p.energy + energyGain),
        };
      }
    }

    // Update attacker stats
    if (result.damageDealt > 0) {
      const p = players[playerId];
      if (p) {
        players[playerId] = {
          ...p,
          damageDealtTotal: p.damageDealtTotal + result.damageDealt,
          wordsPlayedThisMatch: [
            ...p.wordsPlayedThisMatch,
            ...result.words.map((w) => w.word),
          ],
          bestWord: result.words.reduce(
            (best, w) =>
              !best || w.baseScore > best.score
                ? { word: w.word, score: w.baseScore }
                : best,
            p.bestWord
          ),
        };
      }
    }
  }

  // Energy gain from damage taken (comeback mechanic)
  for (const pid of aliveIds) {
    const damageTaken = Object.values(damageToPlayer[pid] ?? {}).reduce((s, d) => s + d, 0);
    if (damageTaken > 0) {
      const p = players[pid];
      if (p) {
        players[pid] = {
          ...p,
          energy: Math.min(BALANCE.energy.maxEnergy, p.energy + damageTaken * BALANCE.energy.gainPerDamageTaken),
        };
      }
    }
  }

  // Poison tick damage
  for (const pid of aliveIds) {
    const p = players[pid];
    if (!p) continue;
    const poison = p.statuses.find((s) => s.type === "POISON") as
      | { type: "POISON"; damagePerRound: number; roundsLeft: number }
      | undefined;
    if (poison) {
      players[pid] = { ...p, hp: p.hp - poison.damagePerRound };
    }
  }

  // Tick statuses on all players
  for (const pid of Object.keys(players)) {
    const p = players[pid];
    players[pid] = { ...p, statuses: tickStatuses(p.statuses) };
  }

  // Detect eliminations
  const newKillFeed: KillEvent[] = [...state.killFeed];
  for (const pid of aliveIds) {
    const p = players[pid];
    if (!p || p.hp > 0) continue;

    const attackers = damageToPlayer[pid] ?? {};
    const killerId =
      Object.keys(attackers).length > 0
        ? Object.entries(attackers).sort(([, a], [, b]) => b - a)[0][0]
        : null;

    if (killerId && players[killerId]) {
      players[killerId] = {
        ...players[killerId],
        eliminations: players[killerId].eliminations + 1,
      };
    }

    players[pid] = { ...p, isAlive: false, hp: 0 };
    newKillFeed.push({
      id: nanoid(),
      killedId: pid,
      killedName: p.name,
      killerId,
      killerName: killerId ? players[killerId]?.name ?? null : null,
      round: round.roundNumber,
      timestamp: now,
    });
  }

  const stillAlive = state.playerIds.filter((id) => players[id]?.isAlive);
  let newPhase = state.phase;
  let winnerId = state.winnerId;

  if (stillAlive.length <= 1) {
    newPhase = "ended";
    winnerId = stillAlive[0] ?? null;
  } else if (
    state.phase === "playing" &&
    stillAlive.length <= state.config.suddenDeathThreshold
  ) {
    newPhase = "sudden_death";
  }

  const completedRound: RoundState = { ...round, phase: "complete", results };

  const nextState: GameState = {
    ...state,
    phase: newPhase,
    players,
    round: completedRound,
    killFeed: newKillFeed,
    winnerId,
  };

  if (newPhase !== "ended") {
    return startRound(nextState, now, dictionary);
  }
  return nextState;
}

// ── Ability effects ──────────────────────────────────────────────────────────

function applyAbility(
  state: GameState,
  playerId: string,
  abilityId: string,
  targetId: string | undefined,
  now: number,
  dictionary: Set<string>
): GameState {
  const player = state.players[playerId];
  if (!player?.isAlive) return state;
  if (player.energy < BALANCE.energy.maxEnergy) return state;
  if (player.abilityId !== abilityId) return state;
  const ability = ABILITIES[abilityId];
  if (!ability) return state;

  // Validate targeting
  if (ability.targeting === "player") {
    if (!targetId || !state.players[targetId]?.isAlive) return state;
  }

  let players = { ...state.players };

  // Consume energy
  players[playerId] = { ...player, energy: 0 };

  let round = state.round;

  switch (abilityId) {
    case "letter_snipe": {
      players[playerId] = addStatus(players[playerId], { type: "SNIPE_PENDING" });
      break;
    }
    case "venom_word": {
      players[playerId] = addStatus(players[playerId], { type: "VENOM" });
      break;
    }
    case "word_shield": {
      players[playerId] = addStatus(players[playerId], {
        type: "SHIELD",
        roundsLeft: BALANCE.shield.durationRounds,
      });
      break;
    }
    case "lifeleech": {
      players[playerId] = addStatus(players[playerId], { type: "LIFELEECH" });
      break;
    }
    case "scramble": {
      if (round?.phase === "active") {
        const newLetters = generateRack(dictionary);
        round = { ...round, letters: newLetters };
      }
      break;
    }
    case "blind": {
      if (targetId) {
        players[targetId] = addStatus(players[targetId], { type: "BLIND_PENDING" });
      }
      break;
    }
  }

  const abilityEvent: AbilityEvent = {
    id: nanoid(),
    timestamp: now,
    playerId,
    playerName: player.name,
    abilityId,
    abilityName: ability.name,
    targetId: targetId ?? null,
    targetName: targetId ? state.players[targetId]?.name ?? null : null,
    round: state.roundNumber,
  };

  return {
    ...state,
    players,
    round,
    abilityFeed: [...state.abilityFeed, abilityEvent],
  };
}

function addStatus(player: Player, status: Player["statuses"][number]): Player {
  // Remove existing status of same type before adding
  const filtered = player.statuses.filter((s) => s.type !== status.type);
  return { ...player, statuses: [...filtered, status] };
}

// ── Event reducer ────────────────────────────────────────────────────────────

function reduce(
  state: GameState,
  event: GameEvent,
  dictionary: Set<string>
): GameState {
  switch (event.type) {
    case "PLAYER_JOIN": {
      if (state.phase !== "lobby") return state;
      const player = createPlayer(
        event.playerId,
        event.name,
        event.kind,
        event.bot,
        event.abilityId
      );
      return {
        ...state,
        players: { ...state.players, [event.playerId]: player },
        playerIds: [...state.playerIds, event.playerId],
      };
    }

    case "GAME_START": {
      if (state.phase !== "lobby") return state;
      return {
        ...state,
        phase: "countdown",
        countdownEndsAt: event.timestamp + state.config.countdownSeconds * 1000,
      };
    }

    case "SELECT_ABILITY": {
      if (state.phase !== "lobby") return state;
      const p = state.players[event.playerId];
      if (!p || !ABILITIES[event.abilityId]) return state;
      return {
        ...state,
        players: { ...state.players, [event.playerId]: { ...p, abilityId: event.abilityId } },
      };
    }

    case "SUBMIT_WORD": {
      if (!state.round || state.round.phase !== "active") return state;
      const player = state.players[event.playerId];
      if (!player?.isAlive) return state;

      const word = event.word.toUpperCase().trim();
      if (word.length < 2) return state;
      if (!isValidWord(word, dictionary)) return state;

      // Allow private letters (SNIPE bonus)
      const effectiveRack = [...state.round.letters, ...player.privateLetters];
      if (!canMakeWord(word, effectiveRack)) return state;

      if (player.wordsPlayedThisMatch.includes(word)) return state;
      const roundSubs = state.round.submittedWords[event.playerId] ?? [];
      if (roundSubs.includes(word)) return state;

      // Consume VENOM / LIFELEECH on submission
      let newStatuses = player.statuses;
      let taggedWords = state.round.taggedWords;
      const hasVenom = newStatuses.some((s) => s.type === "VENOM");
      const hasLeech = newStatuses.some((s) => s.type === "LIFELEECH");

      if (hasVenom) {
        newStatuses = newStatuses.filter((s) => s.type !== "VENOM");
        const playerTags = { ...(taggedWords[event.playerId] ?? {}), [word]: "venom" as const };
        taggedWords = { ...taggedWords, [event.playerId]: playerTags };
      }
      if (hasLeech) {
        newStatuses = newStatuses.filter((s) => s.type !== "LIFELEECH");
        const playerTags = { ...(taggedWords[event.playerId] ?? {}), [word]: "leech" as const };
        taggedWords = { ...taggedWords, [event.playerId]: playerTags };
      }

      const updatedPlayer = { ...player, statuses: newStatuses };

      const newRound: RoundState = {
        ...state.round,
        submittedWords: {
          ...state.round.submittedWords,
          [event.playerId]: [...roundSubs, word],
        },
        taggedWords,
      };

      return {
        ...state,
        round: newRound,
        players: { ...state.players, [event.playerId]: updatedPlayer },
      };
    }

    case "ROUND_END": {
      if (
        !state.round ||
        state.round.phase !== "active" ||
        (state.phase !== "playing" && state.phase !== "sudden_death")
      )
        return state;
      return resolveRound(state, event.timestamp, dictionary);
    }

    case "USE_ABILITY": {
      return applyAbility(
        state,
        event.playerId,
        event.abilityId,
        event.targetId,
        event.timestamp,
        dictionary
      );
    }

    case "PLAYER_LEAVE": {
      if (state.phase !== "lobby") return state;
      const { [event.playerId]: _gone, ...remainingPlayers } = state.players;
      return {
        ...state,
        players: remainingPlayers,
        playerIds: state.playerIds.filter((id) => id !== event.playerId),
      };
    }

    default:
      return state;
  }
}

// ── Tick ─────────────────────────────────────────────────────────────────────

function tickState(state: GameState, now: number, dictionary: Set<string>): GameState {
  if (state.phase === "countdown") {
    if (state.countdownEndsAt && now >= state.countdownEndsAt) {
      const playing: GameState = { ...state, phase: "playing" };
      return startRound(playing, now, dictionary);
    }
  }

  if (state.phase === "playing" || state.phase === "sudden_death") {
    if (state.round?.phase === "active" && now >= state.round.endsAt) {
      return resolveRound(state, now, dictionary);
    }
  }

  return state;
}

// ── Engine class ─────────────────────────────────────────────────────────────

export class SpellfallEngine {
  private state: GameState;
  private dictionary: Set<string>;

  constructor(config: LobbyConfig, dictionary: Set<string>) {
    this.dictionary = dictionary;
    this.state = createInitialState(config);
  }

  getState(): GameState {
    return this.state;
  }

  processEvent(event: GameEvent): GameState {
    this.state = reduce(this.state, event, this.dictionary);
    return this.state;
  }

  tick(now: number): GameState {
    this.state = tickState(this.state, now, this.dictionary);
    return this.state;
  }

  /** Only valid in lobby phase — ignored otherwise. */
  patchConfig(patch: Partial<LobbyConfig>): void {
    if (this.state.phase !== "lobby") return;
    this.state = { ...this.state, config: { ...this.state.config, ...patch } };
  }
}
