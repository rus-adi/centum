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
  Users,
  type LucideIcon
} from "lucide-react";

import type { AppRole } from "@/lib/permissions";
import { canManagePartnerOps, canSeeExecutiveReport, canSeeGrowth, canSeeHQ, canSeeTransformation } from "@/lib/permissions";

export type NavigationItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const baseNav: NavigationItem[] = [
  { href: "/dashboard", label: "Readiness & ROI", icon: LayoutDashboard },
  { href: "/governance", label: "Governance & Support", icon: ShieldCheck },
  { href: "/packs", label: "Transformation Packs", icon: Boxes },
  { href: "/tools", label: "Tool Recommendations", icon: Wrench },
  { href: "/stacks", label: "Bundles", icon: Layers },
  { href: "/training", label: "Training Hub", icon: GraduationCap },
  { href: "/guide-builder", label: "Guide Builder", icon: GraduationCap },
  { href: "/services", label: "Services & Apps", icon: Boxes },
  { href: "/requests", label: "Requests", icon: ClipboardList },
  { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
  { href: "/support", label: "Support", icon: LifeBuoy }
];

const hqNav: NavigationItem[] = [
  { href: "/hq", label: "HQ Command Center", icon: Building2 },
  { href: "/transformation", label: "Transformation Copilot", icon: TrendingUp },
  { href: "/transformation/report", label: "Executive Report", icon: LineChart },
  { href: "/growth", label: "Growth Assets", icon: Megaphone },
  { href: "/partners", label: "Partner Ops", icon: Handshake },
  { href: "/settings", label: "Settings", icon: Settings }
];




export function getNavigationForRole(role?: string | null): NavigationItem[] {
  const typed = (role ?? "STAFF") as AppRole;

  if (canSeeHQ(typed)) {
    if (typed === "SUPER_ADMIN") return [...hqNav, ...baseNav];
    return [
      { href: "/transformation", label: "Transformation Copilot", icon: TrendingUp },
      { href: "/transformation/report", label: "Executive Report", icon: LineChart },
      { href: "/dashboard", label: "Readiness & ROI", icon: LayoutDashboard },
      { href: "/governance", label: "Governance & Support", icon: ShieldCheck },
      { href: "/packs", label: "Transformation Packs", icon: Boxes },
      { href: "/tools", label: "Tool Recommendations", icon: Wrench },
      { href: "/stacks", label: "Bundles", icon: Layers },
      { href: "/training", label: "Training Hub", icon: GraduationCap },
  { href: "/guide-builder", label: "Guide Builder", icon: GraduationCap },
  { href: "/services", label: "Services & Apps", icon: Boxes },
      { href: "/student-preview", label: "Student Preview", icon: Users },
      ...(canSeeGrowth(typed) ? [{ href: "/growth", label: "Growth Assets", icon: Megaphone }] : []),
      { href: "/requests", label: "Requests", icon: ClipboardList },
      { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
      { href: "/support", label: "Support", icon: LifeBuoy },
      { href: "/settings", label: "Settings", icon: Settings }
    ];
  }

  if (typed === "IT") {
    return [
      { href: "/dashboard", label: "Implementation Ops", icon: LayoutDashboard },
      ...(canSeeTransformation(typed) ? [{ href: "/transformation", label: "Transformation Copilot", icon: TrendingUp }] : []),
      ...(canSeeExecutiveReport(typed) ? [{ href: "/transformation/report", label: "Executive Report", icon: LineChart }] : []),
      { href: "/governance", label: "Governance & Support", icon: ShieldCheck },
      { href: "/packs", label: "Transformation Packs", icon: Boxes },
      { href: "/tools", label: "Tool Recommendations", icon: Wrench },
      { href: "/stacks", label: "Bundles", icon: Layers },
      { href: "/training", label: "Training Hub", icon: GraduationCap },
  { href: "/guide-builder", label: "Guide Builder", icon: GraduationCap },
  { href: "/services", label: "Services & Apps", icon: Boxes },
      { href: "/student-preview", label: "Student Preview", icon: Users },
      ...(canManagePartnerOps(typed) ? [{ href: "/partners", label: "Partner Ops", icon: Handshake }] : []),
      { href: "/requests", label: "Requests", icon: ClipboardList },
      { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
      { href: "/support", label: "Support", icon: LifeBuoy }
    ];
  }

  if (typed === "TEACHER" || typed === "COACH" || typed === "STAFF") {
    return [
      { href: "/dashboard", label: "Classroom Launchpad", icon: LayoutDashboard },
      { href: "/guide-builder", label: "Guide Builder", icon: GraduationCap },
      { href: "/services", label: "Services & Apps", icon: Boxes },
      { href: "/governance", label: "Governance & Support", icon: ShieldCheck },
      { href: "/packs", label: "Transformation Packs", icon: Boxes },
      { href: "/tools", label: "Classroom Tools", icon: Wrench },
      { href: "/training", label: "Training & Lesson Plans", icon: GraduationCap },
      { href: "/student-preview", label: "Student Preview", icon: Users },
      ...(canSeeGrowth(typed) ? [{ href: "/growth", label: "Growth Assets", icon: Megaphone }] : []),
      { href: "/requests", label: "Requests", icon: ClipboardList },
      { href: "/knowledge", label: "Knowledge Base", icon: BookOpen },
      { href: "/support", label: "Support", icon: LifeBuoy }
    ];
  }

  return baseNav;
}
