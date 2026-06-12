"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RefreshCw, Users, Timer, Zap, ArrowLeft } from "lucide-react";
import type { BrowseLobby } from "@/app/api/browse/route";
import Button from "@/components/ui/Button";

function getOrCreateSession(): string {
  if (typeof window === "undefined") return "";
  let s = localStorage.getItem("spellfall_session");
  if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("spellfall_session", s); }
  return s;
}

function BrowseContent() {
  const router = useRouter();
  const params = useSearchParams();
  const name    = params.get("name") ?? "Player";
  const session = params.get("session") ?? getOrCreateSession();

  const [lobbies, setLobbies] = useState<BrowseLobby[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const fetchLobbies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/browse");
      const data = await res.json() as BrowseLobby[];
      setLobbies(data);
    } catch {
      setLobbies([]);
    } finally {
      setLoading(false);
      setLastRefresh(Date.now());
    }
  }, []);

  useEffect(() => { fetchLobbies(); }, [fetchLobbies]);

  useEffect(() => {
    const id = setInterval(fetchLobbies, 10_000);
    return () => clearInterval(id);
  }, [fetchLobbies]);

  const joinLobby = (id: string) => {
    router.push(`/play/${id}?name=${encodeURIComponent(name)}&session=${session}`);
  };

  const secsSinceRefresh = Math.floor((Date.now() - lastRefresh) / 1000);

  return (
    <div className="min-h-dvh bg-arena-950 flex flex-col items-center px-4 py-8 gap-6">
      <div className="w-full max-w-md flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <ArrowLeft size={16} />
        </Button>
        <h1 className="font-display font-black text-2xl text-white tracking-wide flex-1">
          Browse Rooms
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 p-0"
          onClick={fetchLobbies}
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      <div className="w-full max-w-md">
        {loading && lobbies === null ? (
          <div className="text-center py-16 text-ink-4 text-sm">Loading rooms…</div>
        ) : lobbies && lobbies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-ink-3 text-sm mb-4">No open lobbies right now.</p>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push(`/play?name=${encodeURIComponent(name)}&session=${session}`)}
            >
              Quick Play (create one)
            </Button>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {(lobbies ?? []).map((lobby) => (
              <li key={lobby.id}>
                <button
                  onClick={() => joinLobby(lobby.id)}
                  className="w-full bg-arena-900 border border-rim hover:border-rim-hi rounded-xl px-4 py-3.5 flex items-center gap-4 transition-colors text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1.5 text-ink-3 text-xs">
                        <Users size={12} />
                        <span className="font-semibold text-ink">{lobby.playerCount}</span>
                        <span className="text-ink-4">/ {lobby.maxPlayers}</span>
                      </span>
                      <span className="flex items-center gap-1.5 text-ink-4 text-xs">
                        <Timer size={12} />
                        {lobby.roundSeconds}s rounds
                      </span>
                      {lobby.abilitiesEnabled && (
                        <span className="flex items-center gap-1 text-emerald-500 text-xs">
                          <Zap size={11} />
                          Abilities
                        </span>
                      )}
                    </div>
                    <p className="text-ink-4 text-[10px] mt-1 font-mono">
                      SPELL-{lobby.id.split("_").pop()?.toUpperCase().slice(0, 4)}
                    </p>
                  </div>
                  <span className="text-ink-4 group-hover:text-emerald-400 text-sm font-semibold transition-colors">
                    Join →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-ink-4 text-xs">
        Auto-refreshing · last {secsSinceRefresh}s ago
      </p>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-arena-950 flex items-center justify-center text-ink-4 text-sm">
        Loading…
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
