import { NextResponse } from "next/server";

// PARTYKIT_HOST takes priority (server-only, safe for secrets).
// NEXT_PUBLIC_PARTYKIT_HOST is the fallback so Vercel deployments work with
// only one env var set. Defaults to localhost:1999 for local dev.
const PK_HOST =
  process.env.PARTYKIT_HOST ??
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ??
  "localhost:1999";

export async function POST() {
  const url = `http://${PK_HOST}/parties/registry/global`;
  console.log(`[lobby] registry fetch → ${url}`);

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 8_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(tid);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`[lobby] registry ${res.status}: ${text.slice(0, 300)}`);
      return NextResponse.json(
        { error: "Registry error", detail: `HTTP ${res.status}` },
        { status: 503 }
      );
    }

    const data = (await res.json()) as { partyId: string };
    console.log(`[lobby] assigned partyId=${data.partyId}`);
    return NextResponse.json(data);
  } catch (e) {
    clearTimeout(tid);
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`[lobby] fetch failed: ${msg}`);
    return NextResponse.json(
      { error: "PartyKit unreachable", detail: msg },
      { status: 503 }
    );
  }
}
