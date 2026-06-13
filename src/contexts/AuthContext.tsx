"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { migrateLocalStatsToSupabase } from "@/lib/stats";

export interface Profile {
  display_name: string;
  rating: number;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const migratedRef = useRef(new Set<string>());

  async function loadProfile(userId: string): Promise<void> {
    const { data } = await supabase
      .from("profiles")
      .select("display_name, rating")
      .eq("id", userId)
      .single();
    if (data) setProfile(data as Profile);
  }

  async function handleSession(newSession: Session | null): Promise<void> {
    setSession(newSession);
    if (!newSession) {
      setProfile(null);
      return;
    }
    await loadProfile(newSession.user.id);
    if (!migratedRef.current.has(newSession.user.id)) {
      migratedRef.current.add(newSession.user.id);
      migrateLocalStatsToSupabase(newSession.user.id).catch(() => {});
    }
  }

  useEffect(() => {
    const fallback = setTimeout(() => setLoading(false), 3000);

    supabase.auth.getSession()
      .then(({ data }) => handleSession(data.session))
      .catch(() => {})
      .finally(() => { clearTimeout(fallback); setLoading(false); });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        handleSession(newSession).finally(() => setLoading(false));
      }
    );
    return () => { clearTimeout(fallback); subscription.unsubscribe(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user.id) await loadProfile(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{ user: session?.user ?? null, session, profile, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthCtx {
  return useContext(AuthContext);
}
