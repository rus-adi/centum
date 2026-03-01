import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateStudent, deleteStudent } from "@/app/actions/students";
import { directSetStudentToolAccess, requestStudentToolAccessChange } from "@/app/actions/studentToolAccess";
import { canManageToolsDirect, canDelete } from "@/lib/rbac";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";

function statusBadge(status: string) {
  if (status === "ACTIVE") return <Badge variant="success">Active</Badge>;
  if (status === "PENDING") return <Badge variant="warning">Pending</Badge>;
  return <Badge variant="danger">Disabled</Badge>;
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const { session, schoolId } = await requireActiveSchool();
  const student = await prisma.student.findFirst({ where: { id: params.id, schoolId } });
  if (!student) return notFound();

  const role = session.user.role as any;
  const canDirect = canManageToolsDirect(role);
  const canRemove = canDelete(role);

  const schoolTools = await prisma.schoolTool.findMany({
    where: { schoolId },
    include: { tool: true },
    orderBy: { tool: { name: "asc" } }
  });

  const access = await prisma.studentToolAccess.findMany({ where: { studentId: student.id } });
  const accessMap = new Map(access.map((a) => [a.toolId, a.enabled]));

  return (
    <PageShell title="Student Profile">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/students" className="text-sm font-medium text-blue-700 hover:underline">
          ← Back to Students
        </Link>
        <div>{statusBadge(student.status)}</div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" action={updateStudent.bind(null, student.id)}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Student code</label>
                <Input name="studentCode" defaultValue={student.studentCode ?? ""} placeholder="e.g., JKT-0006" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Full name</label>
                <Input name="name" required defaultValue={student.name} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Grade</label>
                  <Input name="grade" type="number" min={1} max={12} required defaultValue={student.grade} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                  <Select name="status" defaultValue={student.status}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING">PENDING</option>
                    <option value="DISABLED">DISABLED</option>
                  </Select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Coach</label>
                <Input name="coachName" defaultValue={student.coachName ?? ""} placeholder="Coach / advisor" />
              </div>

              <div className="flex justify-end">
                <Button variant="primary" type="submit">
                  Save changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tool access</CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              {canDirect
                ? "Admins/IT can directly change access. Others submit requests for approval."
                : "Submit requests for tool access changes."}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {schoolTools.map((st) => {
                const studentEnabled = accessMap.get(st.toolId);
                const effective =
                  st.enabled === false ? false : studentEnabled === false ? false : true;

                return (
                  <div key={st.id} className="rounded-lg border border-[var(--border)] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium text-gray-900">{st.tool.name}</div>
                        <div className="mt-1 text-sm text-gray-600">{st.tool.description}</div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {st.enabled ? <Badge variant="success">School enabled</Badge> : <Badge variant="danger">School disabled</Badge>}
                          <Badge variant={effective ? "info" : "neutral"}>{effective ? "Student access ON" : "Student access OFF"}</Badge>
                        </div>
                        {!st.enabled && (
                          <div className="mt-2 text-xs text-gray-600">
                            School disabled overrides student settings. Enable from <Link className="text-blue-700 hover:underline" href="/tools">Tools</Link>.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {st.enabled ? (
                          <form action={canDirect ? directSetStudentToolAccess : requestStudentToolAccessChange}>
                            <input type="hidden" name="studentId" value={student.id} />
                            <input type="hidden" name="toolId" value={st.toolId} />
                            <input type="hidden" name="enabled" value={effective ? "false" : "true"} />
                            <Button variant={effective ? "secondary" : "primary"} type="submit">
                              {effective ? (canDirect ? "Disable" : "Request disable") : (canDirect ? "Enable" : "Request enable")}
                            </Button>
                          </form>
                        ) : (
                          <Button disabled>Disabled</Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {schoolTools.length === 0 && (
                <div className="text-sm text-gray-500">No tools configured.</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {canRemove && (
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
              <p className="mt-2 text-sm text-gray-600">Student deletion is permanent.</p>
            </CardHeader>
            <CardContent>
              <ConfirmActionForm
                action={deleteStudent.bind(null, student.id)}
                confirmMessage="Delete this student permanently?"
              >
                <Button variant="danger" type="submit">
                  Delete student
                </Button>
              </ConfirmActionForm>
            </CardContent>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
