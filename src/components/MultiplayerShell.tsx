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
interface CountdownProps {
  endsAt: number;
  clockOffset?: number;
  totalMs?: number;
  players?: Array<{ id: string; name: string }>;
  yourPlayerId?: string;
}

function CountdownDisplay({ endsAt, clockOffset = 0, totalMs, players, yourPlayerId }: CountdownProps) {
  const computeMs = () => Math.max(0, endsAt - Date.now() - clockOffset);
  const [msLeft, setMsLeft] = useState(computeMs);
  // Total captured once at mount — uses explicit prop when available for accuracy
  const totalRef = useRef(totalMs ?? Math.max(1, computeMs()));

  useEffect(() => {
    const id = setInterval(() => setMsLeft(computeMs()), 100);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, clockOffset]);

  const secs     = Math.ceil(msLeft / 1000);
  const R        = 38;
  const C        = 2 * Math.PI * R;
  const fraction = Math.max(0, Math.min(1, msLeft / totalRef.current));
  const offset   = C * (1 - fraction);

  const opponents = players?.filter((p) => p.id !== yourPlayerId) ?? [];

  return (
    <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-6 px-4">
      <div className="text-ink font-display font-black text-3xl tracking-wide">
        SPELL<span className="text-emerald-400">FALL</span>
      </div>

      {/* Circular ring — fraction driven by raw ms, not ceil'd seconds */}
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
            style={{ transition: "stroke-dashoffset 0.1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span key={secs} className="font-display font-black text-5xl tabular-nums text-emerald-400 animate-pop-in">
            {secs}
          </span>
        </div>
      </div>

      <div className="text-ink-3 text-sm tracking-wide">Get ready…</div>

      {/* Opponent roster */}
      {opponents.length > 0 && (
        <div className="flex flex-col items-center gap-2 w-full max-w-xs">
          <p className="text-ink-4 text-[10px] uppercase tracking-widest font-semibold">
            {opponents.length === 1 ? "Opponent" : "Opponents"}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {opponents.slice(0, 8).map((p) => (
              <span key={p.id} className="bg-arena-900 border border-rim rounded-lg px-2.5 py-1 text-xs text-ink-2 font-medium">
                {p.name}
              </span>
            ))}
            {opponents.length > 8 && (
              <span className="bg-arena-900 border border-rim rounded-lg px-2.5 py-1 text-xs text-ink-4">
                +{opponents.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}
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
            <CountdownDisplay
              endsAt={gameState.countdownEndsAt ?? Date.now()}
              clockOffset={clockOffset}
              totalMs={gameState.config.countdownSeconds * 1000}
              players={gameState.playerIds.map((id) => ({ id, name: gameState.players[id].name }))}
              yourPlayerId={humanId}
            />
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
