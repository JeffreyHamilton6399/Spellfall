import type {
  GamePhase,
  RoundPhase,
  KillEvent,
  LobbyConfig,
  ScoredWord,
  PlayerKind,
  StatusEffect,
  VisibleStatusType,
  AbilityEvent,
} from "@/engine/types";

// ── Lobby ────────────────────────────────────────────────────────────────────

export interface LobbyPlayer {
  id: string;
  name: string;
  kind: PlayerKind;
  isConnected: boolean;
  abilityId: string | null;
}

// ── Compact snapshot ─────────────────────────────────────────────────────────

export interface SnapshotPlayer {
  id: string;
  name: string;
  kind: PlayerKind;
  hp: number;
  isAlive: boolean;
  isConnected: boolean;
  damageDealtTotal: number;
  eliminations: number;
  bestWord: { word: string; score: number } | null;
  abilityId: string | null;
  visibleStatuses: VisibleStatusType[];   // public: POISONED / SHIELDED / BLINDED
}

export interface ClientRoundResult {
  playerId: string;
  words: ScoredWord[];    // full for self, empty for others
  wordsCount: number;
  damageDealt: number;
  tookChipDamage: boolean;
  chipDamageTaken: number;
  healedHp: number;
}

export interface SnapshotRound {
  roundNumber: number;
  letters: string[];      // empty if player is currently blinded
  phase: RoundPhase;
  startedAt: number;
  endsAt: number;
  myWords: string[];
  results: Record<string, ClientRoundResult> | null;
}

// Private info sent only to the receiving player
export interface SelfInfo {
  energy: number;
  statuses: StatusEffect[];
  privateLetters: string[];
}

export interface GameSnapshot {
  phase: GamePhase;
  players: SnapshotPlayer[];
  playerIds: string[];
  round: SnapshotRound | null;
  roundNumber: number;
  countdownEndsAt: number | null;
  killFeed: KillEvent[];
  winnerId: string | null;
  chipDamage: number;
  config: LobbyConfig;
  abilityFeed: AbilityEvent[];
  self: SelfInfo;
  serverNow: number;
}

// ── Server → Client ──────────────────────────────────────────────────────────

export type ServerMsg =
  | {
      type: "LOBBY_STATE";
      players: LobbyPlayer[];
      roomCode: string;
      config: LobbyConfig;
      lobbyCountdownEndsAt: number | null;
      hostId: string | null;
      yourPlayerId: string;
    }
  | {
      type: "SNAPSHOT";
      snapshot: GameSnapshot;
      yourPlayerId: string;
    }
  | {
      type: "WORD_COUNTS";
      counts: Record<string, number>;
    }
  | {
      type: "ERROR";
      code: "LOBBY_FULL" | "GAME_IN_PROGRESS" | "KICKED" | "UNKNOWN";
      message: string;
    };

// ── Client → Server ──────────────────────────────────────────────────────────

export type ConfigPatch = Partial<
  Pick<import("@/engine/types").LobbyConfig,
    "botBackfill" | "maxPlayers" | "roundSeconds" |
    "suddenDeathRoundSeconds" | "suddenDeathThreshold" | "abilitiesEnabled" |
    "listedPublicly"
  >
>;

export type ClientMsg =
  | { type: "SET_NAME"; name: string }
  | { type: "SUBMIT_WORD"; word: string; timestamp: number }
  | { type: "SELECT_ABILITY"; abilityId: string }
  | { type: "USE_ABILITY"; abilityId: string; targetId?: string }
  | { type: "HOST_START" }
  | { type: "UPDATE_CONFIG"; patch: ConfigPatch }
  | { type: "KICK_PLAYER"; targetId: string }
  | { type: "TRANSFER_HOST"; targetId: string }
  | { type: "REMATCH_VOTE" };
