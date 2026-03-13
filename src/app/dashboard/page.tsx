import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard } from "@/components/ui/metric-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { buildSchoolScorecard } from "@/lib/school2/metrics";
import { requireActiveSchool } from "@/lib/tenant";

export default async function DashboardPage() {
  const { schoolId } = await requireActiveSchool();
  const scorecard = await buildSchoolScorecard(schoolId);

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
      </div>
    </PageShell>
  );
}
