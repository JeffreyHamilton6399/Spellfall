"use client";

import { Suspense } from "react";
import { use } from "react";
import { useSearchParams } from "next/navigation";
import MultiplayerShell from "@/components/MultiplayerShell";

function PrivateRoom({ code }: { code: string }) {
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "Player";
  const session =
    searchParams.get("session") ?? Math.random().toString(36).slice(2);

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
        <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white/40 text-lg">
          Joining room…
        </div>
      }
    >
      <PrivateRoom code={code} />
    </Suspense>
  );
}
