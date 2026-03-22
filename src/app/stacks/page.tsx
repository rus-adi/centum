import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OfferingCard } from "@/components/ui/offering-card";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { requestStackBundle, setBundleStatus } from "@/app/actions/stacks";
import { canManagePackAdoptions } from "@/lib/permissions";
import { getFeaturedOfferings } from "@/lib/school2/offerings";
import { formatEnumLabel } from "@/lib/school2/helpers";

const db = prisma as any;

export default async function StacksPage() {
  const { schoolId, session } = await requireActiveSchool();
  const canManage = canManagePackAdoptions(session.user.role);
  const canRequest = ["SUPER_ADMIN", "ADMIN", "IT", "STAFF"].includes(session.user.role);
  const [bundles, adoptions, tools] = await Promise.all([
    db.stackBundle.findMany({ orderBy: { name: "asc" } }),
    db.schoolBundleAdoption.findMany({ where: { schoolId } }),
    db.tool.findMany({ select: { key: true, name: true } })
  ]);

  const adoptionMap = new Map<string, any>(adoptions.map((adoption: any) => [adoption.bundleId, adoption]));
  const toolNameMap = new Map<string, string>(tools.map((tool: any) => [tool.key, tool.name]));
  const featuredPackages = getFeaturedOfferings({ groups: ["APP", "SERVICE"] }).filter((offering) =>
    [
      "google_email_foundation",
      "gemini_access",
      "project_finder_ai",
      "sentinel_guide_builder",
      "office_admin_ai",
      "leadership_governance_assistant"
    ].includes(offering.key)
  );

  return (
    <PageShell
      title="Bundles"
      description="Structured bundle adoption so schools see a calm, curated path instead of the full internal tool registry. These packages can also repackage the same underlying services in school-friendly ways."
    >
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Centum can offer multiple package shapes even when the underlying infrastructure overlaps. That makes it easier to present project discovery,
        Gemini access, prompt building, resiliency support, and foundational Google services as flexible entry points.
      </div>

      {!canManage ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-sm text-gray-600">
            Bundle activation controls are hidden for your role. You can still review bundle contents and request leadership follow-up where allowed.
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {bundles.map((bundle: any) => {
          const adoption = adoptionMap.get(bundle.id);
          const toolKeys = Array.isArray(bundle.toolKeys) ? bundle.toolKeys : [];
          return (
            <Card key={bundle.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{bundle.name}</CardTitle>
                    <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">{bundle.category}</div>
                    <div className="mt-2 text-sm text-gray-600">{bundle.description}</div>
                  </div>
                  <Badge variant={adoption?.status === "ACTIVE" ? "success" : adoption?.status === "DEFERRED" ? "warning" : "info"}>
                    {formatEnumLabel(adoption?.status ?? "RECOMMENDED")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {bundle.overview ? <div className="text-sm text-gray-600">{bundle.overview}</div> : null}
                <div className="flex flex-wrap gap-2">
                  {toolKeys.map((key: string) => <Badge key={key}>{toolNameMap.get(key) ?? key}</Badge>)}
                </div>
                <div className="flex flex-wrap gap-2">
                  {canRequest ? (
                    <form action={requestStackBundle}>
                      <input type="hidden" name="bundleKey" value={bundle.key} />
                      <Button variant="primary" type="submit">Request bundle</Button>
                    </form>
                  ) : (
                    <div className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-gray-500">Requests are leadership-managed</div>
                  )}
                  {canManage ? (
                    <form action={setBundleStatus}>
                      <input type="hidden" name="bundleId" value={bundle.id} />
                      <input type="hidden" name="status" value={adoption?.status === "ACTIVE" ? "DEFERRED" : "ACTIVE"} />
                      <Button variant="secondary" type="submit">{adoption?.status === "ACTIVE" ? "Defer" : "Activate"}</Button>
                    </form>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8">
        <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Packaged services schools can see</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featuredPackages.map((offering) => (
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
      </div>
    </PageShell>
  );
}
