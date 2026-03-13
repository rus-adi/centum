import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PrintButton } from "@/components/transformation/print-button";
import { requireActiveSchool } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

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

export default async function TransformationReportPage() {
  const { schoolId, school } = await requireActiveSchool();
  const run = await db.copilotRun.findFirst({ where: { schoolId }, orderBy: { createdAt: "desc" } });

  return (
    <PageShell
      title="Executive Report"
      description="Leadership-ready summary of readiness, blockers, next actions, and the draft 30 / 60 / 90 day transformation plan."
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
                <Badge variant="info">{school.transformationStage}</Badge>
                <Badge variant={school.readinessScore >= 70 ? "success" : school.readinessScore >= 45 ? "warning" : "danger"}>
                  Readiness {school.readinessScore}
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
      </div>
    </PageShell>
  );
}
