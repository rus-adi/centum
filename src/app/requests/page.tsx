import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

function statusBadge(status: string) {
  if (status === "COMPLETED") return <Badge variant="success">Completed</Badge>;
  if (status === "IN_PROGRESS") return <Badge variant="info">In progress</Badge>;
  return <Badge variant="warning">Submitted</Badge>;
}

export default async function RequestsPage({
  searchParams
}: {
  searchParams?: { q?: string; status?: string; kind?: string };
}) {
  const { schoolId } = await requireActiveSchool();

  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "").trim();
  const kind = (searchParams?.kind ?? "").trim();

  const where: any = { schoolId };
  if (status) where.status = status;
  if (kind) where.kind = kind;
  if (q) {
    where.OR = [
      { type: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } }
    ];
  }

  const requests = await prisma.request.findMany({
    where,
    include: { submittedBy: true, assignedTo: true, tool: true, student: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PageShell title="Requests">
      <section className="page-intro">
        <div className="toolbar">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">Requests</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">Track provisioning, tool-change, and escalation workflows with a more readable queue and better spacing on smaller screens.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/requests/new">
              <Button variant="primary">New Request</Button>
            </Link>
          </div>
        </div>
      </section>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="filter-bar" action="/requests" method="get">
            <div className="field-stack lg:min-w-[18rem] lg:flex-[1.2]">
              <label className="field-label" htmlFor="requests-search">Search</label>
              <Input
                id="requests-search"
                name="q"
                placeholder="Search type or description…"
                defaultValue={q}
              />
            </div>
            <div className="field-stack lg:min-w-[11rem] lg:flex-1">
              <label className="field-label" htmlFor="requests-status">Status</label>
              <Select id="requests-status" name="status" defaultValue={status}>
                <option value="">All status</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </Select>
            </div>
            <div className="field-stack lg:min-w-[12rem] lg:flex-1">
              <label className="field-label" htmlFor="requests-kind">Kind</label>
              <Select id="requests-kind" name="kind" defaultValue={kind}>
                <option value="">All kinds</option>
                <option value="GENERAL">GENERAL</option>
                <option value="TOOL_ENABLE">TOOL_ENABLE</option>
                <option value="STUDENT_TOOL_ACCESS">STUDENT_TOOL_ACCESS</option>
                <option value="STACK_BUNDLE">STACK_BUNDLE</option>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 lg:ml-auto">
              <Button type="submit" variant="primary">
                Apply
              </Button>
              <Link href="/requests">
                <Button type="button" variant="secondary">
                  Reset
                </Button>
              </Link>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
            <span>Showing {requests.length} requests</span>
            <span className="rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Operations queue</span>
          </div>

          <div>
            <Table>
              <THead>
                <tr>
                  <TH>Type</TH>
                  <TH>Status</TH>
                  <TH>Submitted</TH>
                  <TH>Assigned</TH>
                  <TH>Context</TH>
                </tr>
              </THead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <TD>
                      <Link href={`/requests/${r.id}`} className="font-medium text-blue-700 hover:underline">
                        {r.type}
                      </Link>
                      <div className="mt-1 break-words text-xs uppercase tracking-[0.12em] text-gray-500">{r.kind}</div>
                    </TD>
                    <TD>{statusBadge(r.status)}</TD>
                    <TD className="text-sm text-gray-700">{r.submittedBy?.name ?? "—"}</TD>
                    <TD className="text-sm text-gray-700">{r.assignedTo?.name ?? "—"}</TD>
                    <TD className="text-sm text-gray-700">
                      {r.tool ? r.tool.name : r.student ? `${r.student.name} (${r.student.studentCode ?? ""})` : "—"}
                    </TD>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <TD colSpan={5} className="text-center text-gray-500">
                      No requests found.
                    </TD>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
