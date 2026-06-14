"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Volume2,
  VolumeX,
  Monitor,
  Gamepad2,
  Cloud,
  LogOut,
  Trophy,
} from "lucide-react";
import RankedBadge from "@/components/RankedBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useSettings } from "@/contexts/SettingsContext";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

type Section = "profile" | "audio" | "display" | "gameplay";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, session, signOut, updateDisplayName } = useAuth();
  const { settings, update } = useSettings();
  const [activeSection, setActiveSection] = useState<Section>("profile");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.display_name ?? "");
  const [nameSaving, setNameSaving] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const saveName = async () => {
    if (!nameInput.trim()) return;
    setNameSaving(true);
    setNameError(null);
    try {
      await updateDisplayName(nameInput);
      setEditingName(false);
    } catch (e) {
      setNameError(e instanceof Error ? e.message : "Failed to save — try again");
    } finally {
      setNameSaving(false);
    }
  };

  const SECTIONS: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User size={16} /> },
    { id: "audio",   label: "Audio",   icon: <Volume2 size={16} /> },
    { id: "display", label: "Display", icon: <Monitor size={16} /> },
    { id: "gameplay",label: "Gameplay",icon: <Gamepad2 size={16} /> },
  ];

  return (
    <div className="min-h-dvh bg-arena-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-rim px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-ink-3 hover:text-ink hover:bg-arena-800 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-display font-bold text-xl text-white flex-1">Settings</h1>
      </div>

      <div className="flex flex-1 max-w-2xl mx-auto w-full px-4 py-6 gap-6">
        {/* Sidebar nav — hidden on mobile, shown on sm+ */}
        <nav className="hidden sm:flex flex-col gap-1 w-36 flex-shrink-0">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                activeSection === s.id
                  ? "bg-arena-800 text-white"
                  : "text-ink-3 hover:text-ink hover:bg-arena-900"
              }`}
            >
              <span className={activeSection === s.id ? "text-emerald-400" : "text-ink-4"}>
                {s.icon}
              </span>
              {s.label}
            </button>
          ))}
        </nav>

        {/* Mobile tab bar */}
        <div className="sm:hidden w-full">
          <div className="flex border border-rim rounded-xl overflow-hidden mb-6">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  activeSection === s.id
                    ? "bg-arena-800 text-white"
                    : "text-ink-4 hover:text-ink-3"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col gap-4 min-w-0">
          {/* ── Profile ───────────────────────────────────────────── */}
          {activeSection === "profile" && (
            <>
              <Section title="Account">
                {user ? (
                  <div className="flex flex-col gap-4">
                    {/* Avatar + email */}
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white font-display font-bold text-xl flex-shrink-0">
                        {(profile?.display_name ?? user.email ?? "?")
                          .replace(/[^a-zA-Z0-9]/g, "")
                          .slice(0, 2)
                          .toUpperCase() || <User size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-semibold truncate">
                          {profile?.display_name ?? "Player"}
                        </p>
                        <p className="text-ink-4 text-xs truncate">{user.email}</p>
                        <div className="flex items-center gap-1 mt-1 text-emerald-500 text-[10px]">
                          <Cloud size={10} />
                          <span>Stats synced to account</span>
                        </div>
                      </div>
                    </div>

                    {/* Display name edit */}
                    <div>
                      <label className="text-xs text-ink-4 uppercase tracking-widest block mb-1.5">
                        Display Name
                      </label>
                      {editingName ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input
                              value={nameInput}
                              onChange={(e) => {
                                setNameInput(
                                  e.target.value.replace(/[^a-zA-Z0-9_\s\-]/g, "").slice(0, 20)
                                );
                                setNameError(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveName();
                                if (e.key === "Escape") { setEditingName(false); setNameError(null); }
                              }}
                              autoFocus
                              className={`flex-1 bg-arena-800 border rounded-xl px-3 py-2 text-ink text-sm outline-none transition-colors ${
                                nameError ? "border-rose-500" : "border-rim focus:border-rim-hi"
                              }`}
                            />
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={saveName}
                              loading={nameSaving}
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { setEditingName(false); setNameError(null); }}
                            >
                              Cancel
                            </Button>
                          </div>
                          {nameError && (
                            <p className="text-rose-400 text-xs">{nameError}</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-ink text-sm font-medium flex-1">
                            {profile?.display_name ?? "—"}
                          </span>
                          <button
                            onClick={() => {
                              setNameInput(profile?.display_name ?? "");
                              setEditingName(true);
                            }}
                            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Sign out */}
                    <div className="pt-2 border-t border-rim">
                      <button
                        onClick={() => { signOut(); router.push("/"); }}
                        className="flex items-center gap-2 text-rose-400 hover:text-rose-300 text-sm transition-colors"
                      >
                        <LogOut size={14} />
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-ink-3 text-sm">
                      Sign in to save your stats to the cloud and track progress across devices.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push("/auth/login?mode=signin")}
                      >
                        Log in
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/auth/login?mode=signup")}
                      >
                        Create account
                      </Button>
                    </div>
                  </div>
                )}
              </Section>

              <Section title="Stats">
                <StatsDisplay userId={user?.id} />
              </Section>

              {user && (
                <Section title="Ranked">
                  <RankedSection userId={user.id} />
                </Section>
              )}
            </>
          )}

          {/* ── Audio ─────────────────────────────────────────────── */}
          {activeSection === "audio" && (
            <Section title="Audio">
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-ink-3 flex items-center gap-2">
                      {settings.masterVolume === 0
                        ? <VolumeX size={14} className="text-ink-4" />
                        : <Volume2 size={14} className="text-ink-4" />}
                      Master Volume
                    </label>
                    <span className="text-xs font-mono text-emerald-400 tabular-nums w-8 text-right">
                      {Math.round(settings.masterVolume * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0} max={1} step={0.05}
                    value={settings.masterVolume}
                    onChange={(e) => update({ masterVolume: Number(e.target.value) })}
                    className="w-full h-1.5 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <ToggleRow
                  label="Mute all"
                  description="Silence all sounds"
                  checked={settings.masterVolume === 0}
                  onChange={(v) => update({ masterVolume: v ? 0 : 0.4 })}
                />
              </div>
            </Section>
          )}

          {/* ── Display ───────────────────────────────────────────── */}
          {activeSection === "display" && (
            <Section title="Display">
              <div className="flex flex-col gap-4">
                <ToggleRow
                  label="Reduced motion"
                  description="Minimize animations and transitions"
                  checked={settings.reducedMotion}
                  onChange={(v) => update({ reducedMotion: v })}
                />
                <ToggleRow
                  label="Colorblind mode"
                  description="Use high-contrast color patterns"
                  checked={settings.colorblindMode}
                  onChange={(v) => update({ colorblindMode: v })}
                />
              </div>
            </Section>
          )}

          {/* ── Gameplay ──────────────────────────────────────────── */}
          {activeSection === "gameplay" && (
            <Section title="Gameplay">
              <div className="flex flex-col gap-4">
                <ToggleRow
                  label="Kill feed"
                  description="Show elimination notifications"
                  checked={settings.showKillFeed}
                  onChange={(v) => update({ showKillFeed: v })}
                />
                <ToggleRow
                  label="Damage numbers"
                  description="Show floating damage values"
                  checked={settings.showDamageNumbers}
                  onChange={(v) => update({ showDamageNumbers: v })}
                />
              </div>
            </Section>
          )}

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-rim/50 flex items-center justify-between text-ink-4 text-xs">
            <span>Made by Jeffrey Hamilton · v1.0.0</span>
            <div className="flex gap-4">
              <a href="/terms" className="hover:text-ink-3 transition-colors">Terms</a>
              <a href="/privacy" className="hover:text-ink-3 transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-arena-900 border border-rim rounded-2xl p-5 flex flex-col gap-4">
      <h2 className="text-xs text-ink-4 uppercase tracking-widest font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left w-full group"
    >
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${checked ? "text-white" : "text-ink-3"}`}>{label}</div>
        <div className="text-xs text-ink-4 mt-0.5">{description}</div>
      </div>
      <div
        className={`flex-shrink-0 relative w-9 h-5 rounded-full transition-colors ${
          checked ? "bg-emerald-500" : "bg-white/10"
        }`}
      >
        <div
          className={`absolute top-[3px] w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-[3px]"
          }`}
        />
      </div>
    </button>
  );
}

function RankedSection({ userId }: { userId: string }) {
  const [data, setData] = useState<{
    rating: number;
    ranked_matches_played: number;
    ranked_wins: number;
  } | null>(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("rating, ranked_matches_played, ranked_wins")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data: d }) => {
        if (d) setData(d as { rating: number; ranked_matches_played: number; ranked_wins: number });
      });
  }, [userId]);

  if (!data) return <p className="text-ink-4 text-sm">Loading…</p>;

  const { rating, ranked_matches_played, ranked_wins } = data;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Trophy size={16} className="text-amber-400 flex-shrink-0" />
        <RankedBadge rating={rating} rankedMatchesPlayed={ranked_matches_played} size="md" />
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
        <div>
          <dt className="text-xs text-ink-4">Rating</dt>
          <dd className="text-white font-semibold tabular-nums">{rating}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-4">Ranked games</dt>
          <dd className="text-white font-semibold tabular-nums">{ranked_matches_played}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-4">Ranked wins</dt>
          <dd className="text-white font-semibold tabular-nums">{ranked_wins}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-4">Win rate</dt>
          <dd className="text-white font-semibold tabular-nums">
            {ranked_matches_played > 0 ? `${Math.round((ranked_wins / ranked_matches_played) * 100)}%` : "—"}
          </dd>
        </div>
      </dl>
      <a
        href="/leaderboard"
        className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
      >
        View leaderboard
      </a>
    </div>
  );
}

function StatsDisplay({ userId }: { userId?: string }) {
  const [stats, setStats] = useState<{
    gamesPlayed: number;
    wins: number;
    wordsSpelled: number;
    damageDealt: number;
  } | null>(null);

  useEffect(() => {
    if (userId) {
      supabase
        .from("player_stats")
        .select("games_played,wins,words_spelled,damage_dealt")
        .eq("user_id", userId)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const d = data as Record<string, number>;
            setStats({
              gamesPlayed: d.games_played ?? 0,
              wins: d.wins ?? 0,
              wordsSpelled: d.words_spelled ?? 0,
              damageDealt: d.damage_dealt ?? 0,
            });
          }
        });
    } else {
      const raw = localStorage.getItem("spellfall_stats_v1");
      if (raw) {
        try { setStats(JSON.parse(raw)); } catch {}
      }
    }
  }, [userId]);

  if (!stats) {
    return <p className="text-ink-4 text-sm">No stats recorded yet.</p>;
  }

  const rows: { label: string; value: string | number }[] = [
    { label: "Games played", value: stats.gamesPlayed },
    { label: "Wins", value: stats.wins },
    { label: "Win rate", value: stats.gamesPlayed > 0 ? `${Math.round((stats.wins / stats.gamesPlayed) * 100)}%` : "—" },
    { label: "Words spelled", value: stats.wordsSpelled.toLocaleString() },
    { label: "Damage dealt", value: stats.damageDealt.toLocaleString() },
  ];

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <dt className="text-xs text-ink-4">{r.label}</dt>
          <dd className="text-white font-semibold tabular-nums">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
