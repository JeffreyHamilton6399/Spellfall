"use client";

import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import type { LobbyPlayer } from "@/party/protocol";
import type { LobbyConfig } from "@/engine/types";
import AbilityPicker from "./AbilityPicker";

interface Props {
  players: LobbyPlayer[];
  roomCode: string;
  config: LobbyConfig;
  lobbyCountdownEndsAt: number | null;
  hostId: string | null;
  yourPlayerId: string;
  onHostStart?: () => void;
  onSelectAbility?: (abilityId: string) => void;
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
}: Props) {
  const [secs, setSecs] = useState<number | null>(null);
  const [selectedAbility, setSelectedAbility] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  return (
    <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-7 px-4 py-10">
      {/* Logo */}
      <div className="text-center">
        <h1 className="font-display font-black text-5xl tracking-wide text-white">
          SPELL<span className="text-emerald-400">FALL</span>
        </h1>
        <p className="mt-1 text-slate-500 text-sm">Waiting for players…</p>
      </div>

      {/* Room code */}
      {config.mode === "private" && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-slate-500 text-xs uppercase tracking-widest">Room Code</p>
          <button
            onClick={copyLink}
            className="flex items-center gap-3 font-mono text-2xl font-black text-emerald-400
              bg-arena-800 border border-rim hover:border-rim-hi rounded-xl px-5 py-3 transition-colors group"
            title="Click to copy invite link"
          >
            {roomCode}
            <span className="text-slate-500 group-hover:text-emerald-400 transition-colors">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </span>
          </button>
          {copied && <p className="text-emerald-400 text-xs">Link copied!</p>}
        </div>
      )}

      {/* Ability picker */}
      <AbilityPicker
        selectedId={selectedAbility}
        onSelect={handleSelectAbility}
        disabled={starting}
      />

      {/* Countdown pill */}
      {secs !== null && (
        <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-500/30 rounded-full px-4 py-2">
          <span className="text-slate-400 text-sm">Starting in</span>
          <span className="text-emerald-400 font-display font-black text-xl tabular-nums">{secs}s</span>
        </div>
      )}

      {/* Player list */}
      <div className="w-full max-w-xs bg-arena-900 border border-rim rounded-2xl overflow-hidden">
        <div className="px-4 py-2.5 border-b border-rim text-xs text-slate-500 uppercase tracking-widest flex justify-between items-center">
          <span>Players</span>
          <span>{humanPlayers.length} / 20</span>
        </div>
        <ul className="divide-y divide-rim/50 max-h-48 overflow-y-auto">
          {humanPlayers.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-2.5">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  p.isConnected ? "bg-emerald-400" : "bg-slate-600"
                }`}
              />
              <span className="text-slate-200 text-sm font-medium flex-1 truncate">
                {p.name}
              </span>
              <div className="flex items-center gap-2">
                {p.id === yourPlayerId && (
                  <span className="text-slate-600 text-xs">you</span>
                )}
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

      {/* Host start button */}
      {config.mode === "private" && isHost && (
        <button
          onClick={onHostStart}
          disabled={humanPlayers.length < 1}
          className="w-full max-w-xs py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed
            text-white font-display font-black text-xl tracking-wide rounded-2xl transition-colors shadow-lg shadow-emerald-900/40"
        >
          Start Game
        </button>
      )}

      {config.mode === "private" && !isHost && (
        <p className="text-slate-500 text-sm">Waiting for host to start…</p>
      )}
    </div>
  );
}
