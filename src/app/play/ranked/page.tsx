"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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

function RankedQueue() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { user, session: authSession, loading } = useAuth();

  const name    = searchParams.get("name")    ?? "Player";
  const session = searchParams.get("session") ?? Math.random().toString(36).slice(2);

  const [roomId, setRoomId] = useState<string | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const offsetRef           = useRef(0);

  useEffect(() => {
    // Wait for auth to settle before deciding
    if (loading) return;

    if (!user || !authSession?.access_token) {
      router.replace("/auth/login?mode=signin&oauth_error=Sign+in+to+play+Ranked");
      return;
    }

    async function findRoom(offset: number) {
      try {
        const res = await fetch(`/api/ranked-join?offset=${offset}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authSession!.access_token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { roomId: string };
        setRoomId(data.roomId);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Matchmaking error";
        setError(msg);
      }
    }

    findRoom(offsetRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  if (loading) return <Spinner />;

  if (!roomId && !error) {
    return (
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-5 relative">
        <div className="absolute top-4 left-4">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-ink-4 hover:text-ink-3 text-xs font-medium transition-colors py-1.5 px-2 rounded-lg hover:bg-arena-900"
          >
            <ArrowLeft size={13} />
            Home
          </button>
        </div>
        <Spinner />
        <span className="text-ink-4 text-sm">Finding a ranked match…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-5 px-4 text-center">
        <div className="font-display font-black text-3xl text-rose-400 tracking-wide">Matchmaking Error</div>
        <div className="text-ink-3 text-sm max-w-xs">{error}</div>
        <Button variant="secondary" onClick={() => window.location.assign("/")}>Back to home</Button>
      </div>
    );
  }

  return (
    <MultiplayerShell
      partyId={roomId!}
      name={name}
      session={session}
      isRanked
      onGameInProgress={() => {
        // Current slot is full/started — try the next time window
        offsetRef.current += 1;
        setRoomId(null);
        fetch(`/api/ranked-join?offset=${offsetRef.current}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${authSession!.access_token}` },
        })
          .then((r) => r.json() as Promise<{ roomId: string }>)
          .then((d) => setRoomId(d.roomId))
          .catch((e: unknown) => setError(e instanceof Error ? e.message : "Matchmaking error"));
      }}
    />
  );
}

export default function RankedPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RankedQueue />
    </Suspense>
  );
}
