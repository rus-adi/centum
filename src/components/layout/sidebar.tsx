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
  Handshake
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[272px] border-r border-[var(--border)] bg-white md:block">
      <div className="border-b border-[var(--border)] px-5 py-5">
        <div className="text-lg font-semibold text-gray-900">Centum Stack</div>
        <div className="text-xs uppercase tracking-[0.22em] text-gray-500">School 2.0 Platform</div>
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
        Leadership-first transition engine for existing schools.
      </div>
    </aside>
  );
}
