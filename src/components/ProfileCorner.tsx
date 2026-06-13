"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, User, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function ProfileCorner() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (loading) return null;

  /* ── Guest ─────────────────────────────────────────────────────────── */
  if (!user) {
    return (
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-8 h-8 rounded-full bg-arena-800 border border-rim hover:border-rim-hi flex items-center justify-center text-ink-4 hover:text-ink-3 transition-colors"
          aria-label="Account"
        >
          <User size={15} />
        </button>

        {open && (
          <div className="absolute top-full right-0 mt-2 z-50 w-44 bg-arena-900 border border-rim rounded-xl shadow-xl overflow-hidden">
            <div className="p-1.5 flex flex-col gap-0.5">
              <MenuItem
                icon={<LogIn size={14} />}
                label="Log in"
                onClick={() => { setOpen(false); router.push("/auth/login?mode=signin"); }}
              />
              <MenuItem
                icon={<UserPlus size={14} />}
                label="Create account"
                onClick={() => { setOpen(false); router.push("/auth/login?mode=signup"); }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Logged in ──────────────────────────────────────────────────────── */
  const initials = (profile?.display_name ?? user.email ?? "?")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white text-xs font-bold font-display tracking-wide transition-colors"
        aria-label="Account menu"
      >
        {initials || <User size={14} />}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 z-50 w-52 bg-arena-900 border border-rim rounded-xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-rim">
            <p className="text-white text-sm font-semibold truncate">
              {profile?.display_name ?? "Account"}
            </p>
            <p className="text-ink-4 text-xs truncate mt-0.5">{user.email}</p>
          </div>
          <div className="p-1.5 flex flex-col gap-0.5">
            <MenuItem
              icon={<Settings size={14} />}
              label="Settings"
              onClick={() => { setOpen(false); router.push("/settings"); }}
            />
            <MenuItem
              icon={<LogOut size={14} />}
              label="Sign out"
              onClick={() => { setOpen(false); signOut(); }}
              danger
            />
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
        danger
          ? "text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
          : "text-ink-3 hover:text-ink hover:bg-arena-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
