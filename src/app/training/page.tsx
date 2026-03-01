import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { completeNextLesson, resetTrainingProgress } from "@/app/actions/training";
import { canDelete } from "@/lib/rbac";

export default async function TrainingPage() {
  const { session, schoolId } = await requireActiveSchool();
  const role = session.user.role as any;

  const modules = await prisma.trainingModule.findMany({ orderBy: { createdAt: "asc" } });

  const [progresses, completions] = await Promise.all([
    prisma.trainingProgress.findMany({ where: { userId: session.user.id } }),
    prisma.trainingCompletion.findMany({ where: { userId: session.user.id } })
  ]);

  const progMap = new Map(progresses.map((p) => [`${p.moduleId}:${p.version}`, p]));
  const completionMap = new Map(completions.map((c) => [`${c.moduleId}:${c.version}`, c]));
  const best: Record<string, number> = {};
  for (const c of completions) best[c.moduleId] = Math.max(best[c.moduleId] ?? 0, c.version);

  const canReset = canDelete(role); // reuse admin check

  return (
    <PageShell title="Training Hub">
      <div className="grid gap-4 md:grid-cols-2">
        {modules.map((m) => {
          const version = m.currentVersion;
          const progress = progMap.get(`${m.id}:${version}`);
          const completion = completionMap.get(`${m.id}:${version}`);
          const bestVersion = best[m.id] ?? 0;
          const updateRequired = bestVersion > 0 && bestVersion < version;

          const lessonsCompleted = progress?.lessonsCompleted ?? 0;
          const pct = Math.round((lessonsCompleted / m.totalLessons) * 100);

          return (
            <Card key={m.id}>
              <CardHeader>
                <CardTitle>{m.title}</CardTitle>
                <p className="mt-2 text-sm text-gray-600">{m.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="info">v{version}</Badge>
                  {completion ? <Badge variant="success">Completed</Badge> : lessonsCompleted > 0 ? <Badge variant="warning">In progress</Badge> : <Badge variant="neutral">Not started</Badge>}
                  {updateRequired && <Badge variant="danger">Update required</Badge>}
                </div>

                <div className="mt-3 text-sm text-gray-700">
                  Lessons: <span className="font-medium">{lessonsCompleted}</span> / {m.totalLessons} ({pct}%)
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {!completion && (
                    <form action={completeNextLesson.bind(null, m.id)}>
                      <Button variant="primary" type="submit">
                        Complete next lesson
                      </Button>
                    </form>
                  )}
                  {completion && (
                    <div className="text-sm text-gray-600">
                      Completed for current version.
                    </div>
                  )}
                  {canReset && lessonsCompleted > 0 && !completion && (
                    <form action={resetTrainingProgress.bind(null, m.id)}>
                      <Button type="submit">Reset</Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How “Update Required” works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              When an admin posts an update that requires training, the related module version is automatically incremented (v1 → v2).
            </p>
            <p>
              Anyone who completed an older version will see <span className="font-medium">Update required</span> until they finish the latest version.
            </p>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
