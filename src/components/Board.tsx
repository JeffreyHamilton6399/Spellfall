"use client";

import { useMemo, useState } from "react";
import { Settings } from "lucide-react";
import type { GameState, StatusEffect } from "@/engine/types";
import PlayerList from "./PlayerList";
import WordInput from "./WordInput";
import RoundTimer from "./RoundTimer";
import KillFeed from "./KillFeed";
import EnergyMeter from "./EnergyMeter";
import DamageNumbers from "./DamageNumbers";
import HpBar from "./HpBar";
import SettingsModal from "./SettingsModal";
import Button from "./ui/Button";

interface Props {
  state: GameState;
  humanId: string;
  onSubmitWord: (word: string) => void;
  onUseAbility?: (abilityId: string, targetId?: string) => void;
  wordCounts?: Record<string, number>;
  selfEnergy?: number;
  selfStatuses?: StatusEffect[];
  selfPrivateLetters?: string[];
  clockOffset?: number;
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
  clockOffset = 0,
}: Props) {
  const [showSettings, setShowSettings] = useState(false);

  const { round, phase } = state;
  const human = state.players[humanId];

  const energy         = selfEnergy   ?? human?.energy         ?? 0;
  const statuses       = selfStatuses ?? human?.statuses        ?? [];
  const privateLetters = selfPrivateLetters ?? human?.privateLetters ?? [];

  const isSuddenDeath  = phase === "sudden_death";
  const roundDurationMs = round
    ? round.endsAt - round.startedAt
    : (isSuddenDeath ? state.config.suddenDeathRoundSeconds : state.config.roundSeconds) * 1000;

  const aliveCount = useMemo(
    () => state.playerIds.filter((id) => state.players[id].isAlive).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.playerIds, state.players]
  );

  const alivePlayers = useMemo(
    () =>
      state.playerIds
        .filter((id) => state.players[id].isAlive)
        .map((id) => ({ id, name: state.players[id].name })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.playerIds, state.players]
  );

  const hasKillFeed = state.killFeed.length > 0 || (state.abilityFeed?.length ?? 0) > 0;

  return (
    <>
      {/* Sudden-death vignette */}
      {isSuddenDeath && (
        <div
          className="fixed inset-0 pointer-events-none z-0 animate-vignette"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(244,63,94,0.18) 100%)",
          }}
        />
      )}

      <div className="min-h-dvh bg-arena-950 text-ink flex flex-col relative z-10">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="flex items-center px-3 md:px-5 py-2.5 border-b border-rim bg-arena-900/80 backdrop-blur-sm gap-3">
          <span className="font-display font-black text-xl tracking-wide text-white leading-none">
            SPELL<span className="text-emerald-400">FALL</span>
          </span>

          {isSuddenDeath && (
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-widest animate-pulse hidden sm:inline">
              Sudden Death
            </span>
          )}

          <div className="flex items-center gap-3 ml-auto text-sm">
            <span className="text-ink-4 text-xs">
              <span className="text-white font-bold">{aliveCount}</span>
              <span className="ml-1">alive</span>
            </span>
            <span className="hidden sm:inline text-ink-4 text-xs">
              Rnd {state.roundNumber}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0 rounded-lg"
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
            >
              <Settings size={16} />
            </Button>
          </div>
        </header>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Sidebar — players ranked */}
          <aside className="hidden sm:flex flex-col w-44 lg:w-52 border-r border-rim flex-shrink-0 overflow-hidden">
            <div className="px-3 py-2 border-b border-rim/60 flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-ink-4 font-semibold">
                Players
              </span>
              <span className="text-[10px] text-ink-4 font-mono">{aliveCount} left</span>
            </div>
            {hasKillFeed && (
              <div className="border-b border-rim/60 p-2 max-h-32 overflow-hidden">
                <KillFeed killFeed={state.killFeed} abilityFeed={state.abilityFeed} />
              </div>
            )}
            <div className="flex-1 p-2 overflow-y-auto min-h-0">
              <PlayerList state={state} humanId={humanId} wordCounts={wordCounts} />
            </div>
          </aside>

          {/* Center — main play area */}
          <main className="flex-1 flex flex-col items-center justify-center overflow-y-auto min-w-0">
            {round && round.phase === "active" ? (
              <div className="w-full max-w-sm px-4 py-6 flex flex-col items-center gap-5">
                {/* Timer */}
                <RoundTimer
                  endsAt={round.endsAt}
                  durationMs={roundDurationMs}
                  isSuddenDeath={isSuddenDeath}
                  clockOffset={clockOffset}
                />

                {human?.isAlive ? (
                  <>
                    {/* Player context card: HP + energy docked above the rack */}
                    <div className="w-full bg-arena-900/60 border border-rim rounded-2xl p-3 flex flex-col gap-2.5">
                      {/* HP row — relative so DamageNumbers positions correctly */}
                      <div className="relative flex items-center gap-3">
                        <span
                          className={`font-display font-black text-2xl tabular-nums leading-none flex-shrink-0 ${
                            human.hp <= 30
                              ? "text-rose-400"
                              : human.hp <= 60
                              ? "text-amber-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {human.hp}
                          <span className="text-sm font-semibold text-ink-4 ml-0.5">HP</span>
                        </span>
                        <div className="flex-1">
                          <HpBar hp={human.hp} />
                        </div>
                        <DamageNumbers hp={human.hp} />
                      </div>

                      {/* Energy / ability row */}
                      {onUseAbility && state.config.abilitiesEnabled !== false && (
                        <EnergyMeter
                          abilityId={human.abilityId}
                          energy={energy}
                          statuses={statuses}
                          alivePlayers={alivePlayers}
                          yourPlayerId={humanId}
                          onUse={onUseAbility}
                        />
                      )}
                    </div>

                    {/* Word input — the centrepiece */}
                    <WordInput
                      round={round}
                      onSubmit={onSubmitWord}
                      wordsPlayedThisMatch={human.wordsPlayedThisMatch}
                      privateLetters={privateLetters}
                    />
                  </>
                ) : (
                  <div className="text-center text-ink-3 py-8">
                    <div className="text-2xl font-display font-bold mb-1">Eliminated</div>
                    <div className="text-sm">Watching the round…</div>
                  </div>
                )}

                <p className="text-xs text-ink-4">
                  Zone:{" "}
                  <span className="text-rose-500/80 font-semibold">{state.chipDamage}</span> dmg if
                  you submit nothing
                </p>
              </div>
            ) : (
              <div className="text-ink-3 text-lg font-display">Resolving…</div>
            )}
          </main>
        </div>

        {/* ── Mobile bottom strip ─────────────────────────────── */}
        <div className="sm:hidden border-t border-rim bg-arena-900/60 px-3 py-1.5 flex items-center gap-2 overflow-x-auto flex-shrink-0">
          {isSuddenDeath && (
            <span className="flex-shrink-0 text-[10px] font-bold text-rose-400 uppercase tracking-widest animate-pulse mr-1">
              SD
            </span>
          )}
          {state.playerIds
            .filter((id) => state.players[id].isAlive)
            .slice(0, 7)
            .map((id) => {
              const p = state.players[id];
              return (
                <div
                  key={id}
                  className={`flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1 rounded-md border ${
                    id === humanId
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      : "border-transparent text-ink-2"
                  }`}
                >
                  <span className="font-semibold truncate max-w-[56px]">{p.name}</span>
                  <span
                    className={`font-mono font-bold text-[10px] ${
                      p.hp <= 30 ? "text-rose-400" : p.hp <= 60 ? "text-amber-400" : "text-emerald-400"
                    }`}
                  >
                    {p.hp}
                  </span>
                </div>
              );
            })}
          {aliveCount > 7 && (
            <span className="flex-shrink-0 text-xs text-ink-4 pl-1">+{aliveCount - 7}</span>
          )}
        </div>
      </div>

      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
