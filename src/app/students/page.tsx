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
  if (status === "ACTIVE") return <Badge variant="success">Active</Badge>;
  if (status === "PENDING") return <Badge variant="warning">Pending</Badge>;
  return <Badge variant="neutral">Disabled</Badge>;
}

export default async function StudentsPage({
  searchParams
}: {
  searchParams?: { q?: string; status?: string; grade?: string };
}) {
  const { schoolId } = await requireActiveSchool();

  const q = (searchParams?.q ?? "").trim();
  const status = (searchParams?.status ?? "").trim();
  const gradeRaw = (searchParams?.grade ?? "").trim();
  const grade = gradeRaw ? parseInt(gradeRaw, 10) : null;

  const where: any = { schoolId };
  if (status) where.status = status;
  if (grade && Number.isFinite(grade)) where.grade = grade;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { studentCode: { contains: q, mode: "insensitive" } },
      { coachName: { contains: q, mode: "insensitive" } }
    ];
  }

  const students = await prisma.student.findMany({ where, orderBy: { createdAt: "desc" } });

  return (
    <PageShell title="Students">
      <section className="page-intro">
        <div className="toolbar">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900">Students</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">Manage student provisioning and tool access with cleaner filtering, clearer hierarchy, and better small-screen behavior.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/students/new">
              <Button variant="primary">Add Student</Button>
            </Link>
            <Link href="/students/import">
              <Button variant="secondary">Import CSV</Button>
            </Link>
          </div>
        </div>
      </section>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <p className="mt-2 text-sm leading-6 text-gray-600">Search and filter by status or grade without crowding the toolbar on smaller screens.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="filter-bar" action="/students" method="get">
            <div className="field-stack lg:min-w-[18rem] lg:flex-[1.2]">
              <label className="field-label" htmlFor="students-search">Search</label>
              <Input id="students-search" name="q" placeholder="Search name, code, coach…" defaultValue={q} />
            </div>
            <div className="field-stack lg:min-w-[11rem] lg:flex-1">
              <label className="field-label" htmlFor="students-status">Status</label>
              <Select id="students-status" name="status" defaultValue={status}>
                <option value="">All status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="PENDING">PENDING</option>
                <option value="DISABLED">DISABLED</option>
              </Select>
            </div>
            <div className="field-stack lg:min-w-[11rem] lg:flex-1">
              <label className="field-label" htmlFor="students-grade">Grade</label>
              <Select id="students-grade" name="grade" defaultValue={gradeRaw}>
                <option value="">All grades</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={String(g)}>
                    Grade {g}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-wrap gap-2 lg:ml-auto">
              <Button type="submit" variant="primary">
                Apply
              </Button>
              <Link href="/students">
                <Button type="button" variant="secondary">
                  Reset
                </Button>
              </Link>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-500">
            <span>Showing {students.length} students</span>
            <span className="rounded-full bg-[var(--soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Directory</span>
          </div>

          <div>
            <Table>
              <THead>
                <tr>
                  <TH>Code</TH>
                  <TH>Name</TH>
                  <TH>Grade</TH>
                  <TH>Status</TH>
                  <TH>Coach</TH>
                </tr>
              </THead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <TD>
                      <Link href={`/students/${s.id}`} className="font-medium text-blue-700 hover:underline">
                        {s.studentCode ?? "—"}
                      </Link>
                    </TD>
                    <TD className="font-medium text-gray-900">{s.name}</TD>
                    <TD className="whitespace-nowrap">Grade {s.grade}</TD>
                    <TD>{statusBadge(s.status)}</TD>
                    <TD className="text-gray-700">{s.coachName ?? "—"}</TD>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <TD colSpan={5} className="text-center text-gray-500">
                      No students found.
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
