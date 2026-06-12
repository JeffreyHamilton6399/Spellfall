"use client";

import { Suspense } from "react";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import MultiplayerShell from "@/components/MultiplayerShell";

function PrivateRoom({ code }: { code: string }) {
  const searchParams = useSearchParams();
  const name    = searchParams.get("name")    ?? "Player";
  const session = searchParams.get("session") ?? Math.random().toString(36).slice(2);

  return (
    <MultiplayerShell
      partyId={code}
      name={name}
      session={session}
      isPrivate
    />
  );
}

export default function PrivateRoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-arena-950 flex flex-col items-center justify-center gap-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-rim" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
          </div>
          <span className="font-display font-black text-2xl tracking-wide text-ink-4">
            SPELL<span className="text-emerald-900">FALL</span>
          </span>
        </div>
      }
    >
      <PrivateRoom code={code} />
    </Suspense>
  );
}
