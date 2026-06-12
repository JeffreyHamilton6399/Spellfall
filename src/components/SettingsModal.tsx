"use client";

import { useEffect, useRef, useState } from "react";
import { X, Volume2, VolumeX, Accessibility, EyeOff, User, Check, Palette, Gamepad2, Swords, MessageSquare } from "lucide-react";
import { useSettings, type Theme } from "@/contexts/SettingsContext";
import Button from "./ui/Button";

interface Props {
  onClose: () => void;
}

const THEMES: { id: Theme; label: string; preview: string }[] = [
  { id: "dark",     label: "Dark Arena",      preview: "#070b12" },
  { id: "light",    label: "Light",           preview: "#f0f4f8" },
  { id: "contrast", label: "High Contrast",   preview: "#000000" },
  { id: "midnight", label: "Midnight",        preview: "#0b0718" },
];

const THEME_ACCENT: Record<Theme, string> = {
  dark:     "#10b981",
  light:    "#059669",
  contrast: "#ffffff",
  midnight: "#a78bfa",
};

export default function SettingsModal({ onClose }: Props) {
  const { settings, update } = useSettings();

  const [draftName, setDraftName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem("spellfall_name") ?? settings.displayName ?? "";
    setDraftName(stored);
  }, [settings.displayName]);

  const saveName = () => {
    const n = draftName.replace(/[^a-zA-Z0-9_\s\-]/g, "").trim().slice(0, 20);
    if (!n) return;
    setDraftName(n);
    localStorage.setItem("spellfall_name", n);
    update({ displayName: n });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 1500);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm bg-arena-900 border border-rim rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rim">
          <h2 className="font-display font-bold text-xl text-ink tracking-wide">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 flex items-center justify-center rounded-xl text-ink-3 hover:text-ink hover:bg-arena-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-5 overflow-y-auto max-h-[80vh]">

          {/* ── Profile ─── */}
          <section className="flex flex-col gap-2">
            <SectionLabel icon={<User size={11} />}>Profile</SectionLabel>
            <div className="flex gap-2">
              <input
                ref={nameRef}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value.replace(/[^a-zA-Z0-9_\s\-]/g, ""))}
                onKeyDown={(e) => { if (e.key === "Enter") { saveName(); nameRef.current?.blur(); } }}
                onBlur={saveName}
                maxLength={20}
                placeholder="Display name…"
                className="flex-1 bg-arena-800 border border-rim focus:border-rim-hi rounded-xl px-3.5 py-2.5 text-ink placeholder-ink-4 text-sm font-semibold outline-none transition-colors"
                autoComplete="off"
                spellCheck={false}
              />
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all border ${
                nameSaved
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-arena-800 border-rim text-ink-4"
              }`}>
                <Check size={15} />
              </div>
            </div>
          </section>

          <Divider />

          {/* ── Theme ─── */}
          <section className="flex flex-col gap-3">
            <SectionLabel icon={<Palette size={11} />}>Theme</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map(({ id, label, preview }) => {
                const selected = settings.theme === id;
                return (
                  <button
                    key={id}
                    onClick={() => update({ theme: id })}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      selected
                        ? "border-emerald-500 bg-emerald-900/20 ring-1 ring-emerald-500/30"
                        : "border-rim bg-arena-800 hover:border-rim-hi"
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex-shrink-0 border border-white/20 relative overflow-hidden"
                      style={{ background: preview }}
                    >
                      <span
                        className="absolute inset-0 rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${THEME_ACCENT[id]} 0%, transparent 60%)`,
                          opacity: 0.6,
                        }}
                      />
                    </span>
                    <span className={`text-xs font-semibold ${selected ? "text-emerald-300" : "text-ink-2"}`}>
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <Divider />

          {/* ── Audio ─── */}
          <section className="flex flex-col gap-3">
            <SectionLabel icon={settings.masterVolume === 0 ? <VolumeX size={11} /> : <Volume2 size={11} />}>
              Audio
            </SectionLabel>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-2">
                  {settings.masterVolume === 0 ? "Muted" : "Volume"}
                </span>
                <span className="text-xs font-mono text-ink-4 tabular-nums">
                  {Math.round(settings.masterVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0} max={1} step={0.05}
                value={settings.masterVolume}
                onChange={(e) => update({ masterVolume: parseFloat(e.target.value) })}
                className="w-full h-2 accent-emerald-500 cursor-pointer"
              />
            </div>
          </section>

          <Divider />

          {/* ── Accessibility ─── */}
          <section className="flex flex-col gap-3">
            <SectionLabel icon={<Accessibility size={11} />}>Accessibility</SectionLabel>
            <Toggle
              icon={<Accessibility size={15} />}
              label="Reduce motion"
              description="Disables animations and transitions"
              checked={settings.reducedMotion}
              onChange={(v) => update({ reducedMotion: v })}
            />
            <Toggle
              icon={<EyeOff size={15} />}
              label="Colorblind HP bars"
              description="Blue / amber / red instead of green / yellow / red"
              checked={settings.colorblindMode}
              onChange={(v) => update({ colorblindMode: v })}
            />
          </section>

          <Divider />

          {/* ── Gameplay ─── */}
          <section className="flex flex-col gap-3">
            <SectionLabel icon={<Gamepad2 size={11} />}>Gameplay</SectionLabel>
            <Toggle
              icon={<MessageSquare size={15} />}
              label="Kill feed"
              description="Show elimination events during the game"
              checked={settings.showKillFeed}
              onChange={(v) => update({ showKillFeed: v })}
            />
            <Toggle
              icon={<Swords size={15} />}
              label="Damage numbers"
              description="Show floating damage indicators"
              checked={settings.showDamageNumbers}
              onChange={(v) => update({ showDamageNumbers: v })}
            />
          </section>

          <Divider />

          {/* ── Footer ─── */}
          <div className="flex flex-col items-center gap-2 pt-1 pb-1">
            <div className="flex gap-4 text-xs text-ink-4">
              <a href="/terms"   target="_blank" className="hover:text-ink-3 transition-colors">Terms of Service</a>
              <a href="/privacy" target="_blank" className="hover:text-ink-3 transition-colors">Privacy Policy</a>
            </div>
            <p className="text-[11px] text-ink-4/60 text-center">
              Made by Jeffrey Hamilton &middot; v1.0.0
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

function SectionLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-ink-4 font-semibold">
      {icon}
      {children}
    </label>
  );
}

function Divider() {
  return <div className="border-t border-rim/60" />;
}

function Toggle({
  icon, label, description, checked, onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 text-left w-full py-0.5 group"
    >
      <span className={`flex-shrink-0 mt-0.5 transition-colors ${checked ? "text-emerald-400" : "text-ink-4"}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium transition-colors ${checked ? "text-ink" : "text-ink-2"}`}>
          {label}
        </div>
        <div className="text-xs text-ink-4 mt-0.5 truncate">{description}</div>
      </div>
      <div className={`flex-shrink-0 relative w-10 h-[22px] rounded-full transition-colors ${
        checked ? "bg-emerald-500" : "bg-white/10"
      }`}>
        <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-[3px]"
        }`} />
      </div>
    </button>
  );
}
