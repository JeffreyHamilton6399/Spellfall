import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface DbProfile {
  id: string;
  display_name: string;
  created_at: string;
  rating: number;
}

export interface DbPlayerStats {
  user_id: string;
  matches_played: number;
  wins: number;
  total_eliminations: number;
  best_word: string | null;
  best_word_score: number;
  pangrams: number;
  updated_at: string;
}
