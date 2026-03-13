import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { requestStackBundle, setBundleStatus } from "@/app/actions/stacks";

const db = prisma as any;

export default async function StacksPage() {
  const { schoolId } = await requireActiveSchool();
  const [bundles, adoptions] = await Promise.all([
    db.stackBundle.findMany({ orderBy: { name: "asc" } }),
    db.schoolBundleAdoption.findMany({ where: { schoolId } })
  ]);

  const adoptionMap = new Map<string, any>(adoptions.map((adoption: any) => [adoption.bundleId, adoption]));

  return (
    <PageShell
      title="Bundles"
      description="Structured bundle adoption so schools see a calm, curated path instead of the full internal tool registry."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {bundles.map((bundle: any) => {
          const adoption = adoptionMap.get(bundle.id);
          const toolKeys = Array.isArray(bundle.toolKeys) ? bundle.toolKeys : [];
          return (
            <Card key={bundle.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{bundle.name}</CardTitle>
                    <div className="mt-2 text-sm text-gray-600">{bundle.description}</div>
                  </div>
                  <Badge variant={adoption?.status === "ACTIVE" ? "success" : adoption?.status === "DEFERRED" ? "warning" : "info"}>
                    {adoption?.status ?? "RECOMMENDED"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {bundle.overview ? <div className="text-sm text-gray-600">{bundle.overview}</div> : null}
                <div className="flex flex-wrap gap-2">
                  {toolKeys.map((key: string) => <Badge key={key}>{key}</Badge>)}
                </div>
                <div className="flex gap-2">
                  <form action={requestStackBundle}>
                    <input type="hidden" name="bundleKey" value={bundle.key} />
                    <Button variant="primary" type="submit">Request bundle</Button>
                  </form>
                  <form action={setBundleStatus}>
                    <input type="hidden" name="bundleId" value={bundle.id} />
                    <input type="hidden" name="status" value={adoption?.status === "ACTIVE" ? "DEFERRED" : "ACTIVE"} />
                    <Button variant="secondary" type="submit">{adoption?.status === "ACTIVE" ? "Defer" : "Activate"}</Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
