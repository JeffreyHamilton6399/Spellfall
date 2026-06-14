"use client";

import { useEffect, useState } from "react";
import { useGameEngine } from "@/hooks/useGameEngine";
import Lobby from "./Lobby";
import Board from "./Board";
import EndScreen from "./EndScreen";
import AbilityPicker from "./AbilityPicker";
import { ErrorBoundary } from "./ErrorBoundary";
import { DEFAULT_LOBBY_CONFIG } from "@/engine/constants";
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

export default function GameShell() {
  const {
    state,
    loading,
    humanId,
    humanSubmitWord,
    humanSelectAbility,
    humanUseAbility,
    startGame,
    restartGame,
  } = useGameEngine(DEFAULT_LOBBY_CONFIG);

  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);

  const prevRoundRef = { current: -1 };
  useEffect(() => {
    if (state?.round?.phase === "active" && state.round.roundNumber !== prevRoundRef.current) {
      prevRoundRef.current = state.round.roundNumber;
      playRoundStart();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.round?.roundNumber, state?.round?.phase]);

  const handlePlay = () => {
    if (selectedAbility) humanSelectAbility(selectedAbility);
    startGame();
  };

  if (!state || state.phase === "lobby") {
    if (loading) {
      return (
        <div className="min-h-dvh bg-arena-950 flex items-center justify-center">
          <span className="text-slate-700 font-display font-black text-2xl tracking-wide">
            SPELL<span className="text-emerald-900">FALL</span>
          </span>
        </div>
      );
    }
    return (
      <Lobby
        onPlay={handlePlay}
        onLeave={() => window.location.assign("/")}
        abilityPicker={
          <AbilityPicker selectedId={selectedAbility} onSelect={setSelectedAbility} />
        }
      />
    );
  }

  if (state.phase === "countdown") {
    return <CountdownDisplay endsAt={state.countdownEndsAt ?? Date.now()} />;
  }

  if (state.phase === "ended") {
    return (
      <ErrorBoundary>
        <EndScreen
          state={state}
          humanId={humanId}
          isHost={true}
          onPlayAgain={restartGame}
          onLeave={() => window.location.assign("/")}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Board
        state={state}
        humanId={humanId}
        onSubmitWord={humanSubmitWord}
        onUseAbility={humanUseAbility}
      />
    </ErrorBoundary>
  );
}
