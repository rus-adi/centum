import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { createGrowthAsset } from "@/app/actions/growth";
import { canManageGrowth } from "@/lib/permissions";
import { formatEnumLabel } from "@/lib/school2/helpers";

const db = prisma as any;

export default async function GrowthPage() {
  const { schoolId, session } = await requireActiveSchool();
  const canManage = canManageGrowth(session.user.role);
  const assets = await db.growthAsset.findMany({
    where: { OR: [{ schoolId }, { schoolId: null }] },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PageShell
      title="Growth Assets"
      description="Parent-facing support assets that help partner schools explain the School 2.0 transition clearly and credibly."
    >
      <div className="grid gap-4 lg:grid-cols-[0.95fr,1.05fr]">
        {canManage ? (
          <Card>
            <CardHeader><CardTitle>Create a growth asset</CardTitle></CardHeader>
            <CardContent>
              <form className="space-y-3" action={createGrowthAsset}>
                <input name="title" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Title" />
                <input name="slug" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="slug (optional)" />
                <select name="type" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                  <option value="FAQ">Parent FAQ</option>
                  <option value="DECK_OUTLINE">Open house / parent night deck outline</option>
                  <option value="LANDING_PAGE_COPY">Landing page copy draft</option>
                  <option value="WEEKLY_UPDATE_TEMPLATE">Weekly update template</option>
                  <option value="WHATSAPP_TEMPLATE">WhatsApp response template</option>
                  <option value="EXPLAINER">Explainer</option>
                </select>
                <input name="audience" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Audience" />
                <textarea name="description" className="min-h-[80px] w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Short description" />
                <textarea name="body" className="min-h-[200px] w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Asset body" />
                <Button variant="primary" type="submit">Save asset</Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader><CardTitle>Growth kit library</CardTitle></CardHeader>
            <CardContent className="text-sm text-gray-600">
              Growth-asset editing controls are hidden for your role. You can still open polished parent-facing drafts and reuse them in school conversations.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Asset library</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {assets.length ? (
              assets.map((asset: any) => (
                <div key={asset.id} className="rounded-lg border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{asset.title}</div>
                      <div className="mt-1 text-sm text-gray-600">{asset.description || asset.audience || "Growth kit asset"}</div>
                    </div>
                    <Badge variant="info">{formatEnumLabel(asset.type)}</Badge>
                  </div>
                  <Link className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline" href={`/growth/${asset.slug}`}>
                    Open asset →
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600">No growth assets yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
