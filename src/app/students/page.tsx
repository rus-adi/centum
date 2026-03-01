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
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Students</h1>
          <p className="text-sm text-gray-600">Manage student provisioning and tool access.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/students/new">
            <Button variant="primary">Add Student</Button>
          </Link>
          <Link href="/students/import">
            <Button variant="secondary">Import CSV</Button>
          </Link>
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Directory</CardTitle>
          <p className="mt-2 text-sm text-gray-600">Search and filter by status or grade.</p>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-2 md:flex-row md:items-center" action="/students" method="get">
            <Input name="q" placeholder="Search name, code, coach…" defaultValue={q} className="md:max-w-sm" />
            <select
              name="status"
              defaultValue={status}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-gray-900"
            >
              <option value="">All status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="DISABLED">DISABLED</option>
            </select>
            <select
              name="grade"
              defaultValue={gradeRaw}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-gray-900"
            >
              <option value="">All grades</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={String(g)}>
                  Grade {g}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
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

          <div className="mt-3 text-xs text-gray-500">Showing {students.length} students</div>

          <div className="mt-4 overflow-x-auto">
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
                      <Link href={`/students/${s.id}`} className="text-blue-700 hover:underline">
                        {s.studentCode ?? "—"}
                      </Link>
                    </TD>
                    <TD className="text-gray-900">{s.name}</TD>
                    <TD>{s.grade}</TD>
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
