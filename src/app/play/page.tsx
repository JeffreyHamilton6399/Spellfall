"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MultiplayerShell from "@/components/MultiplayerShell";
import Button from "@/components/ui/Button";

function Spinner() {
  return (
    <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-5">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-rim" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin-ring" />
      </div>
      <span className="font-display font-black text-2xl tracking-wide text-ink-4">
        SPELL<span className="text-emerald-900">FALL</span>
      </span>
    </div>
  );
}

function QuickPlay() {
  const searchParams = useSearchParams();
  const name    = searchParams.get("name")    ?? "Player";
  const session = searchParams.get("session") ?? Math.random().toString(36).slice(2);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/lobby", { method: "POST" })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({})) as { detail?: string };
          throw new Error(body.detail ?? `HTTP ${r.status}`);
        }
        return r.json() as Promise<{ partyId: string }>;
      })
      .then((data) => {
        if (!data.partyId) throw new Error("No partyId in registry response");
        setPartyId(data.partyId);
      })
      .catch((e: Error) => {
        const detail = e.message ?? "";
        console.error("[quick-play] matchmaker error:", detail);
        setError(
          detail.includes("localhost") || detail.includes("unreachable")
            ? "PartyKit isn't running. Start it with: npm run dev"
            : `Couldn't reach the matchmaker — ${detail}`
        );
      });
  }, []);

  if (error) {
    return (
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="font-display font-black text-3xl text-rose-400 tracking-wide">Connection Error</div>
        <div className="text-ink-3 text-sm max-w-xs">{error}</div>
        <Button variant="secondary" onClick={() => window.location.assign("/")}>
          Back to home
        </Button>
      </div>
    );
  }

  if (!partyId) return <Spinner />;

  return <MultiplayerShell partyId={partyId} name={name} session={session} />;
}

export default function PlayPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <QuickPlay />
    </Suspense>
  );
}
