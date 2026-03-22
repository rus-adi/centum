"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { getNavigationForRole } from "@/lib/navigation";

export function Sidebar({ role }: { role?: string | null }) {
  const pathname = usePathname();
  const nav = getNavigationForRole(role);

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[288px] border-r border-[var(--border)] bg-white/95 backdrop-blur md:block">
      <div className="border-b border-[var(--border)] px-6 py-6">
        <div className="text-lg font-semibold tracking-tight text-gray-900">Centum Stack</div>
        <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-gray-500">School 2.0 Platform</div>
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
      <div className="absolute bottom-0 left-0 w-full border-t border-[var(--border)] bg-white px-6 py-4 text-xs leading-5 text-gray-500">
        Leadership-first transition engine for existing schools.
      </div>
    </aside>
  );
}
