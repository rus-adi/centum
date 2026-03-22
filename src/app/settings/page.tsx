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
import { roleLabel } from "@/lib/session";
import { formatDateTime } from "@/lib/format";
import { canManageSchoolProfile, canManageUsers } from "@/lib/permissions";
import { formatEnumLabel } from "@/lib/school2/helpers";

export default async function SettingsPage() {
  const { session, schoolId, school, isSuperAdmin } = await requireActiveSchool();
  const canAdmin = canManageSchoolProfile(session.user.role);
  const canManagePeople = canManageUsers(session.user.role);

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
      <div className="section-grid md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Account</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="panel-note">
              <div className="text-gray-500">Signed in as</div>
              <div className="font-medium text-gray-900">{session.user.email}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              <p className="mt-2 text-sm leading-6 text-gray-600">Choose the active school. The selection is stored in <span className="break-all font-mono">{activeSchoolCookieName()}</span>.</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <form className="space-y-3" action={setActiveSchool}>
                <div className="field-stack">
                  <label className="field-label" htmlFor="active-school-id">Active school</label>
                  <Select id="active-school-id" name="schoolId" defaultValue={schoolId}>
                    {schools.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </Select>
                </div>
                <input type="hidden" name="redirectTo" value="/settings" />
                <Button variant="secondary" type="submit">Switch context</Button>
              </form>
              <form className="space-y-3 border-t border-[var(--border)] pt-4" action={createSchool}>
                <div className="field-stack">
                  <label className="field-label" htmlFor="new-school-name">School name</label>
                  <Input id="new-school-name" name="name" placeholder="New school name" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="field-stack">
                    <label className="field-label" htmlFor="new-school-city">City</label>
                    <Input id="new-school-city" name="city" placeholder="City" />
                  </div>
                  <div className="field-stack">
                    <label className="field-label" htmlFor="new-school-timezone">Timezone</label>
                    <Input id="new-school-timezone" name="timezone" defaultValue="Asia/Jakarta" placeholder="Timezone" />
                  </div>
                </div>
                <Button variant="primary" type="submit">Create school</Button>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {!canAdmin ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-sm text-gray-600">
            Admin controls are hidden for your role. You can review the current school profile below, while leadership manages invites, user roles, and school edits.
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr),minmax(320px,0.9fr)] lg:gap-6">
        <Card>
          <CardHeader><CardTitle>{canAdmin ? "School profile 2.0" : "School profile snapshot"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {canAdmin ? (
              <form className="space-y-4" action={updateSchool}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input name="name" defaultValue={school.name} placeholder="School name" />
                  <Input name="city" defaultValue={school.city} placeholder="City" />
                  <Input name="region" defaultValue={(school as any).region ?? ""} placeholder="Region" />
                  <Input name="timezone" defaultValue={school.timezone} placeholder="Timezone" />
                  <Input name="curriculum" defaultValue={school.curriculum ?? ""} placeholder="Curriculum" />
                  <Input name="curriculumNotes" defaultValue={(school as any).curriculumNotes ?? ""} placeholder="Curriculum notes" />
                  <Input name="studentCount" defaultValue={school.studentCount ?? ""} placeholder="Student count" />
                  <Input name="enrollment" defaultValue={(school as any).enrollment ?? ""} placeholder="Enrollment" />
                  <Input name="staffCount" defaultValue={(school as any).staffCount ?? ""} placeholder="Staff count" />
                  <Input name="deviceRatio" defaultValue={(school as any).deviceRatio ?? ""} placeholder="Device ratio" />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Select name="type" defaultValue={school.type ?? ""}>
                    <option value="">School type</option>
                    <option value="PUBLIC">PUBLIC</option>
                    <option value="PRIVATE">PRIVATE</option>
                    <option value="INTERNATIONAL">INTERNATIONAL</option>
                    <option value="HYBRID">HYBRID</option>
                  </Select>
                  <Select name="deviceModel" defaultValue={school.deviceModel ?? ""}>
                    <option value="">Device model</option>
                    <option value="ONE_TO_ONE">ONE_TO_ONE</option>
                    <option value="SHARED">SHARED</option>
                    <option value="LAB_ONLY">LAB_ONLY</option>
                    <option value="BYOD">BYOD</option>
                  </Select>
                  <Select name="connectivity" defaultValue={school.connectivity ?? ""}>
                    <option value="">Connectivity</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </Select>
                  <Select name="ecosystem" defaultValue={school.ecosystem ?? ""}>
                    <option value="">Ecosystem</option>
                    <option value="GOOGLE">GOOGLE</option>
                    <option value="MICROSOFT">MICROSOFT</option>
                    <option value="MIXED">MIXED</option>
                  </Select>
                  <Select name="budgetSensitivity" defaultValue={(school as any).budgetSensitivity ?? ""}>
                    <option value="">Budget sensitivity</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="PREMIUM">PREMIUM</option>
                  </Select>
                  <div className="flex items-center rounded-xl border border-[var(--border)] bg-[var(--soft)] px-3.5 py-3 text-sm text-gray-700">
                    Stage: <span className="font-medium text-gray-900">{formatEnumLabel(school.transformationStage)}</span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Grade bands</label>
                  <Input name="gradeBandsText" defaultValue={gradeBands.join(", ")} placeholder="MIDDLE, HIGH" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Priority outcomes</label>
                  <Textarea name="priorityOutcomesText" defaultValue={priorityOutcomes.join("\n")} placeholder="One per line" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Current tooling</label>
                  <Textarea name="currentToolingText" defaultValue={currentTooling.join("\n")} placeholder="One per line" />
                </div>
                <div className="field-stack">
                  <label className="field-label" htmlFor="constraints">Constraints</label>
                  <Textarea id="constraints" name="constraints" defaultValue={school.constraints ?? ""} placeholder="Constraints" />
                </div>
                <div className="field-stack">
                  <label className="field-label" htmlFor="non-negotiables">Non-negotiables</label>
                  <Textarea id="non-negotiables" name="nonNegotiables" defaultValue={(school as any).nonNegotiables ?? ""} placeholder="Non-negotiables" />
                </div>
                <div className="field-stack">
                  <label className="field-label" htmlFor="ai-adoption-goal">AI adoption goal</label>
                  <Textarea id="ai-adoption-goal" name="aiAdoptionGoal" defaultValue={(school as any).aiAdoptionGoal ?? ""} placeholder="AI adoption goal" />
                </div>
                <div className="field-stack">
                  <label className="field-label" htmlFor="individualized-learning-goal">Individualized learning goal</label>
                  <Textarea id="individualized-learning-goal" name="individualizedLearningGoal" defaultValue={(school as any).individualizedLearningGoal ?? ""} placeholder="Individualized learning goal" />
                </div>
                <div className="field-stack">
                  <label className="field-label" htmlFor="project-goal">Project-based learning goal</label>
                  <Textarea id="project-goal" name="projectBasedLearningGoal" defaultValue={(school as any).projectBasedLearningGoal ?? ""} placeholder="Projects goal" />
                </div>
                <div className="field-stack">
                  <label className="field-label" htmlFor="sel-goal">SEL goal</label>
                  <Textarea id="sel-goal" name="selGoal" defaultValue={(school as any).selGoal ?? ""} placeholder="SEL goal" />
                </div>
                <div className="field-stack">
                  <label className="field-label" htmlFor="school-vision">School 2.0 vision</label>
                  <Textarea id="school-vision" name="school2Vision" defaultValue={(school as any).school2Vision ?? ""} placeholder="School 2.0 vision" />
                </div>
                <Button variant="primary" type="submit">Save school profile</Button>
              </form>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="panel-note"><span className="font-medium text-gray-900">{school.name}</span> • {school.city}{(school as any).region ? `, ${(school as any).region}` : ""}</div>
                <div className="panel-note">Stage: {formatEnumLabel(school.transformationStage)}</div>
                <div className="panel-note">Curriculum: {school.curriculum ?? "Not set"}</div>
                <div className="panel-note">Enrollment: {(school as any).enrollment ?? school.studentCount ?? "Not set"}</div>
                <div className="panel-note">Staff count: {(school as any).staffCount ?? "Not set"}</div>
                <div className="panel-note">Priority outcomes: {priorityOutcomes.length ? priorityOutcomes.join(", ") : "Not documented yet"}</div>
                <div className="panel-note">Vision: {(school as any).school2Vision ?? "No School 2.0 vision saved yet."}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {canManagePeople ? (
            <Card>
              <CardHeader><CardTitle>Invite users</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <form className="space-y-3" action={createInvite}>
                  <div className="field-stack">
                    <label className="field-label" htmlFor="invite-email">Email</label>
                    <Input id="invite-email" name="email" placeholder="name@school.id" />
                  </div>
                  <div className="field-stack">
                    <label className="field-label" htmlFor="invite-role">Role</label>
                    <Select id="invite-role" name="role" defaultValue="STAFF">
                      <option value="ADMIN">ADMIN</option>
                      <option value="STAFF">STAFF</option>
                      <option value="IT">IT</option>
                      <option value="COACH">COACH</option>
                      <option value="TEACHER">TEACHER</option>
                    </Select>
                  </div>
                  <Button variant="secondary" type="submit">Create invite</Button>
                </form>
                <div className="space-y-2 text-sm text-gray-600">
                  {invites.map((invite) => (
                    <div key={invite.id} className="rounded-xl border border-[var(--border)] bg-[var(--soft)]/85 px-3.5 py-3">
                      <div className="font-medium text-gray-900">{invite.email}</div>
                      <div className="mt-1 leading-6">{invite.role} • expires {formatDateTime(new Date(invite.expiresAt))}</div>
                    </div>
                  ))}
                  {!invites.length ? <div>No pending invites.</div> : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {canManagePeople ? (
            <Card>
              <CardHeader><CardTitle>Users</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="rounded-2xl border border-[var(--border)] bg-[var(--soft)]/65 p-4">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={user.active ? "success" : "warning"}>{roleLabel(user.role)}</Badge>
                        <form action={setUserRole} className="flex flex-wrap items-center gap-2">
                          <input type="hidden" name="userId" value={user.id} />
                          <select name="role" defaultValue={user.role} className="h-10 rounded-xl border border-[var(--border)] bg-white px-3 text-sm text-gray-900 shadow-sm">
                            <option value="ADMIN">ADMIN</option>
                            <option value="STAFF">STAFF</option>
                            <option value="IT">IT</option>
                            <option value="COACH">COACH</option>
                            <option value="TEACHER">TEACHER</option>
                          </select>
                          <Button variant="ghost" type="submit">Save</Button>
                        </form>
                        <form action={setUserActive}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input type="hidden" name="active" value={user.active ? "false" : "true"} />
                          <Button variant="ghost" type="submit">{user.active ? "Deactivate" : "Activate"}</Button>
                        </form>
                        <form action={deleteUser}>
                          <input type="hidden" name="userId" value={user.id} />
                          <Button variant="danger" type="submit">Delete</Button>
                        </form>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
