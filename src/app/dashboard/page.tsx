import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DashboardPage() {
  const { session, schoolId } = await requireActiveSchool();

  const [students, openRequests, openTickets] = await Promise.all([
    prisma.student.count({ where: { schoolId } }),
    prisma.request.count({ where: { schoolId, status: { in: ["SUBMITTED", "IN_PROGRESS"] } } }),
    prisma.ticket.count({ where: { schoolId, status: { in: ["OPEN", "IN_PROGRESS"] } } })
  ]);

  const modules = await prisma.trainingModule.findMany({ orderBy: { createdAt: "asc" } });
  const completions = await prisma.trainingCompletion.findMany({ where: { userId: session.user.id } });
  const best: Record<string, number> = {};
  for (const c of completions) best[c.moduleId] = Math.max(best[c.moduleId] ?? 0, c.version);

  const updateRequired = modules.filter((m) => (best[m.id] ?? 0) > 0 && (best[m.id] ?? 0) < m.currentVersion).length;
  const notCompletedCurrent = modules.filter((m) => (best[m.id] ?? 0) < m.currentVersion).length;

  return (
    <PageShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-gray-900">{students}</div>
            <div className="mt-2 text-sm text-gray-600">Total students in this school.</div>
            <div className="mt-4">
              <Link className="text-sm font-medium text-blue-700 hover:underline" href="/students">
                Manage students →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-semibold text-gray-900">{openRequests}</div>
              {openRequests > 0 ? <Badge variant="warning">Needs attention</Badge> : <Badge variant="success">Clear</Badge>}
            </div>
            <div className="mt-2 text-sm text-gray-600">Open items requiring action.</div>
            <div className="mt-4">
              <Link className="text-sm font-medium text-blue-700 hover:underline" href="/requests">
                View requests →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-3xl font-semibold text-gray-900">{openTickets}</div>
              {openTickets > 0 ? <Badge variant="warning">Open tickets</Badge> : <Badge variant="success">All good</Badge>}
            </div>
            <div className="mt-2 text-sm text-gray-600">Support tickets in progress.</div>
            <div className="mt-4">
              <Link className="text-sm font-medium text-blue-700 hover:underline" href="/support">
                View support →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Training status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={notCompletedCurrent > 0 ? "warning" : "success"}>
                {notCompletedCurrent > 0 ? `${notCompletedCurrent} module(s) incomplete` : "All current"}
              </Badge>
              {updateRequired > 0 && <Badge variant="danger">{updateRequired} update required</Badge>}
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Training modules track lessons and enforce re-training when policy updates bump versions.
            </div>
            <div className="mt-4">
              <Link className="text-sm font-medium text-blue-700 hover:underline" href="/training">
                Go to Training Hub →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/students/new">
                Add a student
              </Link>
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/requests/new">
                Submit a request
              </Link>
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/support/new">
                Create a support ticket
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
