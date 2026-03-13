import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool, activeSchoolCookieName } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createInvite } from "@/app/actions/auth";
import { createSchool, setActiveSchool } from "@/app/actions/tenant";
import { deleteUser, setUserActive, setUserRole, updateSchool } from "@/app/actions/settings";
import { isAdminRole, roleLabel } from "@/lib/session";
import { formatDateTime } from "@/lib/format";

export default async function SettingsPage() {
  const { session, schoolId, school, isSuperAdmin } = await requireActiveSchool();
  const canAdmin = isAdminRole(session.user.role);

  const [users, invites, schools] = await Promise.all([
    prisma.user.findMany({ where: { schoolId }, orderBy: { createdAt: "asc" } }),
    prisma.inviteToken.findMany({
      where: { schoolId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    isSuperAdmin ? prisma.school.findMany({ orderBy: { createdAt: "asc" } }) : Promise.resolve([])
  ]);

  const gradeBands = Array.isArray(school.gradeBands) ? (school.gradeBands as any[]).map(String) : [];
  const priorityOutcomes = Array.isArray(school.priorityOutcomes) ? (school.priorityOutcomes as any[]).map(String) : [];
  const currentTooling = Array.isArray((school as any).currentTooling) ? ((school as any).currentTooling as any[]).map(String) : [];

  return (
    <PageShell
      title="Settings"
      description="Account settings, school profile, leadership goals, user access, and active school context."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-gray-500">Signed in as</div>
              <div className="font-medium text-gray-900">{session.user.email}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="info">{roleLabel(session.user.role)}</Badge>
              {isSuperAdmin ? <Badge variant="warning">Multi-school</Badge> : null}
            </div>
            <SignOutButton />
          </CardContent>
        </Card>

        {isSuperAdmin ? (
          <Card>
            <CardHeader>
              <CardTitle>School context</CardTitle>
              <p className="mt-2 text-sm text-gray-600">Choose the active school. The selection is stored in <span className="font-mono">{activeSchoolCookieName()}</span>.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" action={setActiveSchool}>
                <Select name="schoolId" defaultValue={schoolId}>
                  {schools.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
                <input type="hidden" name="redirectTo" value="/settings" />
                <Button variant="secondary" type="submit">Switch context</Button>
              </form>
              <form className="space-y-3 border-t border-[var(--border)] pt-4" action={createSchool}>
                <Input name="name" placeholder="New school name" />
                <Input name="city" placeholder="City" />
                <Input name="timezone" defaultValue="Asia/Jakarta" placeholder="Timezone" />
                <Button variant="primary" type="submit">Create school</Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader><CardTitle>School profile 2.0</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" action={updateSchool}>
              <div className="grid gap-3 md:grid-cols-2">
                <Input name="name" defaultValue={school.name} placeholder="School name" disabled={!canAdmin} />
                <Input name="city" defaultValue={school.city} placeholder="City" disabled={!canAdmin} />
                <Input name="region" defaultValue={(school as any).region ?? ""} placeholder="Region" disabled={!canAdmin} />
                <Input name="timezone" defaultValue={school.timezone} placeholder="Timezone" disabled={!canAdmin} />
                <Input name="curriculum" defaultValue={school.curriculum ?? ""} placeholder="Curriculum" disabled={!canAdmin} />
                <Input name="curriculumNotes" defaultValue={(school as any).curriculumNotes ?? ""} placeholder="Curriculum notes" disabled={!canAdmin} />
                <Input name="studentCount" defaultValue={school.studentCount ?? ""} placeholder="Student count" disabled={!canAdmin} />
                <Input name="enrollment" defaultValue={(school as any).enrollment ?? ""} placeholder="Enrollment" disabled={!canAdmin} />
                <Input name="staffCount" defaultValue={(school as any).staffCount ?? ""} placeholder="Staff count" disabled={!canAdmin} />
                <Input name="deviceRatio" defaultValue={(school as any).deviceRatio ?? ""} placeholder="Device ratio" disabled={!canAdmin} />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Select name="type" defaultValue={school.type ?? ""} disabled={!canAdmin}>
                  <option value="">School type</option>
                  <option value="PUBLIC">PUBLIC</option>
                  <option value="PRIVATE">PRIVATE</option>
                  <option value="INTERNATIONAL">INTERNATIONAL</option>
                  <option value="HYBRID">HYBRID</option>
                </Select>
                <Select name="deviceModel" defaultValue={school.deviceModel ?? ""} disabled={!canAdmin}>
                  <option value="">Device model</option>
                  <option value="ONE_TO_ONE">ONE_TO_ONE</option>
                  <option value="SHARED">SHARED</option>
                  <option value="LAB_ONLY">LAB_ONLY</option>
                  <option value="BYOD">BYOD</option>
                </Select>
                <Select name="connectivity" defaultValue={school.connectivity ?? ""} disabled={!canAdmin}>
                  <option value="">Connectivity</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </Select>
                <Select name="ecosystem" defaultValue={school.ecosystem ?? ""} disabled={!canAdmin}>
                  <option value="">Ecosystem</option>
                  <option value="GOOGLE">GOOGLE</option>
                  <option value="MICROSOFT">MICROSOFT</option>
                  <option value="MIXED">MIXED</option>
                </Select>
                <Select name="budgetSensitivity" defaultValue={(school as any).budgetSensitivity ?? ""} disabled={!canAdmin}>
                  <option value="">Budget sensitivity</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="PREMIUM">PREMIUM</option>
                </Select>
                <div className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-gray-700">
                  Stage: <span className="font-medium text-gray-900">{school.transformationStage}</span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Grade bands</label>
                <Input name="gradeBandsText" defaultValue={gradeBands.join(", ")} placeholder="MIDDLE, HIGH" disabled={!canAdmin} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Priority outcomes</label>
                <Textarea name="priorityOutcomesText" defaultValue={priorityOutcomes.join("\n")} disabled={!canAdmin} placeholder="One per line" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Current tooling</label>
                <Textarea name="currentToolingText" defaultValue={currentTooling.join("\n")} disabled={!canAdmin} placeholder="One per line" />
              </div>
              <Textarea name="constraints" defaultValue={school.constraints ?? ""} disabled={!canAdmin} placeholder="Constraints" />
              <Textarea name="nonNegotiables" defaultValue={(school as any).nonNegotiables ?? ""} disabled={!canAdmin} placeholder="Non-negotiables" />
              <Textarea name="aiAdoptionGoal" defaultValue={(school as any).aiAdoptionGoal ?? ""} disabled={!canAdmin} placeholder="AI adoption goal" />
              <Textarea name="individualizedLearningGoal" defaultValue={(school as any).individualizedLearningGoal ?? ""} disabled={!canAdmin} placeholder="Individualized learning goal" />
              <Textarea name="projectBasedLearningGoal" defaultValue={(school as any).projectBasedLearningGoal ?? ""} disabled={!canAdmin} placeholder="Projects goal" />
              <Textarea name="selGoal" defaultValue={(school as any).selGoal ?? ""} disabled={!canAdmin} placeholder="SEL goal" />
              <Textarea name="school2Vision" defaultValue={(school as any).school2Vision ?? ""} disabled={!canAdmin} placeholder="School 2.0 vision" />
              <Button variant="primary" type="submit" disabled={!canAdmin}>Save school profile</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Invite users</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" action={createInvite}>
                <Input name="email" placeholder="name@school.id" disabled={!canAdmin} />
                <Select name="role" defaultValue="STAFF" disabled={!canAdmin}>
                  <option value="ADMIN">ADMIN</option>
                  <option value="STAFF">STAFF</option>
                  <option value="IT">IT</option>
                  <option value="COACH">COACH</option>
                  <option value="TEACHER">TEACHER</option>
                </Select>
                <Button variant="secondary" type="submit" disabled={!canAdmin}>Create invite</Button>
              </form>
              <div className="space-y-2 text-sm text-gray-600">
                {invites.map((invite) => (
                  <div key={invite.id} className="rounded-md border border-[var(--border)] px-3 py-2">
                    <div className="font-medium text-gray-900">{invite.email}</div>
                    <div>{invite.role} • expires {formatDateTime(new Date(invite.expiresAt))}</div>
                  </div>
                ))}
                {!invites.length ? <div>No pending invites.</div> : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Users</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="rounded-lg border border-[var(--border)] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={user.active ? "success" : "warning"}>{roleLabel(user.role)}</Badge>
                      <form action={setUserRole}>
                        <input type="hidden" name="userId" value={user.id} />
                        <select name="role" defaultValue={user.role} className="rounded-md border border-[var(--border)] px-2 py-1 text-sm" disabled={!canAdmin}>
                          <option value="ADMIN">ADMIN</option>
                          <option value="STAFF">STAFF</option>
                          <option value="IT">IT</option>
                          <option value="COACH">COACH</option>
                          <option value="TEACHER">TEACHER</option>
                        </select>
                        <Button className="ml-2" variant="ghost" type="submit" disabled={!canAdmin}>Save</Button>
                      </form>
                      <form action={setUserActive}>
                        <input type="hidden" name="userId" value={user.id} />
                        <input type="hidden" name="active" value={user.active ? "false" : "true"} />
                        <Button variant="ghost" type="submit" disabled={!canAdmin}>{user.active ? "Deactivate" : "Activate"}</Button>
                      </form>
                      <form action={deleteUser}>
                        <input type="hidden" name="userId" value={user.id} />
                        <Button variant="danger" type="submit" disabled={!canAdmin}>Delete</Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
