"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Building2,
  TrendingUp,
  LayoutDashboard,
  Users,
  Wrench,
  Layers,
  ClipboardList,
  GraduationCap,
  BookOpen,
  Megaphone,
  ShieldCheck,
  LifeBuoy,
  Settings
} from "lucide-react";

const nav = [
  { href: "/hq", label: "HQ", icon: Building2 },
  { href: "/transformation", label: "Transformation", icon: TrendingUp },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/stacks", label: "Stacks", icon: Layers },
  { href: "/requests", label: "Requests", icon: ClipboardList },
  { href: "/training", label: "Training Hub", icon: GraduationCap },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/updates", label: "Updates", icon: Megaphone },
  { href: "/quality", label: "Implementation & Quality", icon: ShieldCheck },
  { href: "/support", label: "Support", icon: LifeBuoy },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-[240px] border-r border-[var(--border)] bg-white md:block">
      <div className="flex h-16 flex-col justify-center px-5">
        <div className="text-base font-semibold text-gray-900">Centum</div>
        <div className="text-xs text-gray-500">Partner Portal</div>
      </div>
      <nav className="px-3">
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
        Centum Partner Portal
      </div>
    </aside>
  );
}
