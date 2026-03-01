import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool, activeSchoolCookieName } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmActionForm } from "@/components/ui/confirm-action-form";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createInvite } from "@/app/actions/auth";
import { createSchool, setActiveSchool } from "@/app/actions/tenant";
import { deleteUser, setUserActive, setUserRole, updateSchool } from "@/app/actions/settings";
import { isAdminRole, roleLabel } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { RolePermissionsCard } from "@/components/settings/role-permissions";

export default async function SettingsPage() {
  const { session, schoolId, school, isSuperAdmin } = await requireActiveSchool();

  const canAdmin = isAdminRole(session.user.role);

  const [users, invites, auditLogs] = await Promise.all([
    prisma.user.findMany({ where: { schoolId }, orderBy: { createdAt: "asc" } }),
    prisma.inviteToken.findMany({
      where: { schoolId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.auditLog.findMany({
      where: { schoolId },
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 30
    })
  ]);

  const schools = isSuperAdmin
    ? await prisma.school.findMany({ orderBy: { createdAt: "asc" } })
    : [];

  const gradeBands = Array.isArray(school.gradeBands) ? (school.gradeBands as any[]).map(String) : [];
  const priorityOutcomes = Array.isArray(school.priorityOutcomes)
    ? (school.priorityOutcomes as any[]).map(String)
    : [];

  return (
    <PageShell title="Settings">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <div className="text-gray-500">Signed in as</div>
              <div className="font-medium text-gray-900">{session.user.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">{roleLabel(session.user.role)}</Badge>
              {isSuperAdmin && <Badge variant="warning">Multi-school</Badge>}
            </div>
            <div className="pt-3">
              <SignOutButton />
            </div>
          </CardContent>
        </Card>

        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>School context (Super Admin)</CardTitle>
              <p className="mt-2 text-sm text-gray-600">
                Choose which school you are currently viewing. Stored in cookie{" "}
                <span className="font-mono">{activeSchoolCookieName()}</span>.
              </p>
            </CardHeader>
            <CardContent>
              <form className="flex flex-col gap-2" action={setActiveSchool}>
                <Select name="schoolId" defaultValue={schoolId}>
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.city}
                    </option>
                  ))}
                </Select>
                <Button type="submit">Switch school</Button>
              </form>

              <div className="mt-4 rounded-lg border border-[var(--border)] bg-gray-50 px-4 py-3 text-sm text-gray-700">
                <div className="font-medium">Create a new school</div>
                <form className="mt-3 grid gap-3 md:grid-cols-2" action={createSchool}>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-medium text-gray-600">School name</label>
                    <Input name="name" placeholder="School name" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">City</label>
                    <Input name="city" placeholder="City" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">Timezone</label>
                    <Input name="timezone" defaultValue="Asia/Jakarta" />
                  </div>
                  <div className="md:col-span-2 flex justify-end">
                    <Button variant="primary" type="submit">
                      Create school
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>School profile</CardTitle>
            {!canAdmin && <p className="mt-2 text-sm text-gray-600">Read-only: ask an admin to update.</p>}
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" action={updateSchool}>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                  <Input name="name" defaultValue={school.name} disabled={!canAdmin} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">City</label>
                  <Input name="city" defaultValue={school.city} disabled={!canAdmin} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Timezone</label>
                  <Input name="timezone" defaultValue={school.timezone} disabled={!canAdmin} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">School type</label>
                  <Select name="type" defaultValue={school.type ?? ""} disabled={!canAdmin}>
                    <option value="">—</option>
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="INTERNATIONAL">INTERNATIONAL</option>
                    <option value="HYBRID">HYBRID</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Curriculum</label>
                <Input
                  name="curriculum"
                  placeholder="e.g., National, IB, Cambridge, mixed"
                  defaultValue={school.curriculum ?? ""}
                  disabled={!canAdmin}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Estimated student count</label>
                  <Input
                    name="studentCount"
                    type="number"
                    min={1}
                    placeholder="e.g., 600"
                    defaultValue={school.studentCount ?? ""}
                    disabled={!canAdmin}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Device model</label>
                  <Select name="deviceModel" defaultValue={school.deviceModel ?? ""} disabled={!canAdmin}>
                    <option value="">—</option>
                    <option value="ONE_TO_ONE">ONE_TO_ONE</option>
                    <option value="SHARED">SHARED</option>
                    <option value="LAB_ONLY">LAB_ONLY</option>
                    <option value="BYOD">BYOD</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Connectivity</label>
                  <Select name="connectivity" defaultValue={school.connectivity ?? ""} disabled={!canAdmin}>
                    <option value="">—</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Ecosystem</label>
                  <Select name="ecosystem" defaultValue={school.ecosystem ?? ""} disabled={!canAdmin}>
                    <option value="">—</option>
                    <option value="GOOGLE">GOOGLE</option>
                    <option value="MICROSOFT">MICROSOFT</option>
                    <option value="MIXED">MIXED</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Grade bands</label>
                  <div className="grid gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2">
                    <label className="flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        name="gradeBands"
                        value="MIDDLE"
                        defaultChecked={gradeBands.includes("MIDDLE")}
                        disabled={!canAdmin}
                      />
                      Middle (Grades 7-9)
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        name="gradeBands"
                        value="HIGH"
                        defaultChecked={gradeBands.includes("HIGH")}
                        disabled={!canAdmin}
                      />
                      High (Grades 10-12)
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Priority outcomes</label>
                <div className="grid gap-2 rounded-md border border-[var(--border)] bg-white px-3 py-2 md:grid-cols-2">
                  {[
                    "Teacher AI readiness",
                    "Student accountability",
                    "Faster operations",
                    "Project-based learning",
                    "Higher scores",
                    "Reduce teacher workload",
                    "Improve student support"
                  ].map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm text-gray-800">
                      <input
                        type="checkbox"
                        name="priorityOutcomes"
                        value={o}
                        defaultChecked={priorityOutcomes.includes(o)}
                        disabled={!canAdmin}
                      />
                      {o}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Constraints / non-negotiables</label>
                <Textarea
                  name="constraints"
                  placeholder="What the school will not change (curriculum, assessments, devices, etc.)"
                  defaultValue={school.constraints ?? ""}
                  disabled={!canAdmin}
                />
              </div>

              {canAdmin && (
                <div className="flex justify-end">
                  <Button variant="primary" type="submit">
                    Save
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {canAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Invite a user</CardTitle>
              <p className="mt-2 text-sm text-gray-600">
                Creates an invite link. If email sending is not configured, the link will appear in a debug toast.
              </p>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3" action={createInvite}>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                  <Input name="email" type="email" required placeholder="person@school.id" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Role</label>
                  <Select name="role" defaultValue="STAFF">
                    <option value="ADMIN">ADMIN</option>
                    <option value="IT">IT</option>
                    <option value="STAFF">STAFF</option>
                    <option value="COACH">COACH</option>
                    <option value="TEACHER">TEACHER</option>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button variant="primary" type="submit">
                    Create invite
                  </Button>
                </div>
              </form>

              {invites.length > 0 && (
                <div className="mt-4 rounded-lg border border-[var(--border)] bg-gray-50 px-4 py-3">
                  <div className="text-sm font-medium text-gray-800">Recent invites (pending)</div>
                  <div className="mt-2 space-y-2 text-sm text-gray-700">
                    {invites.map((i) => (
                      <div key={i.id} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{i.email}</div>
                          <div className="text-xs text-gray-500">
                            Role: {i.role} • Expires: {formatDateTime(i.expiresAt)}
                          </div>
                        </div>
                        <Badge variant="neutral">Pending</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <p className="mt-2 text-sm text-gray-600">Deactivate accounts instead of deleting where possible.</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="border-t border-[var(--border)] px-4 py-3 font-medium text-gray-900">{u.name}</td>
                    <td className="border-t border-[var(--border)] px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="border-t border-[var(--border)] px-4 py-3">
                      {canAdmin ? (
                        <form action={setUserRole}>
                          <input type="hidden" name="userId" value={u.id} />
                          <Select name="role" defaultValue={u.role}>
                            <option value="ADMIN">ADMIN</option>
                            <option value="IT">IT</option>
                            <option value="STAFF">STAFF</option>
                            <option value="COACH">COACH</option>
                            <option value="TEACHER">TEACHER</option>
                          </Select>
                          <div className="mt-2"><Button type="submit">Save</Button></div>
                        </form>
                      ) : (
                        <Badge variant="neutral">{u.role}</Badge>
                      )}
                    </td>
                    <td className="border-t border-[var(--border)] px-4 py-3">
                      {u.active ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Disabled</Badge>}
                    </td>
                    <td className="border-t border-[var(--border)] px-4 py-3 text-right">
                      {canAdmin && (
                        <div className="flex justify-end gap-2">
                          <form action={setUserActive}>
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="active" value={u.active ? "false" : "true"} />
                            <Button type="submit">{u.active ? "Deactivate" : "Activate"}</Button>
                          </form>

                          <ConfirmActionForm
                            action={deleteUser}
                            confirmMessage={`Delete user ${u.email}? This is permanent.`}
                          >
                            <input type="hidden" name="userId" value={u.id} />
                            <Button variant="danger" type="submit">
                              Delete
                            </Button>
                          </ConfirmActionForm>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {users.length === 0 && (
                  <tr>
                    <td className="border-t border-[var(--border)] px-4 py-3 text-center text-gray-500" colSpan={5}>
                      No users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {canAdmin && <RolePermissionsCard />}

      {canAdmin && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Audit log</CardTitle>
            <p className="mt-2 text-sm text-gray-600">Latest 30 events for this school.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto rounded-lg border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">When</th>
                    <th className="px-4 py-3 text-left font-medium">Actor</th>
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                    <th className="px-4 py-3 text-left font-medium">Entity</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((a) => (
                    <tr key={a.id}>
                      <td className="border-t border-[var(--border)] px-4 py-3 text-gray-600">{formatDateTime(a.createdAt)}</td>
                      <td className="border-t border-[var(--border)] px-4 py-3 text-gray-700">{a.actor?.name ?? "System"}</td>
                      <td className="border-t border-[var(--border)] px-4 py-3 font-mono text-xs text-gray-800">{a.action}</td>
                      <td className="border-t border-[var(--border)] px-4 py-3 text-gray-700">
                        {a.entityType}
                        {a.entityId ? <span className="text-gray-400"> #{a.entityId.slice(0, 6)}</span> : null}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td className="border-t border-[var(--border)] px-4 py-3 text-center text-gray-500" colSpan={4}>
                        No audit events yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
