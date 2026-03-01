import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TD } from "@/components/ui/table";
import { setActiveSchool } from "@/app/actions/tenant";

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

export default async function HQPage() {
  const { isSuperAdmin } = await requireActiveSchool();

  if (!isSuperAdmin) {
    return (
      <PageShell title="HQ">
        <Card>
          <CardHeader>
            <CardTitle>HQ view</CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              This page is intended for Centum operators (Super Admin) to monitor multiple schools.
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700">
              You&apos;re signed in as a single-school user. Use the other menu items (Transformation, Students, Tools, etc.)
              for your school.
            </div>
          </CardContent>
        </Card>
      </PageShell>
    );
  }

  const [schools, modules] = await Promise.all([
    prisma.school.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.trainingModule.findMany({ orderBy: { createdAt: "asc" } })
  ]);

  // Aggregate school metrics (small N for demo, ok to compute per-school)
  const rows = await Promise.all(
    schools.map(async (s) => {
      const [studentCount, openRequests, openTickets, gatesTotal, gatesDone, toolsTotal, toolsEnabled] =
        await Promise.all([
          prisma.student.count({ where: { schoolId: s.id } }),
          prisma.request.count({ where: { schoolId: s.id, status: { not: "COMPLETED" } } }),
          prisma.ticket.count({ where: { schoolId: s.id, status: { not: "COMPLETED" } } }),
          prisma.implementationGate.count({ where: { schoolId: s.id } }),
          prisma.implementationGate.count({ where: { schoolId: s.id, status: "COMPLETE" } }),
          prisma.schoolTool.count({ where: { schoolId: s.id } }),
          prisma.schoolTool.count({ where: { schoolId: s.id, enabled: true } })
        ]);

      // Training compliance = completions for current version across users, divided by (users * modules)
      const usersCount = await prisma.user.count({ where: { schoolId: s.id, active: true } });
      let completed = 0;
      for (const m of modules) {
        // count completions for current version of each module
        // (unique per user/module/version)
        completed += await prisma.trainingCompletion.count({
          where: { user: { schoolId: s.id }, moduleId: m.id, version: m.currentVersion }
        });
      }
      const denom = usersCount * modules.length;
      const trainingCompliance = denom > 0 ? Math.round((completed / denom) * 100) : 0;

      return {
        school: s,
        studentCount,
        openRequests,
        openTickets,
        gatesTotal,
        gatesDone,
        toolsTotal,
        toolsEnabled,
        trainingCompliance
      };
    })
  );

  const totals = rows.reduce(
    (acc, r) => {
      acc.schools += 1;
      acc.students += r.studentCount;
      acc.openRequests += r.openRequests;
      acc.openTickets += r.openTickets;
      return acc;
    },
    { schools: 0, students: 0, openRequests: 0, openTickets: 0 }
  );

  return (
    <PageShell title="HQ">
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total schools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{totals.schools}</div>
            <div className="mt-1 text-xs text-gray-500">Demo multi-school portfolio view</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{totals.students}</div>
            <div className="mt-1 text-xs text-gray-500">Across all schools</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{totals.openRequests}</div>
            <div className="mt-1 text-xs text-gray-500">Submitted + In progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open support tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{totals.openTickets}</div>
            <div className="mt-1 text-xs text-gray-500">Operational issues to resolve</div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Schools</CardTitle>
          <p className="mt-2 text-sm text-gray-600">
            Switch context to a school and jump into its Transformation view.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>School</TH>
                <TH>Stage</TH>
                <TH>Progress</TH>
                <TH>Students</TH>
                <TH>Tools</TH>
                <TH>Training</TH>
                <TH>Open issues</TH>
                <TH></TH>
              </tr>
            </THead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.school.id}>
                  <TD>
                    <div className="font-medium text-gray-900">{r.school.name}</div>
                    <div className="text-xs text-gray-500">{r.school.city}</div>
                  </TD>
                  <TD>{stageBadge(r.school.transformationStage)}</TD>
                  <TD>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-28 rounded-full bg-gray-100">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{ width: `${pct(r.school.transformationProgress)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600">{pct(r.school.transformationProgress)}%</div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Gates: {r.gatesDone}/{r.gatesTotal || 0}
                    </div>
                  </TD>
                  <TD className="text-gray-700">{r.studentCount}</TD>
                  <TD className="text-gray-700">
                    {r.toolsEnabled}/{r.toolsTotal || 0}
                  </TD>
                  <TD>
                    <Badge variant={r.trainingCompliance >= 80 ? "success" : r.trainingCompliance >= 50 ? "warning" : "danger"}>
                      {r.trainingCompliance}%
                    </Badge>
                  </TD>
                  <TD>
                    <div className="text-sm text-gray-700">{r.openRequests + r.openTickets}</div>
                    <div className="text-xs text-gray-500">Req {r.openRequests} • Tix {r.openTickets}</div>
                  </TD>
                  <TD className="text-right">
                    <form action={setActiveSchool}>
                      <input type="hidden" name="schoolId" value={r.school.id} />
                      <input type="hidden" name="redirectTo" value="/transformation" />
                      <Button variant="primary" type="submit">
                        View
                      </Button>
                    </form>
                  </TD>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <TD colSpan={8} className="text-center text-gray-500">
                    No schools found.
                  </TD>
                </tr>
              )}
            </tbody>
          </Table>

          <div className="mt-4 text-xs text-gray-500">
            Tip: You can also switch school context in <Link className="text-blue-700 hover:underline" href="/settings">Settings</Link>.
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
