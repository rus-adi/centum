import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Requests</h1>
          <p className="text-sm text-gray-600">Workflow for provisioning, tool changes, and escalations.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/requests/new">
            <Button variant="primary">New Request</Button>
          </Link>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-2 md:flex-row md:items-center" action="/requests" method="get">
            <Input
              name="q"
              placeholder="Search type or description…"
              defaultValue={q}
              className="md:max-w-sm"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-gray-900"
            >
              <option value="">All status</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
            <select
              name="kind"
              defaultValue={kind}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-gray-900"
            >
              <option value="">All kinds</option>
              <option value="GENERAL">GENERAL</option>
              <option value="TOOL_ENABLE">TOOL_ENABLE</option>
              <option value="STUDENT_TOOL_ACCESS">STUDENT_TOOL_ACCESS</option>
              <option value="STACK_BUNDLE">STACK_BUNDLE</option>
            </select>
            <div className="flex gap-2">
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

          <div className="mt-3 text-xs text-gray-500">Showing {requests.length} requests</div>

          <div className="mt-4 overflow-x-auto">
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
                      <Link href={`/requests/${r.id}`} className="text-blue-700 hover:underline">
                        {r.type}
                      </Link>
                      <div className="mt-1 text-xs text-gray-500">{r.kind}</div>
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
