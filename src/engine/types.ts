export interface LobbyConfig {
  mode: "public" | "private";
  roomCode?: string;
  maxPlayers: number;
  botBackfill: boolean;
  countdownSeconds: number;
  roundSeconds: number;
  suddenDeathRoundSeconds: number;
  suddenDeathThreshold: number;
  abilitiesEnabled: boolean;
  listedPublicly?: boolean; // private rooms can opt into the browse list
}

export type PlayerKind = "human" | "bot";
export type BotTier = "novice" | "casual" | "skilled" | "expert";

export interface BotConfig {
  tier: BotTier;
  reactionDelayMs: [number, number];
  wordLengthBias: "short" | "balanced" | "long";
  vocabFraction: number;
  wordsPerRound: [number, number];
}

// ── Status effects ────────────────────────────────────────────────────────────

export type StatusEffect =
  | { type: "POISON"; damagePerRound: number; roundsLeft: number }
  | { type: "SHIELD"; roundsLeft: number }
  | { type: "BLIND"; endsAt: number }    // timestamp: rack hidden until this
  | { type: "BLIND_PENDING" }            // converts to BLIND at next round start
  | { type: "LIFELEECH" }               // next submitted word triggers leech
  | { type: "VENOM" }                   // next submitted word is venomous
  | { type: "SNIPE_PENDING" };          // gives private letter at next round start

export type VisibleStatusType = "POISONED" | "SHIELDED" | "BLINDED";

export function getVisibleStatuses(statuses: StatusEffect[]): VisibleStatusType[] {
  const out: VisibleStatusType[] = [];
  if (statuses.some((s) => s.type === "POISON")) out.push("POISONED");
  if (statuses.some((s) => s.type === "SHIELD")) out.push("SHIELDED");
  if (statuses.some((s) => s.type === "BLIND" || s.type === "BLIND_PENDING")) out.push("BLINDED");
  return out;
}

// ── Ability activation feed ───────────────────────────────────────────────────

export interface AbilityEvent {
  id: string;
  timestamp: number;
  playerId: string;
  playerName: string;
  abilityId: string;
  abilityName: string;
  targetId: string | null;
  targetName: string | null;
  round: number;
}

// ── Player ───────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  kind: PlayerKind;
  hp: number;
  isAlive: boolean;
  wordsPlayedThisMatch: string[];
  damageDealtTotal: number;
  eliminations: number;
  bestWord: { word: string; score: number } | null;
  bot: BotConfig | null;
  // Phase 3
  abilityId: string | null;
  energy: number;          // 0–100
  statuses: StatusEffect[];
  privateLetters: string[];
}

export interface ScoredWord {
  word: string;
  baseScore: number;
  lengthMultiplier: number;
  decayMultiplier: number;
  finalDamage: number;
  targetIds: string[];
  isPangram: boolean;
  heal: number;
  // Phase 3
  isVenom: boolean;
  isLeech: boolean;
  leechHeal: number;
}

export interface PlayerRoundResult {
  playerId: string;
  words: ScoredWord[];
  healedHp: number;
  tookChipDamage: boolean;
  chipDamageTaken: number;
  damageDealt: number;
}

export type RoundPhase = "active" | "resolving" | "complete";

export interface RoundState {
  roundNumber: number;
  letters: string[];
  phase: RoundPhase;
  startedAt: number;
  endsAt: number;
  submittedWords: Record<string, string[]>;
  results: Record<string, PlayerRoundResult> | null;
  // Phase 3: per-word tags consumed at submission time
  taggedWords: Record<string, Record<string, "venom" | "leech">>;
}

export interface KillEvent {
  id: string;
  killedId: string;
  killedName: string;
  killerId: string | null;
  killerName: string | null;
  round: number;
  timestamp: number;
}

export type GamePhase =
  | "lobby"
  | "countdown"
  | "playing"
  | "sudden_death"
  | "ended";

export interface GameState {
  phase: GamePhase;
  players: Record<string, Player>;
  playerIds: string[];
  round: RoundState | null;
  roundNumber: number;
  countdownEndsAt: number | null;
  killFeed: KillEvent[];
  winnerId: string | null;
  config: LobbyConfig;
  chipDamage: number;
  abilityFeed: AbilityEvent[];
}

export interface ISpellfallEngine {
  getState(): GameState;
  processEvent(event: import("./events").GameEvent): GameState;
  tick(now: number): GameState;
}
