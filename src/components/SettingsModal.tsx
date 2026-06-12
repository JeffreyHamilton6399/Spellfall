"use client";

import { X, Volume2, VolumeX, Accessibility, Eye } from "lucide-react";
import { useSettings } from "@/contexts/SettingsContext";

interface Props {
  onClose: () => void;
}

export default function SettingsModal({ onClose }: Props) {
  const { settings, update } = useSettings();

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-arena-900 border border-rim rounded-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-rim">
          <h2 className="font-display font-bold text-xl text-white tracking-wide">Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-6">
          {/* Volume */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                {settings.masterVolume === 0
                  ? <VolumeX size={16} className="text-slate-500" />
                  : <Volume2 size={16} className="text-emerald-400" />
                }
                Volume
              </label>
              <span className="text-xs font-mono text-slate-500">
                {Math.round(settings.masterVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.masterVolume}
              onChange={(e) => update({ masterVolume: parseFloat(e.target.value) })}
              className="w-full h-2 accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-600">
              <span>Off</span>
              <span>Max</span>
            </div>
          </div>

          {/* Reduced motion */}
          <Toggle
            icon={<Accessibility size={16} />}
            label="Reduced motion"
            description="Disable all animations and transitions"
            checked={settings.reducedMotion}
            onChange={(v) => update({ reducedMotion: v })}
          />

          {/* Colorblind mode */}
          <Toggle
            icon={<Eye size={16} />}
            label="Colorblind-friendly HP"
            description="Use blue/amber/red instead of green/yellow/red"
            checked={settings.colorblindMode}
            onChange={(v) => update({ colorblindMode: v })}
          />
        </div>
      </div>
    </div>
  );
}

function Toggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-start gap-3 text-left w-full group"
    >
      <span className={`mt-0.5 flex-shrink-0 ${checked ? "text-emerald-400" : "text-slate-500"}`}>
        {icon}
      </span>
      <div className="flex-1">
        <div className={`text-sm font-medium ${checked ? "text-white" : "text-slate-400"}`}>
          {label}
        </div>
        <div className="text-xs text-slate-600 mt-0.5">{description}</div>
      </div>
      <div
        className={`flex-shrink-0 w-10 h-6 rounded-full transition-colors mt-0.5 ${
          checked ? "bg-emerald-500" : "bg-white/10"
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-sm mt-0.5 transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </div>
    </button>
  );
}
