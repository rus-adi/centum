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
  return <Badge variant="warning">Open</Badge>;
}

export default async function SupportPage({
  searchParams
}: {
  searchParams?: { q?: string; status?: string; category?: string };
}) {
  const { schoolId } = await requireActiveSchool();

  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "").trim();
  const category = (searchParams?.category ?? "").trim();

  const where: any = { schoolId };
  if (status) where.status = status;
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { subject: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } }
    ];
  }

  const [tickets, categories] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: { submittedBy: true, assignedTo: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.ticket.groupBy({ by: ["category"], where: { schoolId } })
  ]);

  const catList = categories
    .map((c) => c.category)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return (
    <PageShell title="Support">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Support</h1>
          <p className="text-sm text-gray-600">Operational tickets and troubleshooting workflow.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/support/new">
            <Button variant="primary">New Ticket</Button>
          </Link>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-2 md:flex-row md:items-center" action="/support" method="get">
            <Input
              name="q"
              placeholder="Search subject or description…"
              defaultValue={q}
              className="md:max-w-sm"
            />
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-gray-900"
            >
              <option value="">All status</option>
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
            <select
              name="category"
              defaultValue={category}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-gray-900"
            >
              <option value="">All categories</option>
              {catList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button type="submit" variant="primary">
                Apply
              </Button>
              <Link href="/support">
                <Button type="button" variant="secondary">
                  Reset
                </Button>
              </Link>
            </div>
          </form>

          <div className="mt-3 text-xs text-gray-500">Showing {tickets.length} tickets</div>

          <div className="mt-4 overflow-x-auto">
            <Table>
              <THead>
                <tr>
                  <TH>Subject</TH>
                  <TH>Status</TH>
                  <TH>Category</TH>
                  <TH>Submitted</TH>
                  <TH>Assigned</TH>
                </tr>
              </THead>
              <tbody>
                {tickets.map((t) => (
                  <tr key={t.id}>
                    <TD>
                      <Link href={`/support/${t.id}`} className="text-blue-700 hover:underline">
                        {t.subject}
                      </Link>
                      <div className="mt-1 text-xs text-gray-500">{t.description.slice(0, 80)}{t.description.length > 80 ? "…" : ""}</div>
                    </TD>
                    <TD>{statusBadge(t.status)}</TD>
                    <TD className="text-sm text-gray-700">{t.category}</TD>
                    <TD className="text-sm text-gray-700">{t.submittedBy?.name ?? "—"}</TD>
                    <TD className="text-sm text-gray-700">{t.assignedTo?.name ?? "—"}</TD>
                  </tr>
                ))}
                {tickets.length === 0 && (
                  <tr>
                    <TD colSpan={5} className="text-center text-gray-500">
                      No tickets found.
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
