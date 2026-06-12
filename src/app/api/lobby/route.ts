import { NextResponse } from "next/server";

const PK_HOST =
  process.env.PARTYKIT_HOST ??
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ??
  "localhost:1999";

function registryUrl(): string {
  // PK_HOST may already include a protocol (https://...) — don't double it.
  if (PK_HOST.startsWith("http://") || PK_HOST.startsWith("https://")) {
    return `${PK_HOST}/parties/registry/global`;
  }
  const isLocal = PK_HOST.startsWith("localhost") || PK_HOST.startsWith("127.");
  return `${isLocal ? "http" : "https"}://${PK_HOST}/parties/registry/global`;
}

export async function POST() {
  const url = registryUrl();
  console.log(`[lobby] registry fetch → ${url}`);

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 12_000);

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
    const isTimeout = msg.toLowerCase().includes("abort") || (e as { name?: string }).name === "AbortError";
    const isLocal = url.includes("localhost");
    console.error(`[lobby] fetch failed: ${msg}`);
    return NextResponse.json(
      {
        error: "PartyKit unreachable",
        detail: isTimeout && isLocal
          ? "PartyKit server not running — start with: npm run dev"
          : isTimeout
          ? "Matchmaker timed out — please try again"
          : msg,
      },
      { status: 503 }
    );
  }
}
