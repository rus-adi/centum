import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { QueryToast } from "@/components/ui/query-toast";
import { requireActiveSchool } from "@/lib/tenant";

export async function PageShell({
  title,
  description,
  children
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const navToggleId = "centum-mobile-nav";
  const { session } = await requireActiveSchool();

  return (
    <div className="min-h-screen bg-slate-50">
      <input id={navToggleId} type="checkbox" className="peer hidden" />
      <Sidebar role={session.user.role} />
      <MobileSidebar toggleId={navToggleId} role={session.user.role} />
      <main className="md:ml-[272px]">
        <Topbar title={title} description={description} navToggleId={navToggleId} />
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <Suspense fallback={null}>
            <QueryToast />
          </Suspense>
          {children}
        </div>
      </main>
    </div>
  );
}
