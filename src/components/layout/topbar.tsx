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
    <header className="sticky top-0 z-10 border-b border-[var(--border)] bg-white">
      <div className="relative mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        {/* Left */}
        <div className="flex items-center gap-2">
          <label
            htmlFor={navToggleId}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-[var(--border)] bg-white hover:bg-gray-50 md:hidden"
            aria-label="Open navigation"
          >
            <Menu size={18} className="text-gray-700" />
          </label>

          <div className="hidden w-48 truncate text-sm text-gray-500 md:block">{school.name}</div>
        </div>

        {/* Center title */}
        <div className="absolute left-1/2 max-w-[60%] -translate-x-1/2 truncate text-center text-lg font-semibold text-gray-900">
          {title}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border)] bg-white hover:bg-gray-50"
            aria-label="Notifications"
          >
            <Bell size={18} className="text-gray-700" />
            {unread > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />}
          </Link>

          <ProfileMenu email={session.user.email} name={session.user.name} />
        </div>
      </div>
    </header>
  );
}
