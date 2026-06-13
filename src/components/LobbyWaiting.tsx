"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Bot, Timer, Swords, Zap, Crown, X, LogOut, Globe, SlidersHorizontal } from "lucide-react";
import type { LobbyPlayer } from "@/party/protocol";
import type { ConfigPatch } from "@/party/protocol";
import type { LobbyConfig } from "@/engine/types";
import AbilityPicker from "./AbilityPicker";
import Button from "./ui/Button";

interface Props {
  players: LobbyPlayer[];
  roomCode: string;
  config: LobbyConfig;
  lobbyCountdownEndsAt: number | null;
  hostId: string | null;
  yourPlayerId: string;
  onHostStart?: () => void;
  onSelectAbility?: (abilityId: string) => void;
  onUpdateConfig?: (patch: ConfigPatch) => void;
  onLeave?: () => void;
  onKick?: (targetId: string) => void;
  onTransferHost?: (targetId: string) => void;
}

export default function LobbyWaiting({
  players,
  roomCode,
  config,
  lobbyCountdownEndsAt,
  hostId,
  yourPlayerId,
  onHostStart,
  onSelectAbility,
  onUpdateConfig,
  onLeave,
  onKick,
  onTransferHost,
}: Props) {
  const [secs, setSecs] = useState<number | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [kickTarget, setKickTarget] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!lobbyCountdownEndsAt) { setSecs(null); return; }
    const tick = () => setSecs(Math.max(0, Math.ceil((lobbyCountdownEndsAt - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [lobbyCountdownEndsAt]);

  const isHost = hostId === yourPlayerId;
  const humanPlayers = players.filter((p) => p.kind === "human");
  const botCount = players.filter((p) => p.kind === "bot").length;
  const starting = secs !== null;

  const handleSelectAbility = (id: string) => {
    setSelectedAbility(id);
    onSelectAbility?.(id);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/play/${roomCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const patch = (p: ConfigPatch) => onUpdateConfig?.(p);

  return (
    <>
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center px-4 py-8 gap-6 relative">

        {/* Leave button — top left */}
        <div className="absolute top-4 left-4">
          <button
            onClick={() => onLeave?.()}
            className="flex items-center gap-1.5 text-ink-4 hover:text-ink-3 text-xs font-medium transition-colors py-1.5 px-2 rounded-lg hover:bg-arena-900"
          >
            <LogOut size={13} />
            Leave
          </button>
        </div>

        {/* Match settings — top right */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 text-ink-4 hover:text-ink-3 text-xs font-medium transition-colors py-1.5 px-2 rounded-lg hover:bg-arena-900"
            title="Match settings"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Match</span>
          </button>
        </div>

        {/* Logo */}
        <div className="text-center">
          <h1 className="font-display font-black text-5xl tracking-wide text-white leading-none">
            SPELL<span className="text-emerald-400">FALL</span>
          </h1>
          <p className="mt-1.5 text-ink-3 text-sm">Waiting for players…</p>
        </div>

        {/* Room code (private rooms) */}
        {config.mode === "private" && (
          <div className="flex flex-col items-center gap-2">
            <p className="text-ink-4 text-[10px] uppercase tracking-widest">Room Code</p>
            <button
              onClick={copyLink}
              className="flex items-center gap-3 font-mono text-xl font-black
                bg-arena-800 border border-rim hover:border-rim-hi rounded-xl px-5 py-2.5 transition-colors group"
              title="Click to copy invite link"
            >
              <span className="text-emerald-400">{roomCode}</span>
              <span className="text-slate-500 group-hover:text-emerald-400 transition-colors">
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </span>
            </button>
            {copied && <p className="text-emerald-400 text-xs">Link copied!</p>}
          </div>
        )}

        {/* Ability picker */}
        {config.abilitiesEnabled !== false && (
          <AbilityPicker
            selectedId={selectedAbility}
            onSelect={handleSelectAbility}
            disabled={starting}
          />
        )}

        {/* Countdown */}
        {secs !== null && (
          <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-500/30 rounded-full px-4 py-2">
            <span className="text-slate-400 text-sm">Starting in</span>
            <span className="text-emerald-400 font-display font-black text-xl tabular-nums">{secs}s</span>
          </div>
        )}

        {/* Player list */}
        <div className="w-full max-w-xs bg-arena-900 border border-rim rounded-2xl overflow-hidden">
          <div className="px-4 py-2.5 border-b border-rim text-[10px] text-ink-4 uppercase tracking-widest flex justify-between items-center">
            <span>Players</span>
            <span>{humanPlayers.length} / {config.maxPlayers}</span>
          </div>
          <ul className="divide-y divide-rim/50 max-h-52 overflow-y-auto">
            {humanPlayers.map((p) => (
              <li key={p.id}>
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      p.isConnected ? "bg-emerald-400" : "bg-slate-600"
                    }`}
                  />
                  <span className="text-ink text-sm font-medium flex-1 truncate">{p.name}</span>
                  <div className="flex items-center gap-1.5">
                    {p.id === yourPlayerId && (
                      <span className="text-slate-600 text-xs">you</span>
                    )}
                    {p.id === hostId && (
                      <span className="text-amber-400/70 text-xs">host</span>
                    )}
                    {isHost && p.id !== yourPlayerId && p.kind === "human" && !starting && (
                      <div className="flex items-center gap-0.5 ml-0.5">
                        <button
                          onClick={() => onTransferHost?.(p.id)}
                          title={`Make ${p.name} host`}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-amber-400 rounded transition-colors"
                        >
                          <Crown size={11} />
                        </button>
                        <button
                          onClick={() => setKickTarget(kickTarget?.id === p.id ? null : { id: p.id, name: p.name })}
                          title={`Kick ${p.name}`}
                          className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                            kickTarget?.id === p.id ? "text-rose-400" : "text-slate-600 hover:text-rose-400"
                          }`}
                        >
                          <X size={11} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {kickTarget?.id === p.id && (
                  <div className="flex items-center gap-2 px-4 pb-2.5 pt-0">
                    <span className="text-xs text-rose-400 flex-1">Remove {p.name}?</span>
                    <button
                      onClick={() => { onKick?.(p.id); setKickTarget(null); }}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={() => setKickTarget(null)}
                      className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </li>
            ))}
            {config.botBackfill && botCount > 0 && (
              <li className="px-4 py-2.5 opacity-30">
                <span className="text-slate-500 text-sm italic">{botCount} bots will fill</span>
              </li>
            )}
          </ul>
        </div>

        {/* Host controls */}
        {config.mode === "private" && isHost && (
          <Button
            variant="primary"
            size="lg"
            fullWidth
            displayFont
            disabled={humanPlayers.length < 1 || starting}
            className="max-w-xs text-xl"
            onClick={onHostStart}
          >
            Start Game
          </Button>
        )}

        {config.mode === "private" && !isHost && (
          <p className="text-ink-3 text-sm">Waiting for host to start…</p>
        )}
      </div>

      {/* ── Settings drawer ──────────────────────────────────────────────── */}
      {showSettings && (
        <div className="fixed inset-0 z-40">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSettings(false)}
          />

          {/* Panel: bottom sheet on mobile, right drawer on sm+ */}
          <div className="absolute
            bottom-0 inset-x-0 max-h-[85vh] rounded-t-2xl
            sm:inset-y-0 sm:right-0 sm:bottom-auto sm:inset-x-auto sm:left-auto sm:w-80 sm:max-h-none sm:rounded-none sm:rounded-l-2xl
            bg-arena-900 border-t sm:border-t-0 sm:border-l border-rim flex flex-col overflow-hidden"
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-rim flex-shrink-0">
              <h2 className="font-display font-bold text-lg text-ink">Match Settings</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink-4">{isHost ? "editable" : "read-only"}</span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:text-ink hover:bg-arena-800 transition-colors"
                  aria-label="Close settings"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Drawer content */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">

              {/* Visibility toggle — private rooms */}
              {config.mode === "private" && isHost && (
                <ToggleRow
                  icon={<Globe size={14} />}
                  label="List in Browse"
                  description="Let anyone discover and join this room"
                  checked={config.listedPublicly ?? false}
                  onChange={(v) => patch({ listedPublicly: v })}
                />
              )}
              {config.mode === "private" && !isHost && (config.listedPublicly ?? false) && (
                <ReadRow icon={<Globe size={14} />} label="Visibility" value="Listed publicly" />
              )}

              {isHost ? (
                <ToggleRow
                  icon={<Bot size={14} />}
                  label="Bot backfill"
                  description="Fill empty slots with AI players"
                  checked={config.botBackfill}
                  onChange={(v) => patch({ botBackfill: v })}
                />
              ) : (
                <ReadRow icon={<Bot size={14} />} label="Bots" value={config.botBackfill ? "On" : "Off"} />
              )}

              {isHost ? (
                <ToggleRow
                  icon={<Zap size={14} />}
                  label="Abilities"
                  description="Players can use special abilities"
                  checked={config.abilitiesEnabled}
                  onChange={(v) => patch({ abilitiesEnabled: v })}
                />
              ) : (
                <ReadRow icon={<Zap size={14} />} label="Abilities" value={config.abilitiesEnabled ? "On" : "Off"} />
              )}

              {isHost ? (
                <SliderRow
                  icon={<Timer size={14} />}
                  label="Round length"
                  value={config.roundSeconds}
                  min={10} max={60} step={5}
                  unit="s"
                  onChange={(v) => patch({ roundSeconds: v })}
                />
              ) : (
                <ReadRow icon={<Timer size={14} />} label="Round length" value={`${config.roundSeconds}s`} />
              )}

              {isHost ? (
                <SliderRow
                  icon={<Swords size={14} />}
                  label="Sudden death at"
                  value={config.suddenDeathThreshold}
                  min={2} max={8} step={1}
                  unit=" left"
                  onChange={(v) => patch({ suddenDeathThreshold: v })}
                />
              ) : (
                <ReadRow icon={<Swords size={14} />} label="Sudden death" value={`${config.suddenDeathThreshold} players left`} />
              )}

              {isHost ? (
                <SliderRow
                  icon={<Timer size={14} />}
                  label="SD round length"
                  value={config.suddenDeathRoundSeconds}
                  min={5} max={30} step={5}
                  unit="s"
                  onChange={(v) => patch({ suddenDeathRoundSeconds: v })}
                />
              ) : (
                <ReadRow icon={<Timer size={14} />} label="SD round length" value={`${config.suddenDeathRoundSeconds}s`} />
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  icon, label, description, checked, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left w-full group"
    >
      <span className={`flex-shrink-0 ${checked ? "text-emerald-400" : "text-slate-600"}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${checked ? "text-white" : "text-slate-400"}`}>{label}</div>
        <div className="text-xs text-slate-600 truncate">{description}</div>
      </div>
      <div className={`flex-shrink-0 relative w-9 h-5 rounded-full transition-colors ${checked ? "bg-emerald-500" : "bg-white/10"}`}>
        <div className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
      </div>
    </button>
  );
}

function SliderRow({
  icon, label, value, min, max, step, unit, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <span className="text-slate-600">{icon}</span>
          {label}
        </label>
        <span className="text-xs font-mono text-emerald-400 tabular-nums">{value}{unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 accent-emerald-500 cursor-pointer"
      />
    </div>
  );
}

function ReadRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-600 flex-shrink-0">{icon}</span>
      <span className="text-sm text-slate-500 flex-1">{label}</span>
      <span className="text-sm text-slate-300 font-medium">{value}</span>
    </div>
  );
}
