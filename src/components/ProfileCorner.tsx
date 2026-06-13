"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Button from "./ui/Button";

export default function ProfileCorner() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  if (loading) return null;

  if (!user) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs px-3 h-8"
        onClick={() => router.push("/auth/login")}
      >
        Sign in
      </Button>
    );
  }

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
        <div className="absolute top-full right-0 mt-2 z-50 w-48 bg-arena-900 border border-rim rounded-xl shadow-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-rim">
            <p className="text-white text-sm font-semibold truncate">
              {profile?.display_name ?? "Account"}
            </p>
            <p className="text-ink-4 text-xs truncate mt-0.5">{user.email}</p>
          </div>
          <div className="p-1.5">
            <button
              onClick={() => { setOpen(false); signOut(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-3 hover:text-ink hover:bg-arena-800 transition-colors text-left"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
