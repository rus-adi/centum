import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { setPackStatus } from "@/app/actions/packs";

const db = prisma as any;

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export default async function PackDetailPage({ params }: { params: { slug: string } }) {
  const { schoolId } = await requireActiveSchool();
  const pack = await db.transformationPack.findUnique({ where: { slug: params.slug } });
  if (!pack) notFound();

  const adoption = await db.schoolPackAdoption.findFirst({ where: { schoolId, packId: pack.id } });
  const modules = await db.trainingModule.findMany({ where: { key: { in: arrayValue(pack.suggestedTrainingKeys) } } });

  return (
    <PageShell title={pack.name} description="Implementation pack detail for leadership review and staged execution.">
      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>{pack.name}</CardTitle>
              <Badge variant={adoption?.status === "ACTIVE" ? "success" : adoption?.status === "DEFERRED" ? "warning" : "info"}>
                {adoption?.status ?? "RECOMMENDED"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700">
            <p>{pack.overview}</p>
            <div>
              <div className="font-semibold text-gray-900">Readiness checklist</div>
              <ul className="mt-2 space-y-2">
                {arrayValue(pack.readinessChecklist).map((item: unknown) => (
                  <li key={String(item)} className="rounded-md border border-[var(--border)] bg-slate-50 px-3 py-2">{String(item)}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Implementation milestones</div>
              <ul className="mt-2 space-y-2">
                {arrayValue(pack.implementationMilestones).map((item: unknown) => (
                  <li key={String(item)} className="rounded-md border border-[var(--border)] bg-slate-50 px-3 py-2">{String(item)}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Leadership next steps</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-gray-700">
              {arrayValue(pack.nextActions).map((item: unknown) => (
                <div key={String(item)} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">{String(item)}</div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Suggested training</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {modules.length ? (
                modules.map((module: any) => (
                  <div key={module.id} className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-gray-700">
                    <div className="font-medium text-gray-900">{module.title}</div>
                    <div className="mt-1 text-gray-600">{module.description}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">No linked modules yet.</div>
              )}
              <form action={setPackStatus} className="pt-3">
                <input type="hidden" name="packId" value={pack.id} />
                <input type="hidden" name="status" value={adoption?.status === "ACTIVE" ? "DEFERRED" : "ACTIVE"} />
                <Button variant="primary" type="submit">{adoption?.status === "ACTIVE" ? "Defer pack" : "Activate pack"}</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
