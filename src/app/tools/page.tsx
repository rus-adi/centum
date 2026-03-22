import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfferingCard } from "@/components/ui/offering-card";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { filterToolCatalog } from "@/lib/school2/catalog";
import { getFeaturedOfferings } from "@/lib/school2/offerings";
import { directToggleSchoolTool, requestSchoolToolChange, setToolRecommendationStatus } from "@/app/actions/tools";
import { canManageToolRecommendations, isAdminLike } from "@/lib/permissions";
import { formatEnumLabel } from "@/lib/school2/helpers";

const db = prisma as any;

function Section({
  title,
  tools,
  canDirectManage,
  canManageRecommendations
}: {
  title: string;
  tools: any[];
  canDirectManage: boolean;
  canManageRecommendations: boolean;
}) {
  if (!tools.length) return null;
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {tools.map((tool) => {
          const requirements = Array.isArray(tool.requirements) ? tool.requirements : [];
          return (
            <div key={tool.id} className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-gray-900">{tool.name}</div>
                    <Badge variant="info">{formatEnumLabel(tool.visibility)}</Badge>
                    <Badge variant={tool.costTier === "PREMIUM" || tool.costTier === "HIGH" ? "warning" : "neutral"}>{formatEnumLabel(tool.costTier)}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">{tool.description}</div>
                  <div className="mt-2 text-xs text-gray-500">
                    {tool.category || "General"} • {formatEnumLabel(tool.maturity)} • Risk {formatEnumLabel(tool.riskLevel)}
                    {tool.providerName ? ` • ${tool.providerName}` : ""}
                  </div>
                  {tool.providerNotes ? <div className="mt-2 text-sm text-gray-600">{tool.providerNotes}</div> : null}
                  {requirements.length ? (
                    <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900">
                      Required training before enablement: {requirements.map((item: any) => item.module?.title || "Training module").join(", ")}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {canDirectManage ? (
                    <form action={directToggleSchoolTool}>
                      <input type="hidden" name="toolId" value={tool.id} />
                      <input type="hidden" name="enabled" value={tool.schoolState?.enabled ? "false" : "true"} />
                      <Button variant="secondary" type="submit">{tool.schoolState?.enabled ? "Disable" : "Enable"}</Button>
                    </form>
                  ) : (
                    <form action={requestSchoolToolChange}>
                      <input type="hidden" name="toolId" value={tool.id} />
                      <input type="hidden" name="enabled" value={tool.schoolState?.enabled ? "false" : "true"} />
                      <Button variant="secondary" type="submit">Request change</Button>
                    </form>
                  )}
                  {canManageRecommendations ? (
                    <form action={setToolRecommendationStatus}>
                      <input type="hidden" name="toolId" value={tool.id} />
                      <input type="hidden" name="status" value={tool.recommendation ? "ACCEPTED" : "PENDING"} />
                      <input type="hidden" name="reason" value="Reviewed in Tool Catalog 3.0" />
                      <Button variant="ghost" type="submit">{tool.recommendation ? "Keep recommended" : "Recommend"}</Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default async function ToolsPage() {
  const { schoolId, school, session } = await requireActiveSchool();
  const canDirectManage = isAdminLike(session.user.role) || session.user.role === "IT";
  const canManageRecommendations = canManageToolRecommendations(session.user.role);
  const [tools, schoolTools, recommendations] = await Promise.all([
    db.tool.findMany({ include: { requirements: { include: { module: true } } }, orderBy: { name: "asc" } }),
    db.schoolTool.findMany({ where: { schoolId } }),
    db.toolRecommendation.findMany({ where: { schoolId } })
  ]);

  const schoolToolMap = new Map(schoolTools.map((item: any) => [item.toolId, item]));
  const recommendationMap = new Map(recommendations.map((item: any) => [item.toolId, item]));

  const hydratedTools = tools.map((tool: any) => ({
    ...tool,
    schoolState: schoolToolMap.get(tool.id),
    recommendation: recommendationMap.get(tool.id)
  }));

  const catalog = filterToolCatalog({
    school,
    tools: hydratedTools,
    schoolTools,
    recommendations,
    canViewInternal: session.user.role === "SUPER_ADMIN"
  });

  const featuredAppsAndServices = getFeaturedOfferings({ groups: ["APP", "SERVICE"] }).filter((offering) => ["centum_learning_guide_builder", "project_finder_ai", "leadership_governance_assistant", "office_admin_ai", "hr_dashboard_suite", "google_email_foundation", "gemini_access", "sentinel_guide_builder", "empathy_leadership_platform"].includes(offering.key));

  return (
    <PageShell
      title="Tool Recommendations"
      description="Curated Tool Catalog 2.0 with internal visibility controls, school-facing recommendations, training-gated enablement, and investor-ready service packaging."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Enabled</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-gray-900">{catalog.enabled.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recommended</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-gray-900">{catalog.recommended.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Visible categories</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-gray-900">{catalog.categories.length}</div></CardContent>
        </Card>
      </div>

      <div className="mt-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Centum can package the same underlying infrastructure in different school-friendly ways. That means foundational Google email, Gemini access,
        project discovery, prompt-building services, office AI helpers, and resilience supports can be presented as distinct offers while still staying operationally lightweight.
      </div>

      <Card className="mt-6">
        <CardHeader><CardTitle>Next-phase learner portal</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
          <div>
            Student-facing apps should eventually live in a separate learner portal rather than inside the admin console. Keep using the preview route for investor demos until the standalone experience is ready.
          </div>
          <a className="rounded-md border border-[var(--border)] px-3 py-2 font-medium text-gray-900 hover:bg-gray-50" href="/student-preview">
            Open student preview →
          </a>
        </CardContent>
      </Card>

      {!canManageRecommendations ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-sm text-gray-600">
            Leadership recommendation controls are hidden for your role. You can still request changes or review what the school already has enabled.
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {featuredAppsAndServices.map((offering) => (
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

      <div className="mt-6 grid gap-4">
        <Section title="Currently enabled" tools={catalog.enabled} canDirectManage={canDirectManage} canManageRecommendations={canManageRecommendations} />
        <Section title="Recommended for this school" tools={catalog.recommended} canDirectManage={canDirectManage} canManageRecommendations={canManageRecommendations} />
        <Section title="Discover more" tools={catalog.discover} canDirectManage={canDirectManage} canManageRecommendations={canManageRecommendations} />
      </div>
    </PageShell>
  );
}
