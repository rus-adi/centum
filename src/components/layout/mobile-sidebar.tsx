"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { X } from "lucide-react";
import { getNavigationForRole } from "@/lib/navigation";

export function MobileSidebar({ toggleId, role }: { toggleId: string; role?: string | null }) {
  const pathname = usePathname();
  const nav = getNavigationForRole(role);

  function close() {
    const el = document.getElementById(toggleId) as HTMLInputElement | null;
    if (el) el.checked = false;
  }

  return (
    <>
      <button
        type="button"
        className="pointer-events-none fixed inset-0 z-40 bg-slate-950/40 opacity-0 backdrop-blur-sm transition peer-checked:pointer-events-auto peer-checked:opacity-100 md:hidden"
        aria-label="Close navigation"
        tabIndex={-1}
        onClick={close}
      />
      <aside className="fixed left-0 top-0 z-50 h-screen w-[288px] max-w-[86vw] -translate-x-full border-r border-[var(--border)] bg-white shadow-2xl transition peer-checked:translate-x-0 md:hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5">
          <div>
            <div className="text-base font-semibold tracking-tight text-gray-900">Centum Stack</div>
            <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">School 2.0 Platform</div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-white shadow-sm hover:bg-gray-50"
            aria-label="Close menu"
            onClick={close}
          >
            <X size={18} className="text-gray-700" />
          </button>
        </div>
        <nav className="h-[calc(100vh-136px)] overflow-y-auto px-4 py-5">
          <ul className="space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={close}
                    className={clsx(
                      "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium leading-5 transition-all",
                      active
                        ? "bg-blue-50 text-blue-700 shadow-[inset_0_0_0_1px_rgba(191,219,254,0.9)]"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="break-words">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 w-full border-t border-[var(--border)] bg-white px-5 py-4 text-xs leading-5 text-gray-500">
          Leadership-first transformation operating system.
        </div>
      </aside>
    </>
  );
}
