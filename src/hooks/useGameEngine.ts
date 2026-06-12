"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SpellfallEngine } from "@/engine/engine";
import { loadDictionary, findPossibleWords } from "@/engine/dictionary";
import { generateBotConfigs, pickBotWords, makeRng, randInt, pickAbilityTarget } from "@/engine/bots";
import { ABILITIES } from "@/engine/abilities";
import { BALANCE } from "@/engine/balance";
import type { GameState, LobbyConfig } from "@/engine/types";
import type { GameEvent } from "@/engine/events";
import { DEFAULT_LOBBY_CONFIG } from "@/engine/constants";

const HUMAN_ID = "player_human";
const HUMAN_NAME = "You";
const BOT_COUNT = 19;

export function useGameEngine(config: LobbyConfig = DEFAULT_LOBBY_CONFIG) {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);

  const engineRef = useRef<SpellfallEngine | null>(null);
  const rafRef = useRef<number | null>(null);
  const botTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scheduledRoundRef = useRef<number>(-1);
  const dictionaryRef = useRef<Set<string> | null>(null);

  const dispatch = useCallback((event: GameEvent) => {
    if (!engineRef.current) return;
    const newState = engineRef.current.processEvent(event);
    setState(newState);
  }, []);

  const scheduleBots = useCallback(
    (gameState: GameState) => {
      if (!gameState.round || gameState.round.phase !== "active") return;
      const roundNumber = gameState.round.roundNumber;
      if (scheduledRoundRef.current === roundNumber) return;
      scheduledRoundRef.current = roundNumber;

      botTimeoutsRef.current.forEach(clearTimeout);
      botTimeoutsRef.current = [];

      const dict = dictionaryRef.current;
      if (!dict) return;

      const rack = gameState.round.letters;
      const roundDurationMs = gameState.round.endsAt - gameState.round.startedAt;
      const possible = findPossibleWords(rack, dict);
      const rng = makeRng(roundNumber * 1337 + 42);

      for (const botId of gameState.playerIds) {
        const player = gameState.players[botId];
        if (!player.isAlive || player.kind !== "bot" || !player.bot) continue;

        const cfg = player.bot;
        const [minWords, maxWords] = cfg.wordsPerRound;
        const wordCount = randInt(minWords, maxWords, rng);
        if (wordCount === 0) continue;

        const played = new Set(player.wordsPlayedThisMatch);
        const chosen = pickBotWords(botId, cfg, possible, played, wordCount);

        chosen.forEach((word, idx) => {
          const [minDelay, maxDelay] = cfg.reactionDelayMs;
          const baseDelay = randInt(minDelay, maxDelay, rng);
          const stagger = idx * randInt(1000, 3000, rng);
          const delay = Math.min(baseDelay + stagger, roundDurationMs - 500);

          const t = setTimeout(() => {
            const engine = engineRef.current;
            if (!engine) return;
            const currentState = engine.getState();
            const currentPlayer = currentState.players[botId];
            if (!currentPlayer?.isAlive) return;

            // Bot uses ability if charged
            if (
              currentPlayer.energy >= BALANCE.energy.maxEnergy &&
              currentPlayer.abilityId
            ) {
              const ability = ABILITIES[currentPlayer.abilityId];
              const targetId = ability?.targeting === "player"
                ? pickAbilityTarget(botId, currentState.playerIds, currentState.players, rng)
                : undefined;
              const newState = engine.processEvent({
                type: "USE_ABILITY",
                playerId: botId,
                abilityId: currentPlayer.abilityId,
                targetId,
                timestamp: Date.now(),
              });
              setState(newState);
            }

            dispatch({
              type: "SUBMIT_WORD",
              playerId: botId,
              word,
              timestamp: Date.now(),
            });
          }, delay);
          botTimeoutsRef.current.push(t);
        });
      }
    },
    [dispatch]
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const dict = await loadDictionary();
      if (cancelled) return;

      dictionaryRef.current = dict;
      const engine = new SpellfallEngine(config, dict);
      engineRef.current = engine;

      const now = Date.now();
      const botConfigs = generateBotConfigs(BOT_COUNT, now);

      engine.processEvent({
        type: "PLAYER_JOIN",
        playerId: HUMAN_ID,
        name: HUMAN_NAME,
        kind: "human",
        bot: null,
        abilityId: null,
        timestamp: now,
      });

      botConfigs.forEach(({ name, config: botCfg, abilityId }, i) => {
        engine.processEvent({
          type: "PLAYER_JOIN",
          playerId: `bot_${i}`,
          name,
          kind: "bot",
          bot: botCfg,
          abilityId,
          timestamp: now,
        });
      });

      setState(engine.getState());
      setLoading(false);
    }

    init();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loading) return;

    let lastRoundNumber = -1;

    const loop = () => {
      const engine = engineRef.current;
      if (!engine) return;

      const newState = engine.tick(Date.now());
      setState((prev) => (prev === newState ? prev : newState));

      if (
        newState.round?.phase === "active" &&
        newState.round.roundNumber !== lastRoundNumber
      ) {
        lastRoundNumber = newState.round.roundNumber;
        scheduleBots(newState);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      botTimeoutsRef.current.forEach(clearTimeout);
    };
  }, [loading, scheduleBots]);

  const startGame = useCallback(() => {
    if (!engineRef.current) return;
    const newState = engineRef.current.processEvent({
      type: "GAME_START",
      timestamp: Date.now(),
    });
    setState(newState);
  }, []);

  const humanSubmitWord = useCallback(
    (word: string) => {
      dispatch({ type: "SUBMIT_WORD", playerId: HUMAN_ID, word, timestamp: Date.now() });
    },
    [dispatch]
  );

  const humanSelectAbility = useCallback((abilityId: string) => {
    dispatch({ type: "SELECT_ABILITY", playerId: HUMAN_ID, abilityId, timestamp: Date.now() });
  }, [dispatch]);

  const humanUseAbility = useCallback((abilityId: string, targetId?: string) => {
    dispatch({ type: "USE_ABILITY", playerId: HUMAN_ID, abilityId, targetId, timestamp: Date.now() });
  }, [dispatch]);

  const restartGame = useCallback(() => {
    botTimeoutsRef.current.forEach(clearTimeout);
    botTimeoutsRef.current = [];
    scheduledRoundRef.current = -1;

    const dict = dictionaryRef.current;
    if (!dict) return;

    const engine = new SpellfallEngine(config, dict);
    engineRef.current = engine;

    const now = Date.now();
    const botConfigs = generateBotConfigs(BOT_COUNT, now);

    engine.processEvent({
      type: "PLAYER_JOIN",
      playerId: HUMAN_ID,
      name: HUMAN_NAME,
      kind: "human",
      bot: null,
      abilityId: null,
      timestamp: now,
    });

    botConfigs.forEach(({ name, config: botCfg, abilityId }, i) => {
      engine.processEvent({
        type: "PLAYER_JOIN",
        playerId: `bot_${i}`,
        name,
        kind: "bot",
        bot: botCfg,
        abilityId,
        timestamp: now,
      });
    });

    engine.processEvent({ type: "GAME_START", timestamp: now });
    setState(engine.getState());
  }, [config]);

  return {
    state,
    loading,
    humanId: HUMAN_ID,
    humanSubmitWord,
    humanSelectAbility,
    humanUseAbility,
    startGame,
    restartGame,
    dispatch,
  };
}
