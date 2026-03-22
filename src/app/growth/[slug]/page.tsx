import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { formatEnumLabel } from "@/lib/school2/helpers";

const db = prisma as any;

export default async function GrowthAssetDetailPage({ params }: { params: { slug: string } }) {
  const { schoolId } = await requireActiveSchool();
  const asset = await db.growthAsset.findFirst({ where: { slug: params.slug, OR: [{ schoolId }, { schoolId: null }] } });
  if (!asset) notFound();

  return (
    <PageShell title={asset.title} description="Growth asset detail for school leadership and parent communication planning.">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{asset.title}</CardTitle>
              <div className="mt-2 text-sm text-gray-500">{asset.audience ? asset.audience : "Parent-facing communication asset"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{formatEnumLabel(asset.type)}</Badge>
              <CopyButton value={asset.body} label="Copy asset" copiedLabel="Asset copied" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {asset.description ? <div className="text-sm text-gray-700">{asset.description}</div> : null}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            This view is designed for investor and school demos: you can review the asset here, copy it quickly, and later move it into decks, WhatsApp replies,
            landing pages, or parent communication workflows.
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="whitespace-pre-line text-sm leading-7 text-gray-700">{asset.body}</div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
