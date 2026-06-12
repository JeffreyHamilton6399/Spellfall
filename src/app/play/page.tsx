"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import MultiplayerShell from "@/components/MultiplayerShell";

function QuickPlay() {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "Player";
  const session = searchParams.get("session") ?? Math.random().toString(36).slice(2);
  const [partyId, setPartyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Goes through Next.js API route to avoid CORS
    fetch("/api/lobby", { method: "POST" })
      .then((r) => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json() as Promise<{ partyId: string }>;
      })
      .then((data) => setPartyId(data.partyId))
      .catch(() =>
        setError("Couldn't reach the matchmaker — is PartyKit running? Check your terminal.")
      );
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="text-red-400 font-bold">Connection Error</div>
        <div className="text-white/50 text-sm max-w-xs text-center">{error}</div>
        <button
          onClick={() => window.location.assign("/")}
          className="mt-2 px-5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors"
        >
          Back
        </button>
      </div>
    );
  }

  if (!partyId) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white/40 text-lg">
        Finding a game…
      </div>
    );
  }

  return <MultiplayerShell partyId={partyId} name={name} session={session} />;
}

export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white/40 text-lg">
          Loading…
        </div>
      }
    >
      <QuickPlay />
    </Suspense>
  );
}
