import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { QueryToast } from "@/components/ui/query-toast";

export async function PageShell({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  const navToggleId = "centum-mobile-nav";

  return (
    <div className="min-h-screen bg-white">
      <input id={navToggleId} type="checkbox" className="peer hidden" />
      <Sidebar />
      <MobileSidebar toggleId={navToggleId} />
      <main className="md:ml-[240px]">
        <Topbar title={title} navToggleId={navToggleId} />
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          <Suspense fallback={null}>
            <QueryToast />
          </Suspense>
          {children}
        </div>
      </main>
    </div>
  );
}
