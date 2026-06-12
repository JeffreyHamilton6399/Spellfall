import { NextResponse } from "next/server";

// Server-side only — no CORS issues
const PK_HOST = process.env.PARTYKIT_HOST ?? "localhost:1999";

export async function POST() {
  try {
    const res = await fetch(`http://${PK_HOST}/parties/registry/global`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json() as { partyId: string };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: "PartyKit registry unreachable", detail: String(e) },
      { status: 503 }
    );
  }
}
