"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const siteUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        router.replace("/");
      } else {
        const { error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${siteUrl}/auth/callback` },
        });
        if (err) throw err;
        setSent(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg.replace("AuthApiError: ", ""));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    if (err) setError(err.message);
  };

  if (sent) {
    return (
      <div className="min-h-dvh bg-arena-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-arena-900 border border-rim rounded-2xl p-8 text-center flex flex-col gap-4">
          <div className="text-4xl">📬</div>
          <h2 className="font-display font-bold text-xl text-white">Check your email</h2>
          <p className="text-ink-3 text-sm">
            We sent a confirmation link to <span className="text-ink">{email}</span>.
            Click it to activate your account.
          </p>
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            Back to home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-arena-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        {/* Logo */}
        <div className="text-center">
          <button
            onClick={() => router.push("/")}
            className="font-display font-black text-5xl tracking-wide text-white hover:opacity-80 transition-opacity"
          >
            SPELL<span className="text-emerald-400">FALL</span>
          </button>
        </div>

        <div className="bg-arena-900 border border-rim rounded-2xl overflow-hidden">
          {/* Tab bar */}
          <div className="grid grid-cols-2 border-b border-rim">
            {(["signin", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`py-3 text-sm font-semibold transition-colors ${
                  mode === m
                    ? "text-white border-b-2 border-emerald-500 bg-arena-800/50"
                    : "text-ink-3 hover:text-ink"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>

          <div className="p-6 flex flex-col gap-4">
            {/* Google OAuth */}
            <button
              onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold text-sm py-2.5 px-4 rounded-xl transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-rim" />
              <span className="text-ink-4 text-xs">or</span>
              <div className="flex-1 h-px bg-rim" />
            </div>

            {/* Email + password form */}
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
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Password (min 8 characters)" : "Password"}
                required
                minLength={mode === "signup" ? 8 : undefined}
                className="w-full bg-arena-800 border border-rim focus:border-rim-hi rounded-xl px-4 py-3 text-ink placeholder-ink-4 text-sm outline-none transition-colors"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />

              {error && (
                <p className="text-rose-400 text-sm bg-rose-950/40 border border-rose-800/40 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" size="md" fullWidth loading={loading}>
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            {mode === "signin" && (
              <button
                onClick={() => router.push("/auth/forgot-password")}
                className="text-ink-4 hover:text-ink-3 text-xs text-center transition-colors"
              >
                Forgot password?
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-ink-4 text-xs">
          No account needed to play —{" "}
          <button onClick={() => router.push("/")} className="text-emerald-400 hover:text-emerald-300 underline transition-colors">
            play as guest
          </button>
        </p>
      </div>
    </div>
  );
}
