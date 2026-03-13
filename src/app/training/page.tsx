import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { completeNextLesson, resetTrainingProgress } from "@/app/actions/training";

export default async function TrainingPage() {
  const { session } = await requireActiveSchool();

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

  return (
    <PageShell
      title="Training Hub"
      description="Recorded, self-serve training with transcripts, checklist-oriented delivery, attestation, and versioned completion tracking."
    >
      <div className="grid gap-4">
        {modules.map((module) => {
          const completedVersion = bestCompletion.get(module.id) ?? 0;
          const progress = bestProgress.get(`${module.id}:${module.currentVersion}`) ?? 0;
          const upToDate = completedVersion >= module.currentVersion;
          const checklist = Array.isArray(module.checklist) ? module.checklist : [];
          return (
            <Card key={module.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle>{module.title}</CardTitle>
                    <div className="mt-2 text-sm text-gray-600">{module.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={upToDate ? "success" : "warning"}>{upToDate ? "Current" : `Version ${module.currentVersion}`}</Badge>
                    {module.pillar ? <Badge variant="info">{module.pillar}</Badge> : null}
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
                  </div>
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-900">Checklist</div>
                    {checklist.length ? (
                      checklist.map((item: unknown) => (
                        <div key={String(item)} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-gray-700">{String(item)}</div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">No checklist provided yet.</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
                  <div className="text-sm text-gray-600">{progress}/{module.totalLessons} lessons completed for current version.</div>
                  <div className="flex gap-2">
                    <form action={completeNextLesson.bind(null, module.id)}>
                      <Button variant="primary" type="submit">Complete next step</Button>
                    </form>
                    <form action={resetTrainingProgress.bind(null, module.id)}>
                      <Button variant="ghost" type="submit">Reset</Button>
                    </form>
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
