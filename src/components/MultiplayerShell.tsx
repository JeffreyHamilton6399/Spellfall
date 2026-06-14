"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePartyEngine } from "@/hooks/usePartyEngine";
import { useAuth } from "@/contexts/AuthContext";
import LobbyWaiting from "./LobbyWaiting";
import Board from "./Board";
import EndScreen from "./EndScreen";
import ConnectionStatus from "./ConnectionStatus";
import { ErrorBoundary } from "./ErrorBoundary";
import { playRoundStart } from "@/lib/audio";
import Button from "./ui/Button";

/* ── Pre-game countdown (3-2-1) ──────────────────────────────────────────── */
function CountdownDisplay({ endsAt, clockOffset = 0 }: { endsAt: number; clockOffset?: number }) {
  const remaining = () => Math.max(0, Math.ceil((endsAt - Date.now() - clockOffset) / 1000));
  const [secs, setSecs] = useState(remaining);
  // Capture the initial total once at mount so the ring sweeps linearly 1→0
  const totalRef = useRef(Math.max(1, remaining()));

  useEffect(() => {
    const id = setInterval(() => setSecs(remaining()), 200);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, clockOffset]);

  const R = 38;
  const C = 2 * Math.PI * R;
  const fraction = secs / totalRef.current;
  const offset  = C * (1 - fraction);

  return (
    <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-6">
      <div className="text-ink font-display font-black text-3xl tracking-wide">
        SPELL<span className="text-emerald-400">FALL</span>
      </div>

      {/* Circular ring countdown */}
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={R} fill="none" strokeWidth="6" stroke="rgba(255,255,255,0.06)" />
          <circle
            cx="50" cy="50" r={R}
            fill="none" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={offset}
            stroke="#10b981"
            style={{ transition: "stroke-dashoffset 0.2s linear" }}
          />
        </svg>
        {/* Number re-animates each tick via key */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            key={secs}
            className="font-display font-black text-5xl tabular-nums text-emerald-400 animate-pop-in"
          >
            {secs}
          </span>
        </div>
      </div>

      <div className="text-ink-3 text-sm tracking-wide">Get ready…</div>
    </div>
  );
}

/* ── Loading spinner ─────────────────────────────────────────────────────── */
function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-rim" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin-ring" />
      </div>
      <span className="font-display font-black text-2xl tracking-wide text-ink-4">
        SPELL<span className="text-emerald-900">FALL</span>
      </span>
      {label && <span className="text-ink-4 text-sm">{label}</span>}
    </div>
  );
}

interface Props {
  partyId: string;
  name: string;
  session: string;
  isPrivate?: boolean;
  isRanked?: boolean;
  onGameInProgress?: () => void;
}

export default function MultiplayerShell({ partyId, name, session, isRanked, onGameInProgress }: Props) {
  const { session: authSession } = useAuth();
  const {
    phase,
    gameState,
    yourPlayerId,
    selfInfo,
    connectionStatus,
    wordCounts,
    clockOffset,
    hostId,
    rankedResult,
    submitWord,
    selectAbility,
    useAbility,
    hostStart,
    updateConfig,
    kickPlayer,
    transferHost,
    rematchVote,
    disconnect,
  } = usePartyEngine(partyId, name, session, authSession?.access_token);

  const leaveLobby = useCallback(() => {
    disconnect();
    window.location.assign("/");
  }, [disconnect]);

  // Remount LobbyWaiting on each new match so all local state (ability selection,
  // confirmLeave, etc.) starts fresh.
  const [lobbyKey, setLobbyKey] = useState(0);
  const prevPhaseStatusRef = useRef<string>(phase.status);
  useEffect(() => {
    if (prevPhaseStatusRef.current === "in_game" && phase.status === "lobby") {
      setLobbyKey((k) => k + 1);
    }
    prevPhaseStatusRef.current = phase.status;
  }, [phase.status]);

  const humanId         = yourPlayerId ?? "";
  const lastRoundRef    = useRef(-1);

  useEffect(() => {
    if (
      gameState?.round?.phase === "active" &&
      gameState.round.roundNumber !== lastRoundRef.current
    ) {
      lastRoundRef.current = gameState.round.roundNumber;
      playRoundStart();
    }
  }, [gameState?.round?.roundNumber, gameState?.round?.phase]);

  if (phase.status === "connecting") return <LoadingSpinner />;

  if (phase.status === "error") {
    const isKicked        = phase.code === "KICKED";
    const isInProgress    = phase.code === "GAME_IN_PROGRESS";

    if (isRanked && isInProgress && onGameInProgress) {
      onGameInProgress();
      return <LoadingSpinner label="Finding another match…" />;
    }

    return (
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className={`font-display font-black text-4xl tracking-wide ${isKicked ? "text-amber-400" : "text-rose-400"}`}>
          {isKicked ? "Removed from lobby" : "Can’t join"}
        </div>
        <div className="text-ink-3 text-sm max-w-xs">{phase.message}</div>
        <Button variant="secondary" onClick={() => window.location.assign("/")}>
          Back to home
        </Button>
      </div>
    );
  }

  return (
    <>
      <ConnectionStatus status={connectionStatus} />

      {phase.status === "lobby" && (
        <LobbyWaiting
          key={lobbyKey}
          players={phase.players}
          roomCode={phase.roomCode}
          config={phase.config}
          lobbyCountdownEndsAt={phase.lobbyCountdownEndsAt}
          hostId={phase.hostId}
          yourPlayerId={humanId}
          onHostStart={hostStart}
          onSelectAbility={selectAbility}
          onUpdateConfig={updateConfig}
          onLeave={leaveLobby}
          onKick={kickPlayer}
          onTransferHost={transferHost}
        />
      )}

      {(phase.status === "in_game" || phase.status === "lobby") && gameState !== null && (
        <>
          {gameState.phase === "countdown" && (
            <CountdownDisplay endsAt={gameState.countdownEndsAt ?? Date.now()} clockOffset={clockOffset} />
          )}

          {(gameState.phase === "playing" || gameState.phase === "sudden_death") && (
            <ErrorBoundary>
              <Board
                state={gameState}
                humanId={humanId}
                onSubmitWord={submitWord}
                onUseAbility={useAbility}
                onLeave={() => { disconnect(); window.location.assign("/"); }}
                wordCounts={wordCounts}
                selfEnergy={selfInfo.energy}
                selfStatuses={selfInfo.statuses}
                selfPrivateLetters={selfInfo.privateLetters}
                clockOffset={clockOffset}
              />
            </ErrorBoundary>
          )}

          {gameState.phase === "ended" && (
            <ErrorBoundary>
              <EndScreen
                state={gameState}
                humanId={humanId}
                isHost={hostId === humanId}
                isRanked={isRanked}
                rankedResult={rankedResult}
                onPlayAgain={rematchVote}
                onLeave={() => { disconnect(); window.location.assign("/"); }}
              />
            </ErrorBoundary>
          )}
        </>
      )}
    </>
  );
}
