import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { OfferingCard } from "@/components/ui/offering-card";
import { buildSchoolScorecard } from "@/lib/school2/metrics";
import { getFeaturedOfferings } from "@/lib/school2/offerings";
import { requireActiveSchool } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { isTeacherLike } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";

const db = prisma as any;

function progressPercent(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export default async function DashboardPage() {
  const { schoolId, session } = await requireActiveSchool();
  const scorecard = await buildSchoolScorecard(schoolId);
  const teacherView = isTeacherLike(session.user.role) || session.user.role === "STAFF";

  if (teacherView) {
    const [students, modules, completions, progressRows, requests, recentQueries, activePacks] = await Promise.all([
      prisma.student.findMany({ where: { schoolId }, orderBy: { createdAt: "asc" }, take: 3 }),
      prisma.trainingModule.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.trainingCompletion.findMany({ where: { userId: session.user.id } }),
      prisma.trainingProgress.findMany({ where: { userId: session.user.id } }),
      prisma.request.findMany({ where: { schoolId, submittedById: session.user.id }, orderBy: { createdAt: "desc" }, take: 4 }),
      db.governanceQuery.findMany({ where: { schoolId }, orderBy: { createdAt: "desc" }, take: 3 }),
      db.schoolPackAdoption.findMany({ where: { schoolId, status: "ACTIVE" }, include: { pack: true }, orderBy: { createdAt: "desc" } })
    ]);

    const bestCompletion = new Map<string, number>();
    for (const completion of completions) {
      bestCompletion.set(completion.moduleId, Math.max(bestCompletion.get(completion.moduleId) ?? 0, completion.version));
    }

    const bestProgress = new Map<string, number>();
    for (const progress of progressRows) {
      const key = `${progress.moduleId}:${progress.version}`;
      bestProgress.set(key, Math.max(bestProgress.get(key) ?? 0, progress.lessonsCompleted));
    }

    const moduleCards = modules.map((module) => {
      const completedVersion = bestCompletion.get(module.id) ?? 0;
      const lessonsCompleted = bestProgress.get(`${module.id}:${module.currentVersion}`) ?? 0;
      const current = completedVersion >= module.currentVersion;
      return {
        id: module.id,
        title: module.title,
        description: module.description,
        lessonsCompleted,
        totalLessons: module.totalLessons,
        current
      };
    });

    const currentModules = moduleCards.filter((module) => module.current).length;
    const openRequests = requests.filter((request) => request.status !== "COMPLETED").length;
    const classroomOfferings = getFeaturedOfferings().filter((offering) =>
      [
        "resiliency_lesson_plans",
        "interactive_prompt_walkthrough",
        "ai_prompt_curriculum",
        "project_finder_ai",
        "inquiry_forge",
        "sentinel_guide_builder",
        "centum_learning_guide_builder",
        "teacher_prompt_companion",
        "student_experience_preview"
      ].includes(offering.key)
    );

    return (
      <PageShell
        title="Classroom Launchpad"
        description="Quick access to lesson plans, prompt tools, training progress, and governance support for teachers and staff."
      >
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard title="Current modules" value={`${currentModules}/${modules.length || 0}`} note="Training modules completed on the latest version." />
          <MetricCard title="Active teaching packs" value={activePacks.length} note="Pack rollouts currently active for your school." />
          <MetricCard title="Classroom offerings" value={classroomOfferings.length} note="Lesson plans, curricula, and apps ready to demo." />
          <MetricCard title="Your open requests" value={openRequests} note="Requests you have submitted that still need follow-up." />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Start here this week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                This teacher-facing path is intentionally lighter than the leadership console. It keeps the focus on training, lesson plans,
                practical prompt tools, and governance support rather than admin controls.
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/training">
                  Open training & lesson plans →
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/tools">
                  Open classroom tools →
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/governance">
                  Ask a governance question →
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/packs">
                  Review active packs →
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/guide-builder">
                  Open Guide Builder →
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/services">
                  Review Services & Apps →
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/student-preview">
                  Open student preview →
                </Link>
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">Active pack context</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activePacks.length ? (
                    activePacks.map((adoption: any) => (
                      <Badge key={adoption.id} variant="info">{adoption.pack?.name ?? "Transformation Pack"}</Badge>
                    ))
                  ) : (
                    <div className="text-sm text-gray-600">No active packs have been assigned yet.</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student experience next phase</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                The student-facing experience is planned as a separate product surface, not inside the current teacher and leadership console.
              </div>
              <div className="text-sm text-gray-600">Sample student profiles already seeded for future portal planning:</div>
              <div className="space-y-2">
                {students.length ? (
                  students.map((student) => (
                    <div key={student.id} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="mt-1 text-gray-600">
                        Grade {student.grade}
                        {student.coachName ? ` • Coach ${student.coachName}` : ""}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600">No sample student profiles seeded yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
          <Card>
            <CardHeader>
              <CardTitle>Your training progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {moduleCards.length ? (
                moduleCards.slice(0, 4).map((module) => (
                  <div key={module.id} className="rounded-lg border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-medium text-gray-900">{module.title}</div>
                        <div className="mt-1 text-sm text-gray-600">{module.description}</div>
                      </div>
                      <Badge variant={module.current ? "success" : "warning"}>{module.current ? "Current" : "In progress"}</Badge>
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={progressPercent(module.lessonsCompleted, module.totalLessons)} label={`${module.lessonsCompleted}/${module.totalLessons} lessons complete`} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">No training modules linked yet.</div>
              )}
              <Link className="inline-flex rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/training">
                Open full training hub →
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governance & support pulse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                Teachers can review recent governance answers and ask policy questions without seeing leadership-only upload and approval controls.
              </div>
              {recentQueries.length ? (
                recentQueries.map((query: any) => (
                  <div key={query.id} className="rounded-lg border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="font-medium text-gray-900">{query.question}</div>
                      <Badge variant={query.lowConfidence ? "warning" : "success"}>{query.confidence}% confidence</Badge>
                    </div>
                    <div className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{query.answer}</div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>{formatDateTime(new Date(query.createdAt))}</span>
                      <Link className="font-medium text-blue-700 hover:underline" href={`/governance?query=${query.id}`}>
                        Open answer →
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">No governance questions have been asked yet.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Teacher-ready linked offerings</div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classroomOfferings.map((offering) => (
              <OfferingCard
                key={offering.key}
                title={offering.title}
                description={offering.description}
                href={offering.href}
                badge={offering.badge}
                iconKey={offering.iconKey}
                audience={offering.audience}
                note={offering.note}
                cta={offering.cta}
              />
            ))}
          </div>
        </div>
      </PageShell>
    );
  }

  const students = await prisma.student.findMany({ where: { schoolId }, orderBy: { createdAt: "asc" }, take: 3 });
  const featured = getFeaturedOfferings().filter((offering) =>
    [
      "resiliency_lesson_plans",
      "project_finder_ai",
      "sentinel_guide_builder",
"leadership_governance_assistant",
      "centum_learning_guide_builder",
      "empathy_leadership_platform",
      "hr_dashboard_suite",
      "student_experience_preview",
      "gemini_access"
    ].includes(offering.key)
  );

  return (
    <PageShell
      title="Readiness & ROI"
      description="Track measurable progress across governance, training, approvals, and School 2.0 rollout."
    >
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Readiness score" value={`${scorecard.readinessScore}/100`} note="Operational readiness for the next rollout step." />
        <MetricCard title="Maturity score" value={`${scorecard.maturityScore}/100`} note="School 2.0 maturity across leadership, governance, and enablement." />
        <MetricCard title="Enabled tools" value={scorecard.enabledTools} note="Tools currently active for this school." />
        <MetricCard
          title="Open blockers"
          value={scorecard.blockers.length}
          note="Issues slowing progress right now."
          badge={scorecard.blockers.length ? { label: "Needs review", variant: "warning" } : { label: "Clear", variant: "success" }}
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Transformation scorecard</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <ProgressBar value={scorecard.readinessScore} label="Readiness" />
            <ProgressBar value={scorecard.maturityScore} label="Maturity" />
            <ProgressBar value={scorecard.trainingCompletionRate} label="Training completion rate" />

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
                <div className="text-sm font-medium text-gray-700">Implementation gates</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">
                  {scorecard.completedGates}/{scorecard.totalGates}
                </div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
                <div className="text-sm font-medium text-gray-700">Governance coverage</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{scorecard.governanceCoverage}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
                <div className="text-sm font-medium text-gray-700">Open requests</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{scorecard.openRequests}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
                <div className="text-sm font-medium text-gray-700">Unresolved tickets</div>
                <div className="mt-2 text-2xl font-semibold text-gray-900">{scorecard.unresolvedTickets}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>What leadership should review next</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {scorecard.blockers.length ? (
                scorecard.blockers.map((blocker) => (
                  <div key={blocker} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {blocker}
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  No major blockers are currently flagged.
                </div>
              )}

              <div className="pt-3 text-sm text-gray-600">
                Priority outcomes:
                <div className="mt-2 flex flex-wrap gap-2">
                  {scorecard.priorityOutcomes.length ? (
                    scorecard.priorityOutcomes.map((item) => <Badge key={item} variant="info">{item}</Badge>)
                  ) : (
                    <Badge>No outcomes documented yet</Badge>
                  )}
                </div>
              </div>

              <div className="grid gap-2 pt-4">
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/transformation">
                  Open Transformation Copilot →
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/governance">
                  Review Governance & Support →
                </Link>
                <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/transformation/report">
                  Open executive report →
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student experience preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                The student-facing experience is planned as a separate product surface, not inside the current leadership console.
              </div>
              <div className="text-sm text-gray-600">Suggested starter profiles for the future student portal:</div>
              <div className="space-y-2">
                {students.length ? (
                  students.map((student) => (
                    <div key={student.id} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-gray-700">
                      <div className="font-medium text-gray-900">{student.name}</div>
                      <div className="mt-1 text-gray-600">Grade {student.grade}{student.coachName ? ` • Coach ${student.coachName}` : ""}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-600">No sample student profiles seeded yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Featured linked offerings</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((offering) => (
            <OfferingCard
              key={offering.key}
              title={offering.title}
              description={offering.description}
              href={offering.href}
              badge={offering.badge}
              iconKey={offering.iconKey}
              audience={offering.audience}
              note={offering.note}
              cta={offering.cta}
            />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
