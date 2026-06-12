"use client";

import { useEffect, useState } from "react";
import HomeScreen from "./HomeScreen";

export default function HomeScreenClient() {
  const [ready, setReady] = useState(false);
  const [storedName, setStoredName] = useState<string | undefined>(undefined);

  useEffect(() => {
    setStoredName(localStorage.getItem("spellfall_name") ?? undefined);
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-dvh bg-arena-950 flex items-center justify-center">
        <span className="font-display font-black text-3xl tracking-wide text-arena-700">
          SPELL<span className="text-emerald-900">FALL</span>
        </span>
      </div>
    );
  }

  return <HomeScreen initialName={storedName} />;
}
