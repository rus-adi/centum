import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/transformation/print-button";
import { requireActiveSchool } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { formatEnumLabel, toPlainArray } from "@/lib/school2/helpers";

const db = prisma as any;

function renderPlan(items: unknown) {
  if (!Array.isArray(items) || !items.length) return <div className="text-sm text-gray-600">No plan generated yet.</div>;
  return (
    <ol className="space-y-2 text-sm text-gray-700">
      {items.map((item, index) => (
        <li key={`${index}-${String(item)}`} className="rounded-md border border-[var(--border)] bg-slate-50 px-3 py-2">
          {index + 1}. {String(item)}
        </li>
      ))}
    </ol>
  );
}

function renderTags(items: unknown) {
  const values = toPlainArray(items);
  if (!values.length) return <div className="text-sm text-gray-600">No linked items yet.</div>;
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => <Badge key={item}>{item}</Badge>)}
    </div>
  );
}

function renderBulletCards(items: unknown, variant: "warning" | "info") {
  if (!Array.isArray(items) || !items.length) return <div className="text-sm text-gray-600">Nothing recorded yet.</div>;
  const tone = variant === "warning"
    ? "rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
    : "rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800";
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`${variant}-${index}-${String(item)}`} className={tone}>{String(item)}</div>
      ))}
    </div>
  );
}

export default async function TransformationReportPage() {
  const { schoolId, school } = await requireActiveSchool();
  const run = await db.copilotRun.findFirst({
    where: { schoolId },
    orderBy: { createdAt: "desc" },
    include: { recommendations: true }
  });

  const accepted = run?.recommendations?.filter((item: any) => item.status === "ACCEPTED") ?? [];
  const deferred = run?.recommendations?.filter((item: any) => item.status === "DEFERRED") ?? [];
  const pending = run?.recommendations?.filter((item: any) => item.status === "PENDING") ?? [];

  return (
    <PageShell
      title="Executive Report"
      description="Leadership-ready summary of readiness, blockers, next actions, recommendation status, and the draft 30 / 60 / 90 day transformation plan."
    >
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>

      <div className="mt-4 grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>{school.name}</CardTitle>
                <div className="mt-2 text-sm text-gray-600">Centum Stack • School 2.0 executive report</div>
              </div>
              <div className="flex gap-2">
                <Badge variant="info">{formatEnumLabel(school.transformationStage)}</Badge>
                <Badge variant={school.readinessScore >= 70 ? "success" : school.readinessScore >= 45 ? "warning" : "danger"}>
                  Readiness {run?.readinessScore ?? school.readinessScore}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-6 text-gray-700">
            <div>
              <div className="font-semibold text-gray-900">Executive summary</div>
              <p className="mt-2 whitespace-pre-line">{run?.executiveSummary ?? "Generate a copilot run to create the first executive summary."}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="font-semibold text-gray-900">Readiness score</div>
                <div className="mt-2 text-3xl font-semibold text-gray-900">{run?.readinessScore ?? school.readinessScore}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Maturity score</div>
                <div className="mt-2 text-3xl font-semibold text-gray-900">{run?.maturityScore ?? school.maturityScore}</div>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <div className="font-semibold text-gray-900">Recommended bundles</div>
                <div className="mt-2">{renderTags(run?.recommendedBundleKeys)}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Recommended packs</div>
                <div className="mt-2">{renderTags(run?.recommendedPackKeys)}</div>
              </div>
              <div>
                <div className="font-semibold text-gray-900">Suggested training</div>
                <div className="mt-2">{renderTags(run?.suggestedTrainingKeys)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Major blockers</CardTitle></CardHeader>
            <CardContent>{renderBulletCards(run?.blockers, "warning")}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Immediate next actions</CardTitle></CardHeader>
            <CardContent>{renderBulletCards(run?.nextActions, "info")}</CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recommendation review status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-sm font-medium text-emerald-900">Accepted</div>
                <div className="mt-2 text-3xl font-semibold text-emerald-950">{accepted.length}</div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-medium text-amber-900">Deferred</div>
                <div className="mt-2 text-3xl font-semibold text-amber-950">{deferred.length}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-medium text-slate-800">Pending</div>
                <div className="mt-2 text-3xl font-semibold text-slate-950">{pending.length}</div>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <div className="mb-2 text-sm font-semibold text-gray-900">Accepted recommendations</div>
                <div className="space-y-2">
                  {accepted.length ? accepted.map((item: any) => (
                    <div key={item.id} className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                      <div className="font-medium">{item.title}</div>
                      <div className="mt-1 text-emerald-800/90">{item.description}</div>
                    </div>
                  )) : <div className="text-sm text-gray-600">No accepted items yet.</div>}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-gray-900">Deferred recommendations</div>
                <div className="space-y-2">
                  {deferred.length ? deferred.map((item: any) => (
                    <div key={item.id} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      <div className="font-medium">{item.title}</div>
                      <div className="mt-1 text-amber-800/90">{item.description}</div>
                    </div>
                  )) : <div className="text-sm text-gray-600">No deferred items yet.</div>}
                </div>
              </div>
              <div>
                <div className="mb-2 text-sm font-semibold text-gray-900">Pending review</div>
                <div className="space-y-2">
                  {pending.length ? pending.map((item: any) => (
                    <div key={item.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
                      <div className="font-medium">{item.title}</div>
                      <div className="mt-1 text-slate-700">{item.description}</div>
                    </div>
                  )) : <div className="text-sm text-gray-600">No pending items remain.</div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>First 30 days</CardTitle></CardHeader>
            <CardContent>{renderPlan(run?.plan30)}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Days 31–60</CardTitle></CardHeader>
            <CardContent>{renderPlan(run?.plan60)}</CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Days 61–90</CardTitle></CardHeader>
            <CardContent>{renderPlan(run?.plan90)}</CardContent>
          </Card>
        </div>

        <Card className="print:hidden">
          <CardHeader><CardTitle>Linked workspaces</CardTitle></CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/transformation">Open copilot workspace →</Link>
            <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/packs">Open recommended packs →</Link>
            <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/stacks">Open bundles →</Link>
            <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/training">Open training hub →</Link>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
