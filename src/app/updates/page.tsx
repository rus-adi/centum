import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createUpdate } from "@/app/actions/updates";
import { isAdminRole } from "@/lib/session";
import { formatDateTime } from "@/lib/format";

export default async function UpdatesPage() {
  const { session, schoolId } = await requireActiveSchool();
  const canPost = isAdminRole(session.user.role);

  const posts = await prisma.updatePost.findMany({
    where: { schoolId },
    include: { trainingModule: true },
    orderBy: { createdAt: "desc" }
  });

  const modules = await prisma.trainingModule.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <PageShell title="Updates">
      {canPost && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Post an update</CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              Optionally require training to re-certify staff on updated policy.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" action={createUpdate}>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Month</label>
                  <Input name="month" placeholder="e.g., February 2026" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                  <Input name="title" required placeholder="Update title" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Body</label>
                <Textarea name="body" required placeholder="What changed? Any action required?" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Requires training?</label>
                  <Select name="requiresTraining" defaultValue="false">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Training module</label>
                  <Select name="trainingModuleId" defaultValue="">
                    <option value="">Select module (if required)</option>
                    {modules.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title} (current v{m.currentVersion})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="primary" type="submit">
                  Post update
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle>{p.title}</CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span>{p.month}</span>
                <span className="text-gray-300">•</span>
                <span>{formatDateTime(p.createdAt)}</span>
                {p.requiresTraining && <Badge variant="danger">Training required</Badge>}
                {p.trainingModule && (
                  <Badge variant="info">
                    {p.trainingModule.title} v{p.newTrainingVersion ?? p.trainingModule.currentVersion}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm text-gray-800">{p.body}</div>
            </CardContent>
          </Card>
        ))}

        {posts.length === 0 && (
          <div className="rounded-lg border border-[var(--border)] bg-gray-50 px-4 py-3 text-sm text-gray-600">
            No updates posted yet.
          </div>
        )}
      </div>
    </PageShell>
  );
}
