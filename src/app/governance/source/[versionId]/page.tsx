import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { GOVERNANCE_CATEGORY_LABELS } from "@/lib/school2/governance";
import { formatDateTime } from "@/lib/format";

const db = prisma as any;

export default async function GovernanceSourcePreviewPage({ params }: { params: { versionId: string } }) {
  const { schoolId } = await requireActiveSchool();
  const version = await db.governanceDocumentVersion.findFirst({
    where: { id: params.versionId, document: { schoolId } },
    include: { document: true }
  });

  if (!version) notFound();

  return (
    <PageShell title={`${version.document.title} — Source Preview`} description="Styled source preview for leadership review, quoting, and escalation checks.">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>{version.document.title}</CardTitle>
              <div className="mt-2 text-sm text-gray-600">
                {GOVERNANCE_CATEGORY_LABELS[version.document.category] ?? version.document.category}
                <span className="px-2 text-gray-300">•</span>
                Version {version.version}
                <span className="px-2 text-gray-300">•</span>
                Updated {formatDateTime(new Date(version.createdAt))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">Source preview</Badge>
              <CopyButton value={version.body} label="Copy source" copiedLabel="Source copied" />
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href={`/api/governance-files/${version.id}`}>
                Open raw file
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            Leadership and teachers can quote directly from this page during demos. When judgement is sensitive, use this source preview as the final check before escalating to a human decision maker.
          </div>
          {version.notes ? <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">{version.notes}</div> : null}
          <div className="rounded-xl border border-[var(--border)] bg-white p-6 shadow-sm">
            <div className="whitespace-pre-wrap text-sm leading-7 text-gray-800">{version.body}</div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
