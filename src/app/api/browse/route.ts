import { NextResponse } from "next/server";

const PK_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "localhost:1999";

function registryUrl(): string {
  if (PK_HOST.startsWith("http://") || PK_HOST.startsWith("https://")) {
    return `${PK_HOST}/parties/registry/global`;
  }
  const isLocal = PK_HOST.startsWith("localhost") || PK_HOST.startsWith("127.");
  return `${isLocal ? "http" : "https"}://${PK_HOST}/parties/registry/global`;
}

export interface BrowseLobby {
  id: string;
  playerCount: number;
  maxPlayers: number;
  roundSeconds: number;
  abilitiesEnabled: boolean;
}

export async function GET() {
  try {
    const res = await fetch(registryUrl(), {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return NextResponse.json([], { status: 200 });

    const all = await res.json() as Array<{
      id: string;
      playerCount: number;
      maxPlayers: number;
      phase: string;
      roundSeconds: number;
      abilitiesEnabled: boolean;
    }>;

    // Only show open public lobbies with room
    const open: BrowseLobby[] = all
      .filter((l) => l.id.startsWith("pub_") && l.phase === "lobby" && l.playerCount < l.maxPlayers)
      .map((l) => ({
        id: l.id,
        playerCount: l.playerCount,
        maxPlayers: l.maxPlayers,
        roundSeconds: l.roundSeconds,
        abilitiesEnabled: l.abilitiesEnabled,
      }))
      .slice(0, 20);

    return NextResponse.json(open);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
