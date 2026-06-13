"use client";

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:     ButtonVariant;
  size?:        ButtonSize;
  fullWidth?:   boolean;
  loading?:     boolean;
  icon?:        ReactNode;
  iconAfter?:   ReactNode;
  displayFont?: boolean;
}

const BASE =
  "inline-flex items-center justify-center gap-2 select-none whitespace-nowrap rounded-xl " +
  "font-semibold transition-all duration-150 focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1 " +
  "focus-visible:ring-offset-arena-950 " +
  "disabled:pointer-events-none disabled:opacity-40 active:scale-[0.97]";

const VARIANT: Record<ButtonVariant, string> = {
  primary:
    "bg-emerald-600 hover:bg-emerald-500 active:brightness-95 " +
    "text-white font-bold shadow-sm shadow-black/20",
  secondary:
    "bg-arena-800 hover:bg-arena-700 active:bg-arena-700 " +
    "text-ink font-semibold border border-rim hover:border-rim-hi",
  ghost:
    "hover:bg-white/5 active:bg-white/8 " +
    "text-ink-3 hover:text-ink font-medium border border-transparent hover:border-rim",
  danger:
    "bg-rose-700 hover:bg-rose-600 active:brightness-95 " +
    "text-white font-bold shadow-sm shadow-black/20",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8  px-3   text-xs  gap-1.5",
  md: "h-10 px-4   text-sm",
  lg: "h-12 px-6   text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant     = "secondary",
    size        = "md",
    fullWidth   = false,
    loading     = false,
    icon,
    iconAfter,
    displayFont = false,
    children,
    className   = "",
    disabled,
    ...props
  },
  ref
) {
  const cls = [
    BASE,
    VARIANT[variant],
    SIZE[size],
    fullWidth ? "w-full" : "",
    displayFont ? "font-display font-black tracking-wide" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button ref={ref} className={cls} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
      {!loading && iconAfter && <span className="flex-shrink-0">{iconAfter}</span>}
    </button>
  );
});

export default Button;
