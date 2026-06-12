"use client";

import { useEffect, useRef, useState } from "react";
import { usePartyEngine } from "@/hooks/usePartyEngine";
import LobbyWaiting from "./LobbyWaiting";
import Board from "./Board";
import EndScreen from "./EndScreen";
import ConnectionStatus from "./ConnectionStatus";
import { ErrorBoundary } from "./ErrorBoundary";
import { playRoundStart } from "@/lib/audio";

function CountdownDisplay({ endsAt }: { endsAt: number }) {
  const [secs, setSecs] = useState(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
  useEffect(() => {
    const id = setInterval(() => setSecs(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))), 200);
    return () => clearInterval(id);
  }, [endsAt]);
  return (
    <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-4">
      <div className="text-white font-display font-black text-3xl tracking-wide">
        SPELL<span className="text-emerald-400">FALL</span>
      </div>
      <div className="text-9xl font-display font-black text-emerald-400 tabular-nums animate-pop-in">
        {secs}
      </div>
      <div className="text-slate-500">Get ready…</div>
    </div>
  );
}

interface Props {
  partyId: string;
  name: string;
  session: string;
  isPrivate?: boolean;
}

export default function MultiplayerShell({ partyId, name, session }: Props) {
  const {
    phase,
    gameState,
    yourPlayerId,
    selfInfo,
    connectionStatus,
    wordCounts,
    submitWord,
    selectAbility,
    useAbility,
    hostStart,
  } = usePartyEngine(partyId, name, session);

  const humanId = yourPlayerId ?? "";
  const lastRoundRef = useRef(-1);

  useEffect(() => {
    if (
      gameState?.round?.phase === "active" &&
      gameState.round.roundNumber !== lastRoundRef.current
    ) {
      lastRoundRef.current = gameState.round.roundNumber;
      playRoundStart();
    }
  }, [gameState?.round?.roundNumber, gameState?.round?.phase]);

  if (phase.status === "connecting") {
    return (
      <div className="min-h-dvh bg-arena-950 flex items-center justify-center">
        <span className="text-slate-700 font-display font-black text-2xl tracking-wide">
          SPELL<span className="text-emerald-900">FALL</span>
        </span>
      </div>
    );
  }

  if (phase.status === "error") {
    return (
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="font-display font-black text-4xl text-rose-400 tracking-wide">
          Can't join
        </div>
        <div className="text-slate-400 text-sm max-w-xs">{phase.message}</div>
        <button
          onClick={() => window.location.assign("/")}
          className="mt-2 px-6 py-3 bg-arena-800 hover:bg-arena-700 rounded-xl text-sm text-slate-300 border border-rim transition-colors"
        >
          Back to home
        </button>
      </div>
    );
  }

  return (
    <>
      <ConnectionStatus status={connectionStatus} />

      {phase.status === "lobby" && (
        <LobbyWaiting
          players={phase.players}
          roomCode={phase.roomCode}
          config={phase.config}
          lobbyCountdownEndsAt={phase.lobbyCountdownEndsAt}
          hostId={phase.hostId}
          yourPlayerId={humanId}
          onHostStart={hostStart}
          onSelectAbility={selectAbility}
        />
      )}

      {(phase.status === "in_game" || phase.status === "lobby") && gameState !== null && (
        <>
          {gameState.phase === "countdown" && (
            <CountdownDisplay endsAt={gameState.countdownEndsAt ?? Date.now()} />
          )}

          {(gameState.phase === "playing" || gameState.phase === "sudden_death") && (
            <ErrorBoundary>
              <Board
                state={gameState}
                humanId={humanId}
                onSubmitWord={submitWord}
                onUseAbility={useAbility}
                wordCounts={wordCounts}
                selfEnergy={selfInfo.energy}
                selfStatuses={selfInfo.statuses}
                selfPrivateLetters={selfInfo.privateLetters}
              />
            </ErrorBoundary>
          )}

          {gameState.phase === "ended" && (
            <ErrorBoundary>
              <EndScreen
                state={gameState}
                humanId={humanId}
                onPlayAgain={() => window.location.assign("/")}
              />
            </ErrorBoundary>
          )}
        </>
      )}
    </>
  );
}
