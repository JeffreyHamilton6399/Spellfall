import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ratingBucket } from "@/lib/tiers";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// Returns the ranked room ID for a given rating + time slot.
// All players in the same rating bucket joining within the same 3-minute window
// are routed to the same PartyKit room; bots fill any remaining slots at launch.
function rankedRoomId(rating: number, slotOffset = 0): string {
  const bucket = ratingBucket(rating);
  const slotMs = 3 * 60 * 1000;
  const slot = Math.floor(Date.now() / slotMs) + slotOffset;
  return `ranked_${bucket}_${slot}`;
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = getAdmin();

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("rating, ranked_matches_played")
    .eq("id", user.id)
    .maybeSingle();

  const rating           = (data as { rating: number } | null)?.rating ?? 1000;
  const matchesPlayed    = (data as { ranked_matches_played: number } | null)?.ranked_matches_played ?? 0;

  const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
  const roomId = rankedRoomId(rating, offset);

  return NextResponse.json({ roomId, rating, matchesPlayed });
}
