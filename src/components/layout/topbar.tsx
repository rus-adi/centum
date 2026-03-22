import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { requireActiveSchool } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { ProfileMenu } from "@/components/layout/profile-menu";

export async function Topbar({
  title,
  navToggleId
}: {
  title: string;
  navToggleId: string;
}) {
  const { session, school } = await requireActiveSchool();
  const unread = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null }
  });

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <label
            htmlFor={navToggleId}
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[var(--border)] bg-white shadow-sm hover:bg-gray-50 md:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} className="text-gray-700" />
          </label>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-xs">{school.name}</div>
            <div className="mt-1 break-words text-xl font-semibold leading-tight text-gray-900 sm:text-2xl">{title}</div>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:gap-3 xl:w-auto xl:flex-nowrap">
          <Link href="/services" className="hidden min-h-10 items-center rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 lg:inline-flex">Services & Apps</Link>
          <Link href="/guide-builder" className="hidden min-h-10 items-center rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 lg:inline-flex">Guide Builder</Link>
          <Link
            href="/notifications"
            className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-white shadow-sm transition hover:bg-gray-50"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-gray-700" />
            {unread > 0 ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" /> : null}
          </Link>

          <ProfileMenu email={session.user.email} name={session.user.name} />
        </div>
      </div>
    </header>
  );
}
