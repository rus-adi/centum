import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";

const db = prisma as any;

export default async function GrowthAssetDetailPage({ params }: { params: { slug: string } }) {
  const { schoolId } = await requireActiveSchool();
  const asset = await db.growthAsset.findFirst({ where: { slug: params.slug, OR: [{ schoolId }, { schoolId: null }] } });
  if (!asset) notFound();

  return (
    <PageShell title={asset.title} description="Growth asset detail for school leadership and parent communication planning.">
      <Card>
        <CardHeader>
          <CardTitle>{asset.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-500">{asset.type}{asset.audience ? ` • ${asset.audience}` : ""}</div>
          {asset.description ? <div className="text-sm text-gray-700">{asset.description}</div> : null}
          <div className="whitespace-pre-line rounded-lg border border-[var(--border)] bg-slate-50 p-4 text-sm leading-6 text-gray-700">
            {asset.body}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
