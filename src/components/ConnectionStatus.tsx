"use client";

import { Wifi, WifiOff } from "lucide-react";
import type { ConnectionStatus } from "@/hooks/usePartyEngine";

export default function ConnectionStatus({ status }: { status: ConnectionStatus }) {
  if (status === "connected") return null;

  return (
    <div className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-arena-900/95 border border-rim rounded-full px-3 py-1.5 text-xs text-slate-300 backdrop-blur">
      {status === "reconnecting" ? (
        <>
          <Wifi size={12} className="text-amber-400 animate-pulse" />
          <span className="text-amber-300">Reconnecting…</span>
        </>
      ) : (
        <>
          <WifiOff size={12} className="text-slate-500" />
          <span className="text-slate-500">Connecting…</span>
        </>
      )}
    </div>
  );
}
