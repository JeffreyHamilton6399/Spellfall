import type * as Party from "partykit/server";
import { SpellfallEngine } from "../src/engine/engine";
import {
  generateBotConfigs,
  pickBotWords,
  pickAbilityTarget,
  makeRng,
  randInt,
} from "../src/engine/bots";
import { findPossibleWords } from "../src/engine/dictionary";
import { DEFAULT_LOBBY_CONFIG } from "../src/engine/constants";
import { ABILITIES } from "../src/engine/abilities";
import { BALANCE } from "../src/engine/balance";
import { getVisibleStatuses } from "../src/engine/types";
import type { LobbyConfig, GameState } from "../src/engine/types";
import type {
  ClientMsg,
  ServerMsg,
  GameSnapshot,
  SnapshotPlayer,
  SnapshotRound,
  ClientRoundResult,
  LobbyPlayer,
  SelfInfo,
} from "../src/party/protocol";
import { WORD_SET } from "./wordlist-data";

const MAX_PLAYERS = 20;
const PUBLIC_COUNTDOWN_MS = 10_000;
const SOLO_BOT_FILL_MS = 20_000;
const TICK_MS = 200;

function sanitizeName(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_\s\-]/g, "").trim().slice(0, 20) || "Player";
}

const BLOCKED = new Set(["fuck", "shit", "cunt", "nigger", "faggot"]);
function profanityCheck(name: string): string {
  const lower = name.toLowerCase();
  for (const w of BLOCKED) {
    if (lower.includes(w)) return "Player";
  }
  return name;
}

interface Session {
  playerId: string;
  conn: Party.Connection;
  sessionId: string;
}

export default class SpellfallParty implements Party.Server {
  engine: SpellfallEngine;
  sessions = new Map<string, Session>();
  sessionIndex = new Map<string, string>();
  disconnected = new Set<string>();
  hostPlayerId: string | null = null;

  tickTimer: ReturnType<typeof setInterval> | null = null;
  botTimeouts: ReturnType<typeof setTimeout>[] = [];
  scheduledBotRound = -1;

  countdownTimer: ReturnType<typeof setTimeout> | null = null;
  lobbyCountdownEndsAt: number | null = null;

  // Cache player names so resetToLobby can restore them
  playerNames = new Map<string, string>();

  constructor(readonly room: Party.Room) {
    // pub_ prefix = auto-created public lobby; everything else is a private room
    const isPrivate = !room.id.startsWith("pub_");
    const cfg: LobbyConfig = {
      ...DEFAULT_LOBBY_CONFIG,
      mode: isPrivate ? "private" : "public",
      roomCode: room.id,
      botBackfill: !isPrivate,
    };
    this.engine = new SpellfallEngine(cfg, WORD_SET);
  }

  // ── Connection lifecycle ──────────────────────────────────────────────────

  onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    const url = new URL(ctx.request.url);
    const rawName = url.searchParams.get("name") ?? "Player";
    const name = profanityCheck(sanitizeName(rawName));
    const sessionId = url.searchParams.get("session") ?? conn.id;

    const prevConnId = this.sessionIndex.get(sessionId);
    if (prevConnId !== undefined) {
      const prev = this.sessions.get(prevConnId);
      if (prev) this.sessions.delete(prevConnId);
      const playerId = prev?.playerId ?? `h_${sessionId.slice(0, 8)}`;
      this.sessions.set(conn.id, { playerId, conn, sessionId });
      this.sessionIndex.set(sessionId, conn.id);
      this.disconnected.delete(playerId);

      const state = this.engine.getState();
      if (state.phase === "lobby") {
        this.broadcastLobbyState();
      } else {
        this.sendSnapshot(conn, playerId);
      }
      return;
    }

    const state = this.engine.getState();

    if (state.phase !== "lobby") {
      const msg: ServerMsg = { type: "ERROR", code: "GAME_IN_PROGRESS", message: "A game is already in progress." };
      conn.send(JSON.stringify(msg));
      conn.close();
      return;
    }

    const humanCount = state.playerIds.filter((id) => state.players[id].kind === "human").length;
    if (humanCount >= MAX_PLAYERS) {
      const msg: ServerMsg = { type: "ERROR", code: "LOBBY_FULL", message: "This lobby is full." };
      conn.send(JSON.stringify(msg));
      conn.close();
      return;
    }

    const playerId = `h_${sessionId.slice(0, 8)}`;
    // Only private rooms have a host; public rooms are server-managed
    if (state.config.mode === "private" && !this.hostPlayerId) {
      this.hostPlayerId = playerId;
    }

    this.sessions.set(conn.id, { playerId, conn, sessionId });
    this.sessionIndex.set(sessionId, conn.id);
    this.playerNames.set(playerId, name);

    this.engine.processEvent({
      type: "PLAYER_JOIN",
      playerId,
      name,
      kind: "human",
      bot: null,
      abilityId: null, // set via SELECT_ABILITY
      timestamp: Date.now(),
    });

    this.startTick();
    this.broadcastLobbyState();
    this.checkAutoCountdown();
    this.pingRegistry();
  }

  onClose(conn: Party.Connection) {
    const session = this.sessions.get(conn.id);
    if (!session) return;
    this.sessions.delete(conn.id);
    this.disconnected.add(session.playerId);

    const state = this.engine.getState();
    if (state.phase === "lobby") {
      // Remove the player from the lobby entirely so they don't ghost
      this.engine.processEvent({
        type: "PLAYER_LEAVE",
        playerId: session.playerId,
        timestamp: Date.now(),
      });

      // Host migration: if the host left, promote the next human
      if (session.playerId === this.hostPlayerId) {
        const newState = this.engine.getState();
        const humanIds = newState.playerIds.filter(
          (id) => newState.players[id].kind === "human"
        );
        this.hostPlayerId = humanIds[0] ?? null;
      }

      // Cleanup: if no humans remain, cancel countdown and de-register
      const afterState = this.engine.getState();
      const humanCount = afterState.playerIds.filter(
        (id) => afterState.players[id].kind === "human"
      ).length;
      if (humanCount === 0) {
        if (this.countdownTimer) {
          clearTimeout(this.countdownTimer);
          this.countdownTimer = null;
          this.lobbyCountdownEndsAt = null;
        }
        this.pingRegistryRemove();
      }

      this.broadcastLobbyState();
    }
  }

  onMessage(raw: string, conn: Party.Connection) {
    const session = this.sessions.get(conn.id);
    if (!session) return;

    let msg: ClientMsg;
    try { msg = JSON.parse(raw) as ClientMsg; } catch { return; }

    const state = this.engine.getState();

    switch (msg.type) {
      case "SELECT_ABILITY": {
        if (state.phase !== "lobby") break;
        this.engine.processEvent({
          type: "SELECT_ABILITY",
          playerId: session.playerId,
          abilityId: msg.abilityId,
          timestamp: Date.now(),
        });
        this.broadcastLobbyState();
        break;
      }

      case "SUBMIT_WORD": {
        if (state.phase !== "playing" && state.phase !== "sudden_death") break;
        if (!state.round || state.round.phase !== "active") break;
        const before = state.round.submittedWords[session.playerId]?.length ?? 0;
        this.engine.processEvent({
          type: "SUBMIT_WORD",
          playerId: session.playerId,
          word: msg.word,
          timestamp: msg.timestamp,
        });
        const after = this.engine.getState().round?.submittedWords[session.playerId]?.length ?? 0;
        if (after > before) this.broadcastWordCounts();
        break;
      }

      case "USE_ABILITY": {
        if (state.config.abilitiesEnabled === false) break;
        const before = this.engine.getState().abilityFeed.length;
        this.engine.processEvent({
          type: "USE_ABILITY",
          playerId: session.playerId,
          abilityId: msg.abilityId,
          targetId: msg.targetId,
          timestamp: Date.now(),
        });
        const after = this.engine.getState();
        if (after.abilityFeed.length > before) {
          // Scramble changes the rack — full broadcast needed
          if (msg.abilityId === "scramble") {
            this.broadcastAll();
          } else {
            this.broadcastAll();
          }
        }
        break;
      }

      case "HOST_START": {
        if (state.config.mode !== "private") break;
        if (session.playerId !== this.hostPlayerId) break;
        if (state.phase !== "lobby") break;
        this.launchGame();
        break;
      }

      case "UPDATE_CONFIG": {
        if (state.config.mode !== "private") break;
        if (session.playerId !== this.hostPlayerId) break;
        if (state.phase !== "lobby") break;
        const { patch } = msg;
        // Validate and clamp ranges server-side
        const safePatch: Partial<LobbyConfig> = {};
        if (typeof patch.botBackfill === "boolean") safePatch.botBackfill = patch.botBackfill;
        if (typeof patch.abilitiesEnabled === "boolean") safePatch.abilitiesEnabled = patch.abilitiesEnabled;
        if (typeof patch.maxPlayers === "number") safePatch.maxPlayers = Math.max(2, Math.min(20, patch.maxPlayers));
        if (typeof patch.roundSeconds === "number") safePatch.roundSeconds = Math.max(10, Math.min(60, patch.roundSeconds));
        if (typeof patch.suddenDeathRoundSeconds === "number") safePatch.suddenDeathRoundSeconds = Math.max(5, Math.min(30, patch.suddenDeathRoundSeconds));
        if (typeof patch.suddenDeathThreshold === "number") safePatch.suddenDeathThreshold = Math.max(2, Math.min(10, patch.suddenDeathThreshold));

        const prevListed = state.config.listedPublicly ?? false;
        if (typeof patch.listedPublicly === "boolean") safePatch.listedPublicly = patch.listedPublicly;

        this.engine.patchConfig(safePatch);

        // Handle browse-list visibility change immediately
        if (typeof safePatch.listedPublicly === "boolean" && safePatch.listedPublicly !== prevListed) {
          if (safePatch.listedPublicly) {
            this.pingRegistry(); // register in browse list
          } else {
            this.pingRegistryRemove(); // remove from browse list
          }
        }

        this.broadcastLobbyState();
        break;
      }

      case "KICK_PLAYER": {
        if (state.config.mode !== "private") break;
        if (session.playerId !== this.hostPlayerId) break;
        if (state.phase !== "lobby") break;
        const kickId = msg.targetId;
        if (!kickId || kickId === this.hostPlayerId) break;
        // Notify the kicked connection, then close it
        for (const s of this.sessions.values()) {
          if (s.playerId === kickId) {
            const kickMsg: ServerMsg = {
              type: "ERROR",
              code: "KICKED",
              message: "You were removed from the lobby by the host.",
            };
            s.conn.send(JSON.stringify(kickMsg));
            s.conn.close();
            break;
          }
        }
        // Remove from engine regardless of whether they have an open connection
        this.engine.processEvent({ type: "PLAYER_LEAVE", playerId: kickId, timestamp: Date.now() });
        this.disconnected.delete(kickId);
        this.broadcastLobbyState();
        break;
      }

      case "TRANSFER_HOST": {
        if (state.config.mode !== "private") break;
        if (session.playerId !== this.hostPlayerId) break;
        if (state.phase !== "lobby") break;
        const newHostId = msg.targetId;
        const target = state.players[newHostId];
        if (!target || target.kind !== "human") break;
        this.hostPlayerId = newHostId;
        this.broadcastLobbyState();
        break;
      }

      case "REMATCH_VOTE": {
        if (state.phase !== "ended") break;
        if (state.config.mode === "public") {
          // Public: any player can trigger rematch immediately
          this.resetToLobby();
        } else {
          // Private: only the host triggers the reset
          if (session.playerId !== this.hostPlayerId) break;
          this.resetToLobby();
        }
        break;
      }

      case "SET_NAME": break;
    }
  }

  // ── Tick ─────────────────────────────────────────────────────────────────

  startTick() {
    if (this.tickTimer) return;
    this.tickTimer = setInterval(() => this.tick(), TICK_MS);
  }

  tick() {
    const before = this.engine.getState();
    const after = this.engine.tick(Date.now());

    const phaseChanged = before.phase !== after.phase;
    const roundResolved = before.round?.phase === "active" && after.round?.phase !== "active";
    const newRound = before.round?.roundNumber !== after.round?.roundNumber;

    if (phaseChanged || roundResolved || newRound) this.broadcastAll();

    if (after.round?.phase === "active" && after.round.roundNumber !== this.scheduledBotRound) {
      this.scheduleBots(after);
    }

    if (after.phase === "ended") this.stopTick();
  }

  stopTick() {
    if (this.tickTimer) { clearInterval(this.tickTimer); this.tickTimer = null; }
    this.clearBotTimeouts();
  }

  clearBotTimeouts() {
    this.botTimeouts.forEach(clearTimeout);
    this.botTimeouts = [];
  }

  // ── Game start ────────────────────────────────────────────────────────────

  checkAutoCountdown() {
    const state = this.engine.getState();
    if (state.phase !== "lobby" || state.config.mode === "private" || this.countdownTimer) return;

    const humans = state.playerIds.filter((id) => state.players[id].kind === "human").length;
    const delayMs = humans >= 2 ? PUBLIC_COUNTDOWN_MS : SOLO_BOT_FILL_MS;
    this.lobbyCountdownEndsAt = humans >= 2 ? Date.now() + delayMs : null;

    this.countdownTimer = setTimeout(() => {
      this.countdownTimer = null;
      this.lobbyCountdownEndsAt = null;
      this.launchGame();
    }, delayMs);

    if (humans >= 2) this.broadcastLobbyState();
  }

  launchGame() {
    const state = this.engine.getState();
    if (state.phase !== "lobby") return;

    if (state.config.botBackfill) {
      const humanCount = state.playerIds.filter((id) => state.players[id].kind === "human").length;
      const botCount = Math.max(0, MAX_PLAYERS - humanCount);
      const botConfigs = generateBotConfigs(botCount, Date.now());
      const now = Date.now();
      botConfigs.forEach(({ name, config: botCfg, abilityId }, i) => {
        this.engine.processEvent({
          type: "PLAYER_JOIN",
          playerId: `bot_${i}_${now}`,
          name,
          kind: "bot",
          bot: botCfg,
          abilityId,
          timestamp: now,
        });
      });
    }

    // Auto-assign a random ability to any human who didn't pick one
    const preStartState = this.engine.getState();
    const abilityIds = Object.keys(ABILITIES);
    for (const pid of preStartState.playerIds) {
      const player = preStartState.players[pid];
      if (player.kind === "human" && !player.abilityId && abilityIds.length > 0) {
        const randomAbility = abilityIds[Math.floor(Math.random() * abilityIds.length)];
        this.engine.processEvent({
          type: "SELECT_ABILITY",
          playerId: pid,
          abilityId: randomAbility,
          timestamp: Date.now(),
        });
      }
    }

    this.engine.processEvent({ type: "GAME_START", timestamp: Date.now() });
    this.broadcastAll();
    this.pingRegistry();
  }

  // ── Bot scheduling ────────────────────────────────────────────────────────

  scheduleBots(state: GameState) {
    if (!state.round || state.round.phase !== "active") return;
    const roundNumber = state.round.roundNumber;
    if (this.scheduledBotRound === roundNumber) return;
    this.scheduledBotRound = roundNumber;

    this.clearBotTimeouts();

    const rack = state.round.letters;
    const roundDurationMs = state.round.endsAt - state.round.startedAt;
    const possible = findPossibleWords(rack, WORD_SET);
    const rng = makeRng(roundNumber * 1337 + 42);

    for (const botId of state.playerIds) {
      const player = state.players[botId];
      if (!player.isAlive || player.kind !== "bot" || !player.bot) continue;

      const cfg = player.bot;
      const [minW, maxW] = cfg.wordsPerRound;
      const wordCount = randInt(minW, maxW, rng);

      const played = new Set(player.wordsPlayedThisMatch);
      const chosen = pickBotWords(botId, cfg, possible, played, wordCount);

      chosen.forEach((word, idx) => {
        const [minD, maxD] = cfg.reactionDelayMs;
        const baseDelay = randInt(minD, maxD, rng);
        const stagger = idx * randInt(1000, 3000, rng);
        const delay = Math.min(baseDelay + stagger, roundDurationMs - 500);

        const t = setTimeout(() => {
          const currentState = this.engine.getState();
          const currentPlayer = currentState.players[botId];
          if (!currentPlayer?.isAlive) return;

          // Bot fires ability if fully charged (before or with word submission)
          if (
            currentPlayer.energy >= BALANCE.energy.maxEnergy &&
            currentPlayer.abilityId
          ) {
            const ability = ABILITIES[currentPlayer.abilityId];
            const targetId = ability?.targeting === "player"
              ? pickAbilityTarget(botId, currentState.playerIds, currentState.players, rng)
              : undefined;
            const beforeAbility = currentState.abilityFeed.length;
            this.engine.processEvent({
              type: "USE_ABILITY",
              playerId: botId,
              abilityId: currentPlayer.abilityId,
              targetId,
              timestamp: Date.now(),
            });
            if (this.engine.getState().abilityFeed.length > beforeAbility) {
              this.broadcastAll();
            }
          }

          const before = this.engine.getState().round?.submittedWords[botId]?.length ?? 0;
          this.engine.processEvent({
            type: "SUBMIT_WORD",
            playerId: botId,
            word,
            timestamp: Date.now(),
          });
          const after = this.engine.getState().round?.submittedWords[botId]?.length ?? 0;
          if (after > before) this.broadcastWordCounts();
        }, delay);

        this.botTimeouts.push(t);
      });
    }
  }

  // ── Broadcasting ──────────────────────────────────────────────────────────

  broadcastAll() {
    for (const session of this.sessions.values()) {
      this.sendSnapshot(session.conn, session.playerId);
    }
  }

  sendSnapshot(conn: Party.Connection, playerId: string) {
    const msg: ServerMsg = {
      type: "SNAPSHOT",
      snapshot: this.buildSnapshot(playerId),
      yourPlayerId: playerId,
    };
    conn.send(JSON.stringify(msg));
  }

  broadcastWordCounts() {
    const state = this.engine.getState();
    if (!state.round) return;
    const counts: Record<string, number> = {};
    for (const [pid, words] of Object.entries(state.round.submittedWords)) {
      counts[pid] = words.length;
    }
    const msg: ServerMsg = { type: "WORD_COUNTS", counts };
    const encoded = JSON.stringify(msg);
    for (const session of this.sessions.values()) session.conn.send(encoded);
  }

  broadcastLobbyState() {
    const state = this.engine.getState();

    const humanPlayers = state.playerIds
      .filter((id) => state.players[id].kind === "human")
      .map((id) => ({
        id,
        name: state.players[id].name,
        kind: "human" as const,
        isConnected: !this.disconnected.has(id),
        abilityId: state.players[id].abilityId,
      }));

    // Ghost bot slots
    if (state.config.botBackfill) {
      const ghostCount = Math.max(0, MAX_PLAYERS - humanPlayers.length);
      for (let i = 0; i < ghostCount; i++) {
        humanPlayers.push({ id: `ghost_${i}`, name: "BOT", kind: "bot" as never, isConnected: false, abilityId: null });
      }
    }

    const hostId = this.hostPlayerId;

    for (const session of this.sessions.values()) {
      const msg: ServerMsg = {
        type: "LOBBY_STATE",
        players: humanPlayers,
        roomCode: this.room.id,
        config: state.config,
        lobbyCountdownEndsAt: this.lobbyCountdownEndsAt,
        hostId,
        yourPlayerId: session.playerId,
      };
      session.conn.send(JSON.stringify(msg));
    }
  }

  // ── Snapshot builder ──────────────────────────────────────────────────────

  buildSnapshot(playerId: string): GameSnapshot {
    const state = this.engine.getState();

    const players: SnapshotPlayer[] = state.playerIds.map((id) => {
      const p = state.players[id];
      return {
        id: p.id,
        name: p.name,
        kind: p.kind,
        hp: p.hp,
        isAlive: p.isAlive,
        isConnected: !this.disconnected.has(p.id),
        damageDealtTotal: p.damageDealtTotal,
        eliminations: p.eliminations,
        bestWord: p.bestWord,
        abilityId: p.abilityId,
        visibleStatuses: getVisibleStatuses(p.statuses),
      };
    });

    let round: SnapshotRound | null = null;
    if (state.round) {
      const myPlayer = state.players[playerId];
      const isBlinded = myPlayer?.statuses.some(
        (s) => s.type === "BLIND" && Date.now() < (s as { type: "BLIND"; endsAt: number }).endsAt
      );

      const myWords = state.round.submittedWords[playerId] ?? [];
      let results: Record<string, ClientRoundResult> | null = null;
      if (state.round.results) {
        results = {};
        for (const [pid, r] of Object.entries(state.round.results)) {
          results[pid] = {
            playerId: pid,
            words: pid === playerId ? r.words : [],
            wordsCount: r.words.length,
            damageDealt: r.damageDealt,
            tookChipDamage: r.tookChipDamage,
            chipDamageTaken: r.chipDamageTaken,
            healedHp: r.healedHp,
          };
        }
      }

      round = {
        roundNumber: state.round.roundNumber,
        letters: isBlinded ? [] : state.round.letters,
        phase: state.round.phase,
        startedAt: state.round.startedAt,
        endsAt: state.round.endsAt,
        myWords,
        results,
      };
    }

    const myPlayer = state.players[playerId];
    const self: SelfInfo = myPlayer
      ? { energy: myPlayer.energy, statuses: myPlayer.statuses, privateLetters: myPlayer.privateLetters }
      : { energy: 0, statuses: [], privateLetters: [] };

    return {
      phase: state.phase,
      players,
      playerIds: state.playerIds,
      round,
      roundNumber: state.roundNumber,
      countdownEndsAt: state.countdownEndsAt,
      killFeed: state.killFeed,
      winnerId: state.winnerId,
      chipDamage: state.chipDamage,
      config: state.config,
      abilityFeed: state.abilityFeed,
      self,
      serverNow: Date.now(),
    };
  }

  // ── Rematch ───────────────────────────────────────────────────────────────

  resetToLobby() {
    const oldState = this.engine.getState();
    const config = { ...oldState.config };

    // Preserve host for private rooms
    const oldHostId = this.hostPlayerId;

    // Fresh engine, same config
    this.engine = new SpellfallEngine(config, WORD_SET);

    // Re-add all currently connected humans in session order
    const now = Date.now();
    for (const session of this.sessions.values()) {
      const name = this.playerNames.get(session.playerId) ??
        oldState.players[session.playerId]?.name ?? "Player";
      this.engine.processEvent({
        type: "PLAYER_JOIN",
        playerId: session.playerId,
        name,
        kind: "human",
        bot: null,
        abilityId: null,
        timestamp: now,
      });
    }

    // Restore host (private rooms keep the same host)
    if (config.mode === "private") {
      // If old host is still connected, keep them; otherwise migrate
      const stillConnected = Array.from(this.sessions.values()).some(
        (s) => s.playerId === oldHostId
      );
      if (stillConnected) {
        this.hostPlayerId = oldHostId;
      } else {
        const first = this.sessions.values().next().value as Session | undefined;
        this.hostPlayerId = first?.playerId ?? null;
      }
    }

    // Reset runtime state
    this.disconnected.clear();
    this.scheduledBotRound = -1;
    this.stopTick();
    this.startTick();

    if (this.countdownTimer) {
      clearTimeout(this.countdownTimer);
      this.countdownTimer = null;
      this.lobbyCountdownEndsAt = null;
    }

    // Public rooms: restart auto-countdown
    if (config.mode === "public") {
      this.checkAutoCountdown();
    }

    this.broadcastLobbyState();
    this.pingRegistry();
  }

  async pingRegistryRemove() {
    const state = this.engine.getState();
    // Only rooms that are actually in the registry need to be removed
    if (state.config.mode !== "public" && !state.config.listedPublicly) return;
    const payload = JSON.stringify({ action: "REMOVE", lobbyId: this.room.id });
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stub = (this.room.context.parties as any)?.registry?.get("global");
      await stub.fetch({ method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
    } catch {
      try {
        await fetch("http://localhost:1999/parties/registry/global", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
      } catch { /* best-effort */ }
    }
  }

  async pingRegistry() {
    const state = this.engine.getState();
    // Ping registry for auto-public rooms AND for private rooms the host listed publicly
    if (state.config.mode !== "public" && !state.config.listedPublicly) return;
    const humanCount = state.playerIds.filter((id) => state.players[id].kind === "human").length;
    const payload = JSON.stringify({
      action: "UPDATE",
      lobbyId: this.room.id,
      playerCount: humanCount,
      maxPlayers: state.config.maxPlayers,
      phase: state.phase,
      roundSeconds: state.config.roundSeconds,
      abilitiesEnabled: state.config.abilitiesEnabled,
      listedPublicly: state.config.listedPublicly,
    });
    try {
      // Production: use party-to-party binding (Cloudflare Workers).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stub = (this.room.context.parties as any)?.registry?.get("global");
      await stub.fetch({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });
    } catch {
      // Dev fallback: party-to-party stubs don't work in partykit dev,
      // so fall back to a direct HTTP fetch to localhost.
      try {
        await fetch("http://localhost:1999/parties/registry/global", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
      } catch {
        // Best-effort — registry ping is not critical for gameplay.
      }
    }
  }
}

SpellfallParty satisfies Party.Worker;
