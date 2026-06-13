"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "@/lib/supabase";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    async function handle() {
      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          router.replace(type === "recovery" ? "/auth/reset-password" : "/");
        } else if (tokenHash && type) {
          await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "recovery" | "email" });
          router.replace(type === "recovery" ? "/auth/reset-password" : "/");
        } else {
          router.replace("/");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Auth callback failed";
        setError(msg);
      }
    }

    handle();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <div className="min-h-dvh bg-arena-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-arena-900 border border-rim rounded-2xl p-6 text-center flex flex-col gap-4">
          <p className="text-rose-400 text-sm">{error}</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="text-emerald-400 text-sm hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-arena-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-3 border-rim" />
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-emerald-500 animate-spin-ring" />
        </div>
        <span className="text-ink-4 text-sm">Signing in…</span>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh bg-arena-950 flex items-center justify-center">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-rim" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin-ring" />
        </div>
      </div>
    }>
      <CallbackInner />
    </Suspense>
  );
}
