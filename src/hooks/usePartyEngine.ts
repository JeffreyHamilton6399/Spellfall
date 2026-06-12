"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PartySocket from "partysocket";
import { loadDictionary } from "@/engine/dictionary";
import { DEFAULT_LOBBY_CONFIG } from "@/engine/constants";
import { BALANCE } from "@/engine/balance";
import type { GameState, Player, RoundState, StatusEffect } from "@/engine/types";
import type { LobbyConfig } from "@/engine/types";
import type {
  ServerMsg,
  ClientMsg,
  ConfigPatch,
  LobbyPlayer,
  GameSnapshot,
  ClientRoundResult,
  SelfInfo,
} from "@/party/protocol";

export type ConnectionStatus = "connecting" | "connected" | "reconnecting";

export type PartyPhase =
  | { status: "connecting" }
  | {
      status: "lobby";
      players: LobbyPlayer[];
      roomCode: string;
      config: LobbyConfig;
      lobbyCountdownEndsAt: number | null;
      hostId: string | null;
    }
  | { status: "in_game" }
  | { status: "error"; code: string; message: string };

export interface UsePartyEngineResult {
  phase: PartyPhase;
  gameState: GameState | null;
  yourPlayerId: string | null;
  selfInfo: SelfInfo;
  connectionStatus: ConnectionStatus;
  wordCounts: Record<string, number>;
  clockOffset: number;
  hostId: string | null;
  submitWord: (word: string) => void;
  selectAbility: (abilityId: string) => void;
  useAbility: (abilityId: string, targetId?: string) => void;
  hostStart: () => void;
  updateConfig: (patch: ConfigPatch) => void;
  kickPlayer: (targetId: string) => void;
  transferHost: (targetId: string) => void;
  rematchVote: () => void;
  disconnect: () => void;
}

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

const DEFAULT_SELF: SelfInfo = { energy: 0, statuses: [], privateLetters: [] };

function snapshotToGameState(
  snap: GameSnapshot,
  yourPlayerId: string,
  myWordsPlayed: string[]
): GameState {
  const players: Record<string, Player> = {};
  for (const p of snap.players) {
    players[p.id] = {
      id: p.id,
      name: p.name,
      kind: p.kind,
      hp: p.hp,
      isAlive: p.isAlive,
      wordsPlayedThisMatch: p.id === yourPlayerId ? myWordsPlayed : [],
      damageDealtTotal: p.damageDealtTotal,
      eliminations: p.eliminations,
      bestWord: p.bestWord,
      bot: null,
      abilityId: p.abilityId,
      energy: p.id === yourPlayerId ? snap.self.energy : 0,
      statuses: p.id === yourPlayerId ? snap.self.statuses : [],
      privateLetters: p.id === yourPlayerId ? snap.self.privateLetters : [],
    };
  }

  let round: RoundState | null = null;
  if (snap.round) {
    let results: Record<string, import("@/engine/types").PlayerRoundResult> | null = null;
    if (snap.round.results) {
      results = {};
      for (const [pid, r] of Object.entries(snap.round.results)) {
        results[pid] = {
          playerId: pid,
          words: r.words,
          healedHp: r.healedHp,
          tookChipDamage: r.tookChipDamage,
          chipDamageTaken: r.chipDamageTaken,
          damageDealt: r.damageDealt,
        };
      }
    }
    round = {
      roundNumber: snap.round.roundNumber,
      letters: snap.round.letters,
      phase: snap.round.phase,
      startedAt: snap.round.startedAt,
      endsAt: snap.round.endsAt,
      submittedWords: {
        [yourPlayerId]: snap.round.myWords,
        // add private letters so WordInput can validate using them
      },
      results,
      taggedWords: {},
    };
  }

  return {
    phase: snap.phase,
    players,
    playerIds: snap.playerIds,
    round,
    roundNumber: snap.roundNumber,
    countdownEndsAt: snap.countdownEndsAt,
    killFeed: snap.killFeed,
    winnerId: snap.winnerId,
    config: snap.config ?? DEFAULT_LOBBY_CONFIG,
    chipDamage: snap.chipDamage,
    abilityFeed: snap.abilityFeed,
  };
}

export function usePartyEngine(
  partyId: string,
  name: string,
  session: string
): UsePartyEngineResult {
  const [phase, setPhase] = useState<PartyPhase>({ status: "connecting" });
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [yourPlayerId, setYourPlayerId] = useState<string | null>(null);
  const [selfInfo, setSelfInfo] = useState<SelfInfo>(DEFAULT_SELF);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [wordCounts, setWordCounts] = useState<Record<string, number>>({});
  const [clockOffset, setClockOffset] = useState(0);
  const [hostId, setHostId] = useState<string | null>(null);

  const socketRef = useRef<PartySocket | null>(null);
  const myWordsPlayedRef = useRef<string[]>([]);

  useEffect(() => { loadDictionary().catch(() => {}); }, []);

  useEffect(() => {
    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: partyId,
      query: { name, session },
    });
    socketRef.current = socket;

    socket.addEventListener("open", () => setConnectionStatus("connected"));
    socket.addEventListener("close", () => setConnectionStatus("reconnecting"));

    socket.addEventListener("message", (evt) => {
      let msg: ServerMsg;
      try { msg = JSON.parse(evt.data as string) as ServerMsg; } catch { return; }

      switch (msg.type) {
        case "LOBBY_STATE": {
          setYourPlayerId(msg.yourPlayerId);
          setHostId(msg.hostId);
          setPhase({
            status: "lobby",
            players: msg.players,
            roomCode: msg.roomCode,
            config: msg.config,
            lobbyCountdownEndsAt: msg.lobbyCountdownEndsAt,
            hostId: msg.hostId,
          });
          setGameState(null);
          break;
        }
        case "SNAPSHOT": {
          const { snapshot, yourPlayerId: yid } = msg;
          setYourPlayerId(yid);
          setSelfInfo(snapshot.self);
          // Update clock offset so timers stay in sync with server
          if (snapshot.serverNow) setClockOffset(snapshot.serverNow - Date.now());

          // Accumulate words from completed rounds
          if (snapshot.round?.results) {
            const myResult = snapshot.round.results[yid];
            if (myResult) {
              const newWords = myResult.words.map((w) => w.word);
              const added = newWords.filter((w) => !myWordsPlayedRef.current.includes(w));
              if (added.length > 0) myWordsPlayedRef.current = [...myWordsPlayedRef.current, ...added];
            }
          }

          const gs = snapshotToGameState(snapshot, yid, myWordsPlayedRef.current);
          setGameState(gs);
          if (snapshot.phase !== "lobby") setPhase({ status: "in_game" });
          break;
        }
        case "WORD_COUNTS": setWordCounts(msg.counts); break;
        case "ERROR": setPhase({ status: "error", code: msg.code, message: msg.message }); break;
      }
    });

    return () => { socket.close(); socketRef.current = null; };
  }, [partyId, name, session]);

  const send = useCallback((msg: ClientMsg) => {
    socketRef.current?.send(JSON.stringify(msg));
  }, []);

  const submitWord = useCallback((word: string) =>
    send({ type: "SUBMIT_WORD", word, timestamp: Date.now() }), [send]);

  const selectAbility = useCallback((abilityId: string) =>
    send({ type: "SELECT_ABILITY", abilityId }), [send]);

  const useAbility = useCallback((abilityId: string, targetId?: string) =>
    send({ type: "USE_ABILITY", abilityId, targetId }), [send]);

  const hostStart = useCallback(() => send({ type: "HOST_START" }), [send]);

  const updateConfig = useCallback(
    (patch: ConfigPatch) => send({ type: "UPDATE_CONFIG", patch }),
    [send]
  );

  const kickPlayer = useCallback(
    (targetId: string) => send({ type: "KICK_PLAYER", targetId }),
    [send]
  );

  const transferHost = useCallback(
    (targetId: string) => send({ type: "TRANSFER_HOST", targetId }),
    [send]
  );

  const rematchVote = useCallback(() => send({ type: "REMATCH_VOTE" }), [send]);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
  }, []);

  return {
    phase,
    gameState,
    yourPlayerId,
    selfInfo,
    connectionStatus,
    wordCounts,
    clockOffset,
    hostId,
    submitWord,
    selectAbility,
    useAbility,
    hostStart,
    updateConfig,
    kickPlayer,
    transferHost,
    rematchVote,
    disconnect,
  };
}
