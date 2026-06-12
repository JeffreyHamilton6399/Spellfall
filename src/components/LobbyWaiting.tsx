"use client";

import { useEffect, useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, Bot, Timer, Swords, Zap } from "lucide-react";
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
}: Props) {
  const [secs, setSecs] = useState<number | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
    <div className="min-h-dvh bg-arena-950 flex flex-col items-center px-4 py-8 gap-6">
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
            className="flex items-center gap-3 font-mono text-xl font-black text-emerald-400
              bg-arena-800 border border-rim hover:border-rim-hi rounded-xl px-5 py-2.5 transition-colors group"
            title="Click to copy invite link"
          >
            {roomCode}
            <span className="text-slate-500 group-hover:text-emerald-400 transition-colors">
              {copied ? <Check size={15} /> : <Copy size={15} />}
            </span>
          </button>
          {copied && <p className="text-emerald-400 text-xs">Link copied!</p>}
        </div>
      )}

      {/* Ability picker */}
      {config.abilitiesEnabled && (
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
        <ul className="divide-y divide-rim/50 max-h-44 overflow-y-auto">
          {humanPlayers.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  p.isConnected ? "bg-emerald-400" : "bg-slate-600"
                }`}
              />
              <span className="text-ink text-sm font-medium flex-1 truncate">{p.name}</span>
              <div className="flex items-center gap-2">
                {p.id === yourPlayerId && <span className="text-slate-600 text-xs">you</span>}
                {p.id === hostId && config.mode === "private" && (
                  <span className="text-amber-400/70 text-xs">host</span>
                )}
              </div>
            </li>
          ))}
          {config.botBackfill && botCount > 0 && (
            <li className="px-4 py-2.5 opacity-30">
              <span className="text-slate-500 text-sm italic">{botCount} bots will fill</span>
            </li>
          )}
        </ul>
      </div>

      {/* ── Lobby settings ──────────────────────────────────────── */}
      <div className="w-full max-w-xs bg-arena-900 border border-rim rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span className="font-semibold">Match Settings</span>
          <span className="flex items-center gap-2 text-slate-600">
            {isHost ? "editable" : "read-only"}
            {showSettings ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        </button>

        {showSettings && (
          <div className="border-t border-rim px-4 py-4 flex flex-col gap-4">

            {/* Bot backfill */}
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

            {/* Abilities */}
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

            {/* Round length */}
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

            {/* Sudden death threshold */}
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

            {/* Sudden death round length */}
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
        )}
      </div>

      {/* Host controls */}
      {config.mode === "private" && isHost && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          displayFont
          disabled={humanPlayers.length < 1}
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
