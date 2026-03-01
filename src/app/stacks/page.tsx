import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requestStackBundle } from "@/app/actions/stacks";

export default async function StacksPage() {
  await requireActiveSchool();

  const [bundles, tools] = await Promise.all([
    prisma.stackBundle.findMany({ orderBy: { category: "asc" } }),
    prisma.tool.findMany({ orderBy: { name: "asc" } })
  ]);

  const toolMap = new Map(tools.map((t) => [t.key, t.name]));

  return (
    <PageShell title="Stacks">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Approved stack bundles</CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              Stacks are curated tool bundles that Centum can recommend and deploy quickly.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {bundles.map((b) => {
                const keys = Array.isArray(b.toolKeys) ? (b.toolKeys as any[]) : [];
                return (
                  <Card key={b.id}>
                    <CardHeader>
                      <CardTitle>{b.name}</CardTitle>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="info">{b.category}</Badge>
                        <Badge variant="neutral">{keys.length} tools</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-700">{b.description}</div>

                      <div className="mt-3">
                        <div className="text-xs font-medium text-gray-500">Includes</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {keys.map((k) => (
                            <Badge key={k} variant="neutral">
                              {toolMap.get(String(k)) ?? String(k)}
                            </Badge>
                          ))}
                          {keys.length === 0 && <div className="text-xs text-gray-500">No tools listed.</div>}
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <form action={requestStackBundle}>
                          <input type="hidden" name="bundleKey" value={b.key} />
                          <Button type="submit" variant="primary">
                            Request this stack
                          </Button>
                        </form>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {bundles.length === 0 && (
                <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-sm text-gray-600">
                  No bundles yet. Seed data should create demo bundles.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
