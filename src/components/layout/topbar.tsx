import Link from "next/link";
import { Bell, Menu } from "lucide-react";
import { requireActiveSchool } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { ProfileMenu } from "@/components/layout/profile-menu";

export async function Topbar({
  title,
  description,
  navToggleId
}: {
  title: string;
  description?: string;
  navToggleId: string;
}) {
  const { session, school } = await requireActiveSchool();
  const unread = await prisma.notification.count({
    where: { userId: session.user.id, readAt: null }
  });

  return (
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <label
            htmlFor={navToggleId}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[var(--border)] bg-white hover:bg-gray-50 md:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} className="text-gray-700" />
          </label>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-gray-500">{school.name}</div>
            <div className="text-lg font-semibold text-gray-900">{title}</div>
            {description ? <div className="text-sm text-gray-500">{description}</div> : null}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-white hover:bg-gray-50"
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
