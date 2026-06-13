"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?type=recovery`,
      });
      if (err) throw err;
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-arena-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <button
            onClick={() => router.push("/")}
            className="font-display font-black text-5xl tracking-wide text-white hover:opacity-80 transition-opacity"
          >
            SPELL<span className="text-emerald-400">FALL</span>
          </button>
        </div>

        <div className="bg-arena-900 border border-rim rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-white">Reset password</h2>
            <p className="text-ink-3 text-sm mt-1">
              {sent
                ? "Check your inbox for the reset link."
                : "Enter your email and we'll send you a reset link."}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full bg-arena-800 border border-rim focus:border-rim-hi rounded-xl px-4 py-3 text-ink placeholder-ink-4 text-sm outline-none transition-colors"
                autoComplete="email"
              />
              {error && (
                <p className="text-rose-400 text-sm bg-rose-950/40 border border-rose-800/40 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
                Send reset link
              </Button>
            </form>
          ) : (
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-lg px-4 py-3">
              <p className="text-emerald-300 text-sm">
                Reset link sent to <span className="font-semibold">{email}</span>
              </p>
            </div>
          )}

          <button
            onClick={() => router.push("/auth/login")}
            className="text-ink-4 hover:text-ink-3 text-xs text-center transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
