import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrintButton } from "@/components/transformation/print-button";

function stageBadge(stage: string) {
  if (stage === "SCALE") return <Badge variant="success">Scale</Badge>;
  if (stage === "PILOT") return <Badge variant="info">Pilot</Badge>;
  if (stage === "FOUNDATION") return <Badge variant="warning">Foundation</Badge>;
  return <Badge variant="neutral">Onboarding</Badge>;
}

function pct(n: number) {
  const v = Math.max(0, Math.min(100, Math.round(n)));
  return v;
}

export default async function TransformationReportPage() {
  const { schoolId, school } = await requireActiveSchool();

  const [gates, schoolTools, modules, usersCount, openRequests, openTickets] = await Promise.all([
    prisma.implementationGate.findMany({ where: { schoolId }, orderBy: { order: "asc" } }),
    prisma.schoolTool.findMany({ where: { schoolId }, include: { tool: true }, orderBy: { tool: { name: "asc" } } }),
    prisma.trainingModule.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.user.count({ where: { schoolId, active: true } }),
    prisma.request.count({ where: { schoolId, status: { not: "COMPLETED" } } }),
    prisma.ticket.count({ where: { schoolId, status: { not: "COMPLETED" } } })
  ]);

  const gatesDone = gates.filter((g) => g.status === "COMPLETE").length;
  const toolsEnabled = schoolTools.filter((t) => t.enabled).length;

  let completed = 0;
  for (const m of modules) {
    completed += await prisma.trainingCompletion.count({
      where: { user: { schoolId }, moduleId: m.id, version: m.currentVersion }
    });
  }
  const denom = usersCount * modules.length;
  const trainingCompliance = denom > 0 ? Math.round((completed / denom) * 100) : 0;

  const issues = openRequests + openTickets;

  const nextGates = gates.filter((g) => g.status !== "COMPLETE").slice(0, 4);

  return (
    <div className="min-h-screen bg-white">
      {/* Top actions (hidden when printing) */}
      <div className="sticky top-0 z-10 border-b border-[var(--border)] bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <div className="text-sm text-gray-500">Executive report</div>
            <div className="text-lg font-semibold text-gray-900">{school.name}</div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/transformation" className="text-sm text-blue-700 hover:underline">
              Back
            </Link>
            <PrintButton />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Transformation Executive Report</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              {stageBadge(school.transformationStage)}
              <span>•</span>
              <span>{school.city}</span>
              <span>•</span>
              <span>{pct(school.transformationProgress)}% complete</span>
            </div>
          </div>
          <div className="text-right text-sm text-gray-500">
            Generated: {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Gates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">
                {gatesDone}/{gates.length}
              </div>
              <div className="text-xs text-gray-500">Completed</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">
                {toolsEnabled}/{schoolTools.length}
              </div>
              <div className="text-xs text-gray-500">Enabled</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Training</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">{trainingCompliance}%</div>
              <div className="text-xs text-gray-500">Compliance</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-gray-900">{issues}</div>
              <div className="text-xs text-gray-500">Open</div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>School profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <div className="text-gray-500">Type</div>
                <div className="font-medium text-gray-900">{school.type ?? "—"}</div>
              </div>
              <div className="flex justify-between gap-3">
                <div className="text-gray-500">Curriculum</div>
                <div className="font-medium text-gray-900">{school.curriculum ?? "—"}</div>
              </div>
              <div className="flex justify-between gap-3">
                <div className="text-gray-500">Grade bands</div>
                <div className="font-medium text-gray-900">
                  {Array.isArray(school.gradeBands) ? (school.gradeBands as any[]).join(", ") : "—"}
                </div>
              </div>
              <div className="flex justify-between gap-3">
                <div className="text-gray-500">Estimated students</div>
                <div className="font-medium text-gray-900">{school.studentCount ?? "—"}</div>
              </div>
              <div className="flex justify-between gap-3">
                <div className="text-gray-500">Device model</div>
                <div className="font-medium text-gray-900">{school.deviceModel ?? "—"}</div>
              </div>
              <div className="flex justify-between gap-3">
                <div className="text-gray-500">Ecosystem</div>
                <div className="font-medium text-gray-900">{school.ecosystem ?? "—"}</div>
              </div>
              <div className="flex justify-between gap-3">
                <div className="text-gray-500">Connectivity</div>
                <div className="font-medium text-gray-900">{school.connectivity ?? "—"}</div>
              </div>

              <div className="pt-2">
                <div className="text-gray-500">Constraints / non-negotiables</div>
                <div className="mt-1 whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-gray-50 p-3 text-gray-800">
                  {school.constraints ?? "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommended next actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-3 pl-5 text-sm text-gray-800">
                {nextGates.map((g) => (
                  <li key={g.id}>
                    <div className="font-medium">{g.title}</div>
                    <div className="text-gray-600">{g.description ?? "Complete this gate."}</div>
                  </li>
                ))}
                {nextGates.length === 0 && <li>All gates complete — focus on measurement and iteration.</li>}
              </ol>

              <div className="mt-4 text-sm text-gray-600">
                Open issues: <span className="font-medium">{issues}</span> (Requests {openRequests} • Tickets {openTickets})
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tool stack snapshot</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2">
                {schoolTools.map((st) => (
                  <li key={st.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">{st.tool.name}</div>
                      <div className="text-xs text-gray-500">{st.eligible}</div>
                    </div>
                    <Badge variant={st.enabled ? "success" : "neutral"}>{st.enabled ? "Enabled" : "Disabled"}</Badge>
                  </li>
                ))}
                {schoolTools.length === 0 && <li className="text-gray-500">No tools configured.</li>}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gate status</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ul className="space-y-2">
                {gates.map((g) => (
                  <li key={g.id} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">{g.title}</div>
                      <div className="text-xs text-gray-500">{g.description}</div>
                    </div>
                    <Badge
                      variant={
                        g.status === "COMPLETE" ? "success" : g.status === "IN_PROGRESS" ? "info" : "neutral"
                      }
                    >
                      {g.status === "COMPLETE" ? "Complete" : g.status === "IN_PROGRESS" ? "In progress" : "Not started"}
                    </Badge>
                  </li>
                ))}
                {gates.length === 0 && <li className="text-gray-500">No gates configured.</li>}
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 border-t border-[var(--border)] pt-4 text-xs text-gray-500">
          Centum Partner Portal • Transformation executive report
        </div>
      </div>
    </div>
  );
}
