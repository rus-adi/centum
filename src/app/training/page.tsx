import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfferingCard } from "@/components/ui/offering-card";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { completeNextLesson, resetTrainingProgress } from "@/app/actions/training";
import { getFeaturedOfferings } from "@/lib/school2/offerings";
import { canResetTraining } from "@/lib/permissions";
import { formatEnumLabel, toPlainArray } from "@/lib/school2/helpers";

export default async function TrainingPage() {
  const { session } = await requireActiveSchool();
  const canReset = canResetTraining(session.user.role);

  const [modules, completions, progressRows] = await Promise.all([
    prisma.trainingModule.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.trainingCompletion.findMany({ where: { userId: session.user.id } }),
    prisma.trainingProgress.findMany({ where: { userId: session.user.id } })
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

  const featuredLearningAssets = getFeaturedOfferings({ groups: ["LESSON_PLAN", "CURRICULUM"] });
  const guideBuilderOffering = getFeaturedOfferings().find((item) => item.key === "centum_learning_guide_builder");

  return (
    <PageShell
      title="Training Hub"
      description="Recorded, self-serve training with transcripts, checklist-oriented delivery, attestation, versioned completion tracking, and quick links to packaged lesson-plan assets."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {featuredLearningAssets.map((asset) => (
          <OfferingCard
            key={asset.key}
            title={asset.title}
            description={asset.description}
            href={asset.href}
            badge={asset.badge}
            iconKey={asset.iconKey}
            audience={asset.audience}
            note={asset.note}
            cta={asset.cta}
          />
        ))}
      </div>

      {guideBuilderOffering ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Built-in prompt support</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
            <div>
              The Centum Learning Guide Builder is built directly into this project, so teachers and students can generate structured Gemini-ready prompts without leaving the platform.
            </div>
            <a className="rounded-md border border-[var(--border)] px-3 py-2 font-medium text-gray-900 hover:bg-gray-50" href="/guide-builder">
              Open Guide Builder →
            </a>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Need to preview the future learner flow?</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <div>
            The current training surface is teacher-first. A separate student-facing portal is planned as a next-phase experience, and the preview route keeps that story separate for investor demos.
          </div>
          <a className="rounded-md border border-[var(--border)] px-3 py-2 font-medium text-gray-900 hover:bg-gray-50" href="/student-preview">
            Open student preview →
          </a>
        </CardContent>
      </Card>

      {!canReset ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-sm text-gray-600">
            Reset controls are hidden for your role so teacher demos stay focused on progress, lesson plans, and practical training assets.
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4">
        {modules.map((module) => {
          const completedVersion = bestCompletion.get(module.id) ?? 0;
          const progress = bestProgress.get(`${module.id}:${module.currentVersion}`) ?? 0;
          const upToDate = completedVersion >= module.currentVersion;
          const checklist = Array.isArray(module.checklist) ? module.checklist : [];
          const quizItems = Array.isArray(module.quiz) ? module.quiz : [];
          const requiredRoles = toPlainArray(module.requiredRoles);
          return (
            <Card key={module.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{module.title}</CardTitle>
                    <div className="mt-2 text-sm text-gray-600">{module.description}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={upToDate ? "success" : "warning"}>{upToDate ? "Current" : `Version ${module.currentVersion}`}</Badge>
                    {module.pillar ? <Badge variant="info">{formatEnumLabel(module.pillar)}</Badge> : null}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
                  <div className="space-y-3">
                    {module.videoUrl ? (
                      <a className="text-sm font-medium text-blue-700 hover:underline" href={module.videoUrl} target="_blank" rel="noreferrer">
                        Open recorded training →
                      </a>
                    ) : null}
                    {module.transcript ? (
                      <div className="rounded-md border border-[var(--border)] bg-slate-50 p-3 text-sm text-gray-700">{module.transcript}</div>
                    ) : null}
                    {module.attestationText ? (
                      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                        Attestation: {module.attestationText}
                      </div>
                    ) : null}
                    {requiredRoles.length ? (
                      <div className="text-xs uppercase tracking-wide text-gray-500">Recommended roles: {requiredRoles.map(formatEnumLabel).join(", ")}</div>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">Checklist</div>
                      <div className="mt-2 space-y-2">
                        {checklist.length ? (
                          checklist.map((item: unknown) => (
                            <div key={String(item)} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-gray-700">{String(item)}</div>
                          ))
                        ) : (
                          <div className="text-sm text-gray-600">No checklist provided yet.</div>
                        )}
                      </div>
                    </div>
                    {quizItems.length ? (
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Quick quiz / check for understanding</div>
                        <div className="mt-2 space-y-2">
                          {quizItems.map((item: unknown, index: number) => (
                            <div key={`${module.id}-quiz-${index}`} className="rounded-md border border-[var(--border)] bg-slate-50 px-3 py-2 text-sm text-gray-700">
                              {typeof item === "string" ? item : JSON.stringify(item)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                  <div className="text-sm text-gray-600">{progress}/{module.totalLessons} lessons completed for current version.</div>
                  <div className="flex gap-2">
                    <form action={completeNextLesson.bind(null, module.id)}>
                      <Button variant="primary" type="submit">Complete next step</Button>
                    </form>
                    {canReset ? (
                      <form action={resetTrainingProgress.bind(null, module.id)}>
                        <Button variant="ghost" type="submit">Reset</Button>
                      </form>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
