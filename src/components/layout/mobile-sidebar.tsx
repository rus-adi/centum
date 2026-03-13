"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Building2,
  TrendingUp,
  LayoutDashboard,
  ShieldCheck,
  Boxes,
  Wrench,
  Layers,
  GraduationCap,
  Megaphone,
  ClipboardList,
  BookOpen,
  LifeBuoy,
  Settings,
  LineChart,
  Handshake,
  X
} from "lucide-react";

const nav = [
  { href: "/hq", label: "HQ Command Center", icon: Building2 },
  { href: "/transformation", label: "Transformation Copilot", icon: TrendingUp },
  { href: "/transformation/report", label: "Executive Report", icon: LineChart },
  { href: "/dashboard", label: "Readiness & ROI", icon: LayoutDashboard },
  { href: "/governance", label: "Governance & Support", icon: ShieldCheck },
  { href: "/packs", label: "Transformation Packs", icon: Boxes },
  { href: "/tools", label: "Tool Recommendations", icon: Wrench },
  { href: "/stacks", label: "Bundles", icon: Layers },
  { href: "/training", label: "Training Hub", icon: GraduationCap },
  { href: "/growth", label: "Growth Assets", icon: Megaphone },
  { href: "/partners", label: "Partner Ops", icon: Handshake },
  { href: "/requests", label: "Requests", icon: ClipboardList },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function MobileSidebar({ toggleId }: { toggleId: string }) {
  const pathname = usePathname();

  function close() {
    const el = document.getElementById(toggleId) as HTMLInputElement | null;
    if (el) el.checked = false;
  }

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 pointer-events-none bg-black/30 opacity-0 transition peer-checked:pointer-events-auto peer-checked:opacity-100 md:hidden"
        aria-label="Close navigation"
        tabIndex={-1}
        onClick={close}
      />
      <aside className="fixed left-0 top-0 z-50 h-screen w-[272px] -translate-x-full border-r border-[var(--border)] bg-white transition peer-checked:translate-x-0 md:hidden">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-5">
          <div>
            <div className="text-base font-semibold text-gray-900">Centum Stack</div>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-500">School 2.0 Platform</div>
          </div>
          <button
            type="button"
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[var(--border)] bg-white hover:bg-gray-50"
            aria-label="Close menu"
            onClick={close}
          >
            <X size={18} className="text-gray-700" />
          </button>
        </div>
        <nav className="h-[calc(100vh-120px)] overflow-y-auto px-3 py-4">
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
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="absolute bottom-0 left-0 w-full border-t border-[var(--border)] p-4 text-xs text-gray-500">
          Leadership-first transformation operating system.
        </div>
      </aside>
    </>
  );
}
