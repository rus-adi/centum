import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireActiveSchool } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { generateCopilotRun, updateCopilotRecommendationStatus } from "@/app/actions/copilot";
import { canManagePackAdoptions } from "@/lib/permissions";
import { formatEnumLabel, toPlainArray } from "@/lib/school2/helpers";

const db = prisma as any;

function tagList(items: unknown) {
  const values = toPlainArray(items);
  if (!values.length) return <div className="text-sm text-gray-600">None linked yet.</div>;
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {values.map((item) => (
        <Badge key={item}>{item}</Badge>
      ))}
    </div>
  );
}

export default async function TransformationPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { schoolId, school, session } = await requireActiveSchool();
  const canManage = canManagePackAdoptions(session.user.role);
  const runId = typeof searchParams.run === "string" ? searchParams.run : null;

  const latestRun = runId
    ? await db.copilotRun.findFirst({ where: { id: runId, schoolId }, include: { recommendations: true } })
    : await db.copilotRun.findFirst({ where: { schoolId }, include: { recommendations: true }, orderBy: { createdAt: "desc" } });

  return (
    <PageShell
      title="Transformation Copilot"
      description="Review readiness, blockers, bundles, packs, training, and a draft 30 / 60 / 90 day plan before approving change."
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Copilot workspace</CardTitle>
              <p className="mt-2 text-sm text-gray-600">
                {latestRun ? "Latest review ready for leadership approval." : "Generate a first School 2.0 transformation review for this school."}
              </p>
            </div>
            {canManage ? (
              <form action={generateCopilotRun}>
                <Button variant="primary" type="submit">{latestRun ? "Refresh copilot" : "Generate copilot"}</Button>
              </form>
            ) : (
              <Badge variant="warning">Leadership-managed</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            {latestRun ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
                    <div className="text-sm font-medium text-gray-700">Readiness</div>
                    <div className="mt-2 text-3xl font-semibold text-gray-900">{latestRun.readinessScore}</div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
                    <div className="text-sm font-medium text-gray-700">Maturity</div>
                    <div className="mt-2 text-3xl font-semibold text-gray-900">{latestRun.maturityScore}</div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-semibold text-gray-900">Maturity summary</div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-700">{latestRun.maturitySummary}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Blockers</div>
                    <div className="mt-2 space-y-2">
                      {Array.isArray(latestRun.blockers) && latestRun.blockers.length ? (
                        latestRun.blockers.map((item: string) => (
                          <div key={item} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                            {item}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-600">No blockers recorded.</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Next actions</div>
                    <div className="mt-2 space-y-2">
                      {Array.isArray(latestRun.nextActions) && latestRun.nextActions.length ? (
                        latestRun.nextActions.map((item: string) => (
                          <div key={item} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                            {item}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-600">No next actions recorded.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Recommended bundles</div>
                    {tagList(latestRun.recommendedBundleKeys)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Recommended packs</div>
                    {tagList(latestRun.recommendedPackKeys)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Suggested training</div>
                    {tagList(latestRun.suggestedTrainingKeys)}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-[var(--border)] bg-slate-50 px-4 py-6 text-sm text-gray-600">
                No copilot run exists yet for <span className="font-medium text-gray-900">{school.name}</span>.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!canManage ? (
                <div className="rounded-md border border-[var(--border)] bg-slate-50 px-3 py-2 text-sm text-gray-600">
                  Accept/defer controls are hidden for your role. Investor teacher demos can still review the recommendation set.
                </div>
              ) : null}
              {latestRun?.recommendations?.length ? (
                latestRun.recommendations.slice(0, 8).map((recommendation: any) => (
                  <div key={recommendation.id} className="rounded-lg border border-[var(--border)] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{recommendation.title}</div>
                        <div className="mt-1 text-sm text-gray-600">{recommendation.description}</div>
                        <div className="mt-2 text-xs uppercase tracking-wide text-gray-500">{formatEnumLabel(recommendation.kind)}</div>
                      </div>
                      <Badge variant={recommendation.status === "ACCEPTED" ? "success" : recommendation.status === "DEFERRED" ? "warning" : "neutral"}>
                        {formatEnumLabel(recommendation.status)}
                      </Badge>
                    </div>
                    {canManage ? (
                      <div className="mt-3 flex gap-2">
                        <form action={updateCopilotRecommendationStatus}>
                          <input type="hidden" name="recommendationId" value={recommendation.id} />
                          <input type="hidden" name="status" value="ACCEPTED" />
                          <Button variant="secondary" type="submit">Accept</Button>
                        </form>
                        <form action={updateCopilotRecommendationStatus}>
                          <input type="hidden" name="recommendationId" value={recommendation.id} />
                          <input type="hidden" name="status" value="DEFERRED" />
                          <Button variant="ghost" type="submit">Defer</Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-600">Run the copilot to generate recommendations.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Linked workspaces</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/packs">
                Open Transformation Packs →
              </Link>
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/stacks">
                Review recommended bundles →
              </Link>
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/training">
                Review suggested training →
              </Link>
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href="/transformation/report">
                Open executive report →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
