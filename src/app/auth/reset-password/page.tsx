"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError("Passwords don't match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => router.replace("/"), 2000);
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
          <span className="font-display font-black text-5xl tracking-wide text-white">
            SPELL<span className="text-emerald-400">FALL</span>
          </span>
        </div>

        <div className="bg-arena-900 border border-rim rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <h2 className="font-display font-bold text-xl text-white">Set new password</h2>
            {done && (
              <p className="text-emerald-400 text-sm mt-2">Password updated! Redirecting…</p>
            )}
          </div>

          {!done && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password (min 8 characters)"
                required
                minLength={8}
                className="w-full bg-arena-800 border border-rim focus:border-rim-hi rounded-xl px-4 py-3 text-ink placeholder-ink-4 text-sm outline-none transition-colors"
                autoComplete="new-password"
              />
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                required
                className="w-full bg-arena-800 border border-rim focus:border-rim-hi rounded-xl px-4 py-3 text-ink placeholder-ink-4 text-sm outline-none transition-colors"
                autoComplete="new-password"
              />
              {error && (
                <p className="text-rose-400 text-sm bg-rose-950/40 border border-rose-800/40 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
                Update password
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
