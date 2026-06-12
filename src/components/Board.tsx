"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import type { GameState, StatusEffect } from "@/engine/types";
import PlayerList from "./PlayerList";
import WordInput from "./WordInput";
import RoundTimer from "./RoundTimer";
import KillFeed from "./KillFeed";
import EnergyMeter from "./EnergyMeter";
import DamageNumbers from "./DamageNumbers";
import SettingsModal from "./SettingsModal";
import { useSettings } from "@/contexts/SettingsContext";

interface Props {
  state: GameState;
  humanId: string;
  onSubmitWord: (word: string) => void;
  onUseAbility?: (abilityId: string, targetId?: string) => void;
  wordCounts?: Record<string, number>;
  selfEnergy?: number;
  selfStatuses?: StatusEffect[];
  selfPrivateLetters?: string[];
}

export default function Board({
  state,
  humanId,
  onSubmitWord,
  onUseAbility,
  wordCounts = {},
  selfEnergy,
  selfStatuses,
  selfPrivateLetters,
}: Props) {
  const { settings } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  const { round, phase } = state;
  const human = state.players[humanId];

  const energy = selfEnergy ?? human?.energy ?? 0;
  const statuses = selfStatuses ?? human?.statuses ?? [];
  const privateLetters = selfPrivateLetters ?? human?.privateLetters ?? [];

  const isSuddenDeath = phase === "sudden_death";
  const roundDurationMs = round
    ? round.endsAt - round.startedAt
    : (isSuddenDeath ? state.config.suddenDeathRoundSeconds : state.config.roundSeconds) * 1000;

  const aliveCount = state.playerIds.filter((id) => state.players[id].isAlive).length;
  const alivePlayers = state.playerIds
    .filter((id) => state.players[id].isAlive)
    .map((id) => ({ id, name: state.players[id].name }));

  return (
    <>
      {/* Sudden-death red vignette */}
      {isSuddenDeath && (
        <div
          className="fixed inset-0 pointer-events-none z-0 animate-vignette"
          style={{
            background: "radial-gradient(ellipse at center, transparent 55%, rgba(244,63,94,0.18) 100%)",
          }}
        />
      )}

      <div className="min-h-dvh bg-arena-950 text-slate-200 flex flex-col relative z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between px-3 md:px-5 py-2.5 border-b border-rim bg-arena-900/80 backdrop-blur-sm gap-3 flex-wrap">
          {/* Logo + sudden death badge */}
          <div className="flex items-center gap-3">
            <span className="font-display font-black text-xl tracking-wide text-white">
              SPELL<span className="text-emerald-400">FALL</span>
            </span>
            {isSuddenDeath && (
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest animate-pulse">
                Sudden Death
              </span>
            )}
          </div>

          {/* Right side: energy + stats + settings */}
          <div className="flex items-center gap-3 ml-auto">
            {human?.isAlive && onUseAbility && (
              <EnergyMeter
                abilityId={human.abilityId}
                energy={energy}
                statuses={statuses}
                alivePlayers={alivePlayers}
                yourPlayerId={humanId}
                onUse={onUseAbility}
              />
            )}

            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>
                <span className="text-white font-bold">{aliveCount}</span>
                <span className="text-slate-600 ml-1 text-xs">alive</span>
              </span>
              <span className="hidden sm:block text-slate-600 text-xs">Rnd {state.roundNumber}</span>
              {human?.isAlive && (
                <span
                  className={`font-bold text-sm font-display ${
                    human.hp <= 30 ? "text-rose-400" : human.hp <= 60 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {human.hp} HP
                </span>
              )}
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
              aria-label="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Sidebar — hidden on small screens */}
          <aside className="hidden sm:flex w-48 lg:w-52 border-r border-rim p-2 flex-col overflow-hidden flex-shrink-0">
            <PlayerList state={state} humanId={humanId} wordCounts={wordCounts} />
          </aside>

          {/* Center */}
          <main className="flex-1 flex flex-col items-center justify-center gap-5 p-4 md:p-6 relative min-w-0">
            {/* Kill feed overlay */}
            <div className="absolute top-3 left-3 right-3 flex flex-col items-start gap-1 pointer-events-none z-10">
              <KillFeed killFeed={state.killFeed} abilityFeed={state.abilityFeed} />
            </div>

            {/* Damage numbers */}
            {human && <DamageNumbers hp={human.hp} />}

            {round && round.phase === "active" ? (
              <>
                <RoundTimer
                  endsAt={round.endsAt}
                  durationMs={roundDurationMs}
                  isSuddenDeath={isSuddenDeath}
                />

                {human?.isAlive ? (
                  <WordInput
                    round={round}
                    onSubmit={onSubmitWord}
                    wordsPlayedThisMatch={human.wordsPlayedThisMatch}
                    privateLetters={privateLetters}
                  />
                ) : (
                  <div className="text-center text-slate-500">
                    <div className="text-2xl font-display font-bold mb-1">Eliminated</div>
                    <div className="text-sm">Watching the round…</div>
                  </div>
                )}

                <div className="text-xs text-slate-600">
                  Zone damage:{" "}
                  <span className="text-rose-500/80 font-semibold">{state.chipDamage}</span> if you submit nothing
                </div>
              </>
            ) : (
              <div className="text-slate-500 text-lg font-display">Resolving…</div>
            )}
          </main>
        </div>

        {/* Mobile player strip (shows when sidebar is hidden) */}
        <div className="sm:hidden border-t border-rim bg-arena-900/60 px-3 py-1.5 flex items-center gap-2 overflow-x-auto">
          {state.playerIds
            .filter((id) => state.players[id].isAlive)
            .slice(0, 6)
            .map((id) => {
              const p = state.players[id];
              return (
                <div
                  key={id}
                  className={`flex-shrink-0 flex items-center gap-1.5 text-xs px-2 py-1 rounded-md ${
                    id === humanId ? "bg-emerald-500/15 text-emerald-300" : "text-slate-400"
                  }`}
                >
                  <span className="font-semibold truncate max-w-[60px]">{p.name}</span>
                  <span
                    className={`font-mono font-bold ${
                      p.hp <= 30 ? "text-rose-400" : p.hp <= 60 ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {p.hp}
                  </span>
                </div>
              );
            })}
          {aliveCount > 6 && (
            <span className="flex-shrink-0 text-xs text-slate-600 pl-1">
              +{aliveCount - 6}
            </span>
          )}
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
