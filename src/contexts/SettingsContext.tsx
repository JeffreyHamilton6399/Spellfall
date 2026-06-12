"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { setVolume, setMuted } from "@/lib/audio";

export interface Settings {
  masterVolume: number;   // 0–1
  reducedMotion: boolean;
  colorblindMode: boolean;
  displayName: string;
}

const DEFAULT_SETTINGS: Settings = {
  masterVolume: 0.4,
  reducedMotion: false,
  colorblindMode: false,
  displayName: "",
};

const SETTINGS_KEY = "spellfall_settings_v1";

interface Ctx {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<Ctx>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Load from localStorage + detect system prefers-reduced-motion
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const parsed: Partial<Settings> = raw ? JSON.parse(raw) : {};
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setSettings({
        ...DEFAULT_SETTINGS,
        reducedMotion: prefersReduced,
        ...parsed,
      });
    } catch {
      // ignore
    }
  }, []);

  // Sync audio + DOM whenever settings change
  useEffect(() => {
    setVolume(settings.masterVolume);
    setMuted(settings.masterVolume === 0);
    document.documentElement.dataset.reducedMotion = settings.reducedMotion ? "true" : "false";
  }, [settings]);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): Ctx {
  return useContext(SettingsContext);
}
