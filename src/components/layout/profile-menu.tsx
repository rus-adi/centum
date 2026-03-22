"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

export function ProfileMenu({
  email,
  name
}: {
  email?: string | null;
  name?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const initials = useMemo(() => {
    const src = (name || email || "U").trim();
    const parts = src.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? "U";
    const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + second).toUpperCase();
  }, [name, email]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-gradient-to-br from-slate-50 to-white text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        aria-label="Open profile menu"
      >
        {initials}
      </button>

      <div
        className={clsx(
          "absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.14)]",
          open ? "block" : "hidden"
        )}
        role="menu"
      >
        <div className="bg-[var(--soft)] px-4 py-3">
          <div className="truncate text-sm font-medium text-gray-900">{name || "My account"}</div>
          {email ? <div className="truncate text-xs text-gray-600">{email}</div> : null}
        </div>
        <div className="h-px bg-[var(--border)]" />
        <Link
          href="/profile"
          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
          role="menuitem"
          onClick={() => setOpen(false)}
        >
          <User size={16} className="text-gray-600" />
          My Profile
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            signOut({ callbackUrl: "/login" });
          }}
        >
          <LogOut size={16} className="text-gray-600" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
