import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export async function GET(req: NextRequest) {
  const url    = new URL(req.url);
  const page   = Math.max(0, Number(url.searchParams.get("page") ?? "0"));
  const limit  = 50;
  const offset = page * limit;

  const { data, error } = await supabaseAdmin
    .from("leaderboard")
    .select("id, display_name, rating, ranked_matches_played, ranked_wins, rank_position")
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Optionally look up the requester's position
  const authHeader = req.headers.get("Authorization");
  let myRank: number | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
    if (user) {
      const { data: myRow } = await supabaseAdmin
        .from("leaderboard")
        .select("rank_position")
        .eq("id", user.id)
        .maybeSingle();
      myRank = (myRow as { rank_position: number } | null)?.rank_position ?? null;
    }
  }

  return NextResponse.json({ entries: data ?? [], myRank, page });
}
