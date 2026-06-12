"use client";

import { SettingsProvider } from "@/contexts/SettingsContext";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <SettingsProvider>{children}</SettingsProvider>;
}
