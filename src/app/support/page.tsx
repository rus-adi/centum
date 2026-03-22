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
      <section className="page-intro">
        <div className="toolbar">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">Support</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">Keep operational tickets easier to scan with more spacious filters, stronger hierarchy, and cleaner table presentation.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/support/new">
              <Button variant="primary">New Ticket</Button>
            </Link>
          </div>
        </div>
      </section>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="filter-bar" action="/support" method="get">
            <div className="field-stack lg:min-w-[18rem] lg:flex-[1.2]">
              <label className="field-label" htmlFor="support-search">Search</label>
              <Input
                id="support-search"
                name="q"
                placeholder="Search subject or description…"
                defaultValue={q}
              />
            </div>
            <div className="field-stack lg:min-w-[11rem] lg:flex-1">
              <label className="field-label" htmlFor="support-status">Status</label>
              <Select id="support-status" name="status" defaultValue={status}>
                <option value="">All status</option>
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="COMPLETED">COMPLETED</option>
              </Select>
            </div>
            <div className="field-stack lg:min-w-[12rem] lg:flex-1">
              <label className="field-label" htmlFor="support-category">Category</label>
              <Select id="support-category" name="category" defaultValue={category}>
                <option value="">All categories</option>
                {catList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 lg:ml-auto">
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

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
            <span>Showing {tickets.length} tickets</span>
            <span className="rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Support desk</span>
          </div>

          <div>
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
                      <Link href={`/support/${t.id}`} className="font-medium text-blue-700 hover:underline">
                        {t.subject}
                      </Link>
                      <div className="mt-1 break-words text-xs leading-5 text-gray-500">{t.description.slice(0, 80)}{t.description.length > 80 ? "…" : ""}</div>
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
