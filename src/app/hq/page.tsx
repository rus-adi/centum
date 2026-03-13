import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";

const db = prisma as any;

export default async function HQPage() {
  const { isSuperAdmin } = await requireActiveSchool();

  const schools = await db.school.findMany({
    orderBy: [{ transformationStage: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          requests: true,
          tickets: true,
          governanceDocuments: true,
          packAdoptions: true,
          bundleAdoptions: true
        }
      }
    }
  });

  return (
    <PageShell
      title="HQ Command Center"
      description="Multi-school oversight for readiness, governance coverage, and staged School 2.0 transformation."
    >
      {!isSuperAdmin ? (
        <Card>
          <CardContent className="pt-6 text-sm text-gray-600">
            Your current role is school-scoped, so this view is filtered to the active school context.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{schools.length}</div>
            <div className="mt-2 text-sm text-gray-600">Onboarding, pilot, and scale schools under active oversight.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average readiness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">
              {schools.length ? Math.round(schools.reduce((sum: number, school: any) => sum + (school.readinessScore ?? 0), 0) / schools.length) : 0}
            </div>
            <div className="mt-2 text-sm text-gray-600">Simple cross-school benchmark for investor demo flow.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average maturity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">
              {schools.length ? Math.round(schools.reduce((sum: number, school: any) => sum + (school.maturityScore ?? 0), 0) / schools.length) : 0}
            </div>
            <div className="mt-2 text-sm text-gray-600">How far each school has progressed into School 2.0 operating habits.</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4">
        {schools.map((school: any) => (
          <Card key={school.id}>
            <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold text-gray-900">{school.name}</div>
                  <Badge variant="info">{school.transformationStage}</Badge>
                  <Badge variant={school.readinessScore >= 70 ? "success" : school.readinessScore >= 45 ? "warning" : "danger"}>
                    Readiness {school.readinessScore}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {school.city}{school.region ? `, ${school.region}` : ""} • {school.type ?? "School"} • {school.enrollment ?? school.studentCount ?? 0} learners
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>{school._count.governanceDocuments} governance docs</span>
                  <span>{school._count.packAdoptions} pack records</span>
                  <span>{school._count.bundleAdoptions} bundle records</span>
                  <span>{school._count.requests} requests</span>
                  <span>{school._count.tickets} tickets</span>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2 lg:w-[360px]">
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/transformation">
                  Open transformation
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/governance">
                  Governance & Support
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/tools">
                  Tool recommendations
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/transformation/report">
                  Executive report
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
