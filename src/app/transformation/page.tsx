import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TD } from "@/components/ui/table";

function stageBadge(stage: string) {
  if (stage === "SCALE") return <Badge variant="success">Scale</Badge>;
  if (stage === "PILOT") return <Badge variant="info">Pilot</Badge>;
  if (stage === "FOUNDATION") return <Badge variant="warning">Foundation</Badge>;
  return <Badge variant="neutral">Onboarding</Badge>;
}

function gateBadge(status: string) {
  if (status === "COMPLETE") return <Badge variant="success">Complete</Badge>;
  if (status === "IN_PROGRESS") return <Badge variant="info">In progress</Badge>;
  return <Badge variant="neutral">Not started</Badge>;
}

function pct(n: number) {
  const v = Math.max(0, Math.min(100, Math.round(n)));
  return v;
}

export default async function TransformationOverviewPage() {
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

  // Training compliance = completions for current version across users, divided by (users * modules)
  let completed = 0;
  for (const m of modules) {
    completed += await prisma.trainingCompletion.count({
      where: { user: { schoolId }, moduleId: m.id, version: m.currentVersion }
    });
  }
  const denom = usersCount * modules.length;
  const trainingCompliance = denom > 0 ? Math.round((completed / denom) * 100) : 0;

  const issues = openRequests + openTickets;

  // Simple next actions: first 3 non-complete gates
  const nextGates = gates.filter((g) => g.status !== "COMPLETE").slice(0, 3);

  return (
    <PageShell title="Transformation Overview">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm text-gray-500">{school.name}</div>
              <div className="mt-1 flex items-center gap-2">
                {stageBadge(school.transformationStage)}
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-500">{school.city}</span>
                <span className="text-sm text-gray-500">•</span>
                <span className="text-sm text-gray-700">{pct(school.transformationProgress)}% complete</span>
              </div>

              <div className="mt-3 h-2 w-full max-w-[520px] rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-blue-600"
                  style={{ width: `${pct(school.transformationProgress)}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href="/transformation/report">
                <Button variant="secondary">Export executive report</Button>
              </Link>
              <Link href="/tools">
                <Button variant="primary">Manage tools</Button>
              </Link>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Gates completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">
                  {gatesDone}/{gates.length}
                </div>
                <div className="mt-1 text-xs text-gray-500">Implementation readiness</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Tools enabled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">
                  {toolsEnabled}/{schoolTools.length}
                </div>
                <div className="mt-1 text-xs text-gray-500">Approved stack coverage</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Training compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-semibold text-gray-900">{trainingCompliance}%</div>
                  <Badge variant={trainingCompliance >= 80 ? "success" : trainingCompliance >= 50 ? "warning" : "danger"}>
                    {trainingCompliance >= 80 ? "Healthy" : trainingCompliance >= 50 ? "At risk" : "Critical"}
                  </Badge>
                </div>
                <div className="mt-1 text-xs text-gray-500">Across active staff accounts</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Open issues</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900">{issues}</div>
                <div className="mt-1 text-xs text-gray-500">
                  Requests {openRequests} • Tickets {openTickets}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Implementation gates</CardTitle>
            <p className="mt-2 text-sm text-gray-600">A simple gate model to track readiness and rollout progress.</p>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <tr>
                  <TH>Gate</TH>
                  <TH>Status</TH>
                </tr>
              </THead>
              <tbody>
                {gates.map((g) => (
                  <tr key={g.id}>
                    <TD>
                      <div className="font-medium text-gray-900">{g.title}</div>
                      {g.description && <div className="mt-1 text-xs text-gray-500">{g.description}</div>}
                    </TD>
                    <TD>{gateBadge(g.status)}</TD>
                  </tr>
                ))}
                {gates.length === 0 && (
                  <tr>
                    <TD colSpan={2} className="text-center text-gray-500">
                      No gates configured yet.
                    </TD>
                  </tr>
                )}
              </tbody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Next actions</CardTitle>
            <p className="mt-2 text-sm text-gray-600">What Centum should do next to move the school forward.</p>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-5 text-sm text-gray-800">
              {nextGates.map((g) => (
                <li key={g.id}>
                  <div className="font-medium">{g.title}</div>
                  <div className="text-gray-600">
                    {g.description || "Complete this gate to increase readiness."}
                  </div>
                </li>
              ))}
              {nextGates.length === 0 && <li>All gates complete — focus on measurement and iteration.</li>}
            </ol>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/requests/new">
                <Button variant="secondary">Create request</Button>
              </Link>
              <Link href="/support/new">
                <Button variant="secondary">Create support ticket</Button>
              </Link>
              <Link href="/knowledge">
                <Button variant="secondary">Open knowledge base</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>School profile snapshot</CardTitle>
          <p className="mt-2 text-sm text-gray-600">A quick view of the information captured for rollout planning.</p>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <div className="text-xs text-gray-500">Type</div>
            <div className="font-medium text-gray-900">{school.type ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Curriculum</div>
            <div className="font-medium text-gray-900">{school.curriculum ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Grade bands</div>
            <div className="font-medium text-gray-900">
              {Array.isArray(school.gradeBands) ? (school.gradeBands as any[]).join(", ") : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Students</div>
            <div className="font-medium text-gray-900">{school.studentCount ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Device model</div>
            <div className="font-medium text-gray-900">{school.deviceModel ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Ecosystem</div>
            <div className="font-medium text-gray-900">{school.ecosystem ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Connectivity</div>
            <div className="font-medium text-gray-900">{school.connectivity ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Priority outcomes</div>
            <div className="font-medium text-gray-900">
              {Array.isArray(school.priorityOutcomes) ? (school.priorityOutcomes as any[]).join(", ") : "—"}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs text-gray-500">Constraints / non-negotiables</div>
            <div className="mt-1 whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-gray-50 p-3 text-sm text-gray-800">
              {school.constraints ?? "—"}
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Link href="/settings">
              <Button variant="primary">Edit school profile</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
