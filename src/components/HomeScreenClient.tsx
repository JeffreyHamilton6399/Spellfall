"use client";

import { useEffect, useState } from "react";
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
  const [localReady, setLocalReady] = useState(false);
  const [storedName, setStoredName] = useState<string | undefined>(undefined);

  useEffect(() => {
    setStoredName(localStorage.getItem("spellfall_name") ?? undefined);
    setLocalReady(true);
  }, []);

  if (!localReady || authLoading) return <Spinner />;

  // Logged-in users skip name entry; their profile display_name is used
  const initialName = profile?.display_name ?? storedName;
  return <HomeScreen initialName={initialName} />;
}
