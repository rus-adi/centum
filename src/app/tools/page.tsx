import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { filterToolCatalog } from "@/lib/school2/catalog";
import { directToggleSchoolTool, requestSchoolToolChange, setToolRecommendationStatus } from "@/app/actions/tools";
import { isAdminRole } from "@/lib/session";

const db = prisma as any;

function Section({ title, tools, canDirectManage }: { title: string; tools: any[]; canDirectManage: boolean }) {
  if (!tools.length) return null;
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {tools.map((tool) => (
          <div key={tool.id} className="rounded-lg border border-[var(--border)] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-gray-900">{tool.name}</div>
                  <Badge variant="info">{tool.visibility}</Badge>
                  <Badge variant={tool.costTier === "PREMIUM" || tool.costTier === "HIGH" ? "warning" : "neutral"}>{tool.costTier}</Badge>
                </div>
                <div className="mt-2 text-sm text-gray-600">{tool.description}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {tool.category || "General"} • {tool.maturity} • Risk {tool.riskLevel}
                  {tool.providerName ? ` • ${tool.providerName}` : ""}
                </div>
                {tool.providerNotes ? <div className="mt-2 text-sm text-gray-600">{tool.providerNotes}</div> : null}
              </div>
              <div className="flex gap-2">
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
                <form action={setToolRecommendationStatus}>
                  <input type="hidden" name="toolId" value={tool.id} />
                  <input type="hidden" name="status" value={tool.recommendation ? "ACCEPTED" : "PENDING"} />
                  <input type="hidden" name="reason" value="Reviewed in Tool Catalog 2.0" />
                  <Button variant="ghost" type="submit">{tool.recommendation ? "Keep recommended" : "Recommend"}</Button>
                </form>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default async function ToolsPage() {
  const { schoolId, school, session } = await requireActiveSchool();
  const [tools, schoolTools, recommendations] = await Promise.all([
    db.tool.findMany({ orderBy: { name: "asc" } }),
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

  return (
    <PageShell
      title="Tool Recommendations"
      description="Curated Tool Catalog 2.0 with internal visibility controls, school-facing recommendations, and training-gated enablement."
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

      <div className="mt-6 grid gap-4">
        <Section title="Currently enabled" tools={catalog.enabled} canDirectManage={isAdminRole(session.user.role) || session.user.role === "IT"} />
        <Section title="Recommended for this school" tools={catalog.recommended} canDirectManage={isAdminRole(session.user.role) || session.user.role === "IT"} />
        <Section title="Discover more" tools={catalog.discover} canDirectManage={isAdminRole(session.user.role) || session.user.role === "IT"} />
      </div>
    </PageShell>
  );
}
