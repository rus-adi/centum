import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { setActiveSchool } from "@/app/actions/tenant";
import { formatEnumLabel } from "@/lib/school2/helpers";

const db = prisma as any;
const STAGE_OPTIONS = ["ALL", "ONBOARDING", "FOUNDATION", "PILOT", "SCALE"] as const;

function SchoolOpenButton({ schoolId, redirectTo, label }: { schoolId: string; redirectTo: string; label: string }) {
  return (
    <form action={setActiveSchool}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-left text-sm hover:bg-gray-50" type="submit">
        {label}
      </button>
    </form>
  );
}

export default async function HQPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const active = await requireActiveSchool();
  const stageFilter = typeof searchParams.stage === "string" ? searchParams.stage : "ALL";
  const q = typeof searchParams.q === "string" ? searchParams.q.trim().toLowerCase() : "";

  const schools = await db.school.findMany({
    orderBy: [{ transformationStage: "asc" }, { readinessScore: "desc" }, { name: "asc" }],
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

  let visibleSchools = active.isSuperAdmin ? schools : schools.filter((school: any) => school.id === active.schoolId);
  if (stageFilter !== "ALL") {
    visibleSchools = visibleSchools.filter((school: any) => school.transformationStage === stageFilter);
  }
  if (q) {
    visibleSchools = visibleSchools.filter((school: any) => {
      const haystack = [school.name, school.city, school.region, school.type].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(q);
    });
  }

  const readinessAverage = visibleSchools.length
    ? Math.round(visibleSchools.reduce((sum: number, school: any) => sum + (school.readinessScore ?? 0), 0) / visibleSchools.length)
    : 0;
  const maturityAverage = visibleSchools.length
    ? Math.round(visibleSchools.reduce((sum: number, school: any) => sum + (school.maturityScore ?? 0), 0) / visibleSchools.length)
    : 0;

  return (
    <PageShell
      title="HQ Command Center"
      description="Multi-school oversight for readiness, governance coverage, and staged School 2.0 transformation."
    >
      {!active.isSuperAdmin ? (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm text-gray-600">
            <div>Your current role is school-scoped, so this HQ view is filtered to the active school only.</div>
            <Badge variant="info">Viewing 1 school</Badge>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6 text-sm text-gray-600">
            <div>Super admin mode can switch the active school context directly from each school card below.</div>
            <Badge variant="warning">Active: {active.school.name}</Badge>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Filter schools</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr,220px,auto]" method="get">
            <input
              className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
              name="q"
              defaultValue={q}
              placeholder="Search by school, city, region, or type"
            />
            <select className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" name="stage" defaultValue={stageFilter}>
              {STAGE_OPTIONS.map((stage) => (
                <option key={stage} value={stage}>{stage === "ALL" ? "All stages" : formatEnumLabel(stage)}</option>
              ))}
            </select>
            <button className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-gray-50" type="submit">
              Apply filters
            </button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Schools</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{visibleSchools.length}</div>
            <div className="mt-2 text-sm text-gray-600">Onboarding, pilot, and scale schools under active oversight.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Average readiness</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{readinessAverage}</div>
            <div className="mt-2 text-sm text-gray-600">Simple cross-school benchmark for investor demo flow.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Average maturity</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{maturityAverage}</div>
            <div className="mt-2 text-sm text-gray-600">How far each school has progressed into School 2.0 operating habits.</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4">
        {visibleSchools.length ? visibleSchools.map((school: any) => (
          <Card key={school.id}>
            <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold text-gray-900">{school.name}</div>
                  <Badge variant="info">{formatEnumLabel(school.transformationStage)}</Badge>
                  <Badge variant={school.readinessScore >= 70 ? "success" : school.readinessScore >= 45 ? "warning" : "danger"}>
                    Readiness {school.readinessScore}
                  </Badge>
                  {active.schoolId === school.id ? <Badge variant="warning">Active context</Badge> : null}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {school.city}
                  {school.region ? `, ${school.region}` : ""} • {school.type ? formatEnumLabel(school.type) : "School"} • {school.enrollment ?? school.studentCount ?? 0} learners
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                  <span>{school._count.governanceDocuments} governance docs</span>
                  <span>{school._count.packAdoptions} pack records</span>
                  <span>{school._count.bundleAdoptions} bundle records</span>
                  <span>{school._count.requests} requests</span>
                  <span>{school._count.tickets} tickets</span>
                </div>
              </div>
              <div className="grid gap-2 md:grid-cols-2 lg:w-[420px]">
                <SchoolOpenButton schoolId={school.id} redirectTo="/transformation" label="Open transformation" />
                <SchoolOpenButton schoolId={school.id} redirectTo="/governance" label="Governance & Support" />
                <SchoolOpenButton schoolId={school.id} redirectTo="/tools" label="Tool recommendations" />
                <SchoolOpenButton schoolId={school.id} redirectTo="/transformation/report" label="Executive report" />
                <SchoolOpenButton schoolId={school.id} redirectTo="/training" label="Training hub" />
                <SchoolOpenButton schoolId={school.id} redirectTo="/student-preview" label="Student preview" />
              </div>
            </CardContent>
          </Card>
        )) : (
          <Card>
            <CardContent className="pt-6 text-sm text-gray-600">No schools match the current filters.</CardContent>
          </Card>
        )}
      </div>
    </PageShell>
  );
}
