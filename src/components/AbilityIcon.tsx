"use client";

import {
  Crosshair,
  Skull,
  Shield,
  Droplets,
  Shuffle,
  EyeOff,
  Zap,
  TrendingDown,
  Snowflake,
  Wind,
  ArrowLeftRight,
  type LucideProps,
} from "lucide-react";
import type { FC } from "react";

const ICON_MAP: Record<string, FC<LucideProps>> = {
  Crosshair,
  Skull,
  Shield,
  Droplets,
  Shuffle,
  EyeOff,
  Zap,
  TrendingDown,
  Snowflake,
  Wind,
  ArrowLeftRight,
};

interface Props extends LucideProps {
  name: string;
}

export default function AbilityIcon({ name, ...props }: Props) {
  const Icon = ICON_MAP[name] ?? Zap;
  return <Icon {...props} />;
}
