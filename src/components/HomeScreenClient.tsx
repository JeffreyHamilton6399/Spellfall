"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import HomeScreen from "./HomeScreen";

function Spinner() {
  return (
    <div className="min-h-dvh bg-arena-950 flex items-center justify-center">
      <span className="font-display font-black text-3xl tracking-wide text-arena-700">
        SPELL<span className="text-emerald-900">FALL</span>
      </span>
    </div>
  );
}

export default function HomeScreenClient() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [localReady, setLocalReady] = useState(false);
  const [storedName, setStoredName] = useState<string | undefined>(undefined);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Supabase sometimes sends the OAuth code to the Site URL instead of
    // /auth/callback when the redirectTo URL doesn't match the allowlist exactly.
    // Forward it so the callback page can handle it normally.
    const code = params.get("code");
    if (code) {
      const type = params.get("type") ?? "";
      const dest = `/auth/callback?code=${encodeURIComponent(code)}${type ? `&type=${type}` : ""}`;
      router.replace(dest);
      return;
    }

    // Supabase OAuth error bounce — forward to login with message.
    if (params.get("error")) {
      const desc = params.get("error_description") ?? "Sign-in failed";
      router.replace(`/auth/login?mode=signin&oauth_error=${encodeURIComponent(desc)}`);
      return;
    }

    setStoredName(localStorage.getItem("spellfall_name") ?? undefined);
    setLocalReady(true);
  }, [router]);

  if (!localReady || authLoading) return <Spinner />;

  const initialName = profile?.display_name ?? storedName;
  return <HomeScreen initialName={initialName} />;
}
