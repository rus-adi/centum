import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteCard } from "@/components/ui/quote-card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { addGovernanceVersion } from "@/app/actions/governance";
import { GOVERNANCE_CATEGORY_LABELS } from "@/lib/school2/governance";

const db = prisma as any;

export default async function GovernanceDocumentDetailPage({ params }: { params: { id: string } }) {
  const { schoolId } = await requireActiveSchool();
  const document = await db.governanceDocument.findFirst({
    where: { id: params.id, schoolId },
    include: {
      versions: {
        orderBy: { version: "desc" },
        include: { chunks: { orderBy: { ordinal: "asc" }, take: 4 } }
      }
    }
  });

  if (!document) notFound();

  return (
    <PageShell title={document.title} description="Governance document detail, version history, and retrieval-ready chunks.">
      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Document overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                {GOVERNANCE_CATEGORY_LABELS[document.category] ?? document.category}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                {document.status}
              </span>
            </div>
            <div>{document.summary || document.description || "No summary available."}</div>
            <div>{document.versions.length} version(s) stored</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add a new version</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" action={addGovernanceVersion.bind(null, document.id)}>
              <input name="originalFilename" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Original filename (optional)" />
              <textarea name="body" className="min-h-[180px] w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Paste the updated policy or SOP text here" />
              <Button variant="primary" type="submit">Add version</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4">
        {document.versions.map((version: any) => (
          <Card key={version.id}>
            <CardHeader>
              <CardTitle>Version {version.version}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600">
                {version.originalFilename ? `${version.originalFilename} • ` : ""}
                <a className="font-medium text-blue-700 hover:underline" href={`/api/governance-files/${version.id}`}>
                  Open source file
                </a>
              </div>
              <div className="grid gap-3">
                {version.chunks.length ? (
                  version.chunks.map((chunk: any) => (
                    <QuoteCard key={chunk.id} title={`Chunk ${chunk.ordinal + 1}`} quote={chunk.content} href={`/api/governance-files/${version.id}`} />
                  ))
                ) : (
                  <div className="text-sm text-gray-600">No chunks generated for this version yet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
