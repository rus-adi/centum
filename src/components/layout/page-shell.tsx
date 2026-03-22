import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import { Topbar } from "@/components/layout/topbar";
import { QueryToast } from "@/components/ui/query-toast";
import { requireActiveSchool } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import { formatEnumLabel } from "@/lib/school2/helpers";

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
  const { session, school } = await requireActiveSchool();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#f8fafc_22%,#f8fafc_100%)]">
      <input id={navToggleId} type="checkbox" className="peer hidden" />
      <Sidebar role={session.user.role} />
      <MobileSidebar toggleId={navToggleId} role={session.user.role} />
      <main className="md:ml-[288px]">
        <Topbar title={title} navToggleId={navToggleId} />
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <Suspense fallback={null}>
            <QueryToast />
          </Suspense>
          {description ? (
            <section className="page-intro mb-5 sm:mb-6">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">{school.name}</div>
                <p className="max-w-4xl text-sm leading-6 text-gray-600 sm:text-[15px]">{description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info">{formatEnumLabel(session.user.role)}</Badge>
                {school.transformationStage ? (
                  <Badge variant="neutral">{formatEnumLabel(school.transformationStage)}</Badge>
                ) : null}
                {school.readinessScore ? <Badge variant="warning">Readiness {school.readinessScore}</Badge> : null}
              </div>
            </section>
          ) : null}
          {children}
        </div>
      </main>
    </div>
  );
}
