import type { BotConfig } from "./types";

export type GameEvent =
  | {
      type: "PLAYER_JOIN";
      playerId: string;
      name: string;
      kind: "human" | "bot";
      bot: BotConfig | null;
      abilityId: string | null;
      timestamp: number;
    }
  | { type: "GAME_START"; timestamp: number }
  | {
      type: "SUBMIT_WORD";
      playerId: string;
      word: string;
      timestamp: number;
    }
  | { type: "ROUND_END"; timestamp: number }
  | {
      type: "SELECT_ABILITY";
      playerId: string;
      abilityId: string;
      timestamp: number;
    }
  | {
      type: "USE_ABILITY";
      playerId: string;
      abilityId: string;
      targetId?: string;
      timestamp: number;
    }
  | { type: "PLAYER_LEAVE"; playerId: string; timestamp: number };
