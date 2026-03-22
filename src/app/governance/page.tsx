import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuoteCard } from "@/components/ui/quote-card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { askGovernanceQuestion, pinGovernanceDocument, uploadGovernanceDocument } from "@/app/actions/governance";
import { GOVERNANCE_CATEGORY_LABELS } from "@/lib/school2/governance";
import { formatDateTime } from "@/lib/format";
import { canManageGovernance } from "@/lib/permissions";

const db = prisma as any;

export default async function GovernancePage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const { schoolId, session } = await requireActiveSchool();
  const queryId = typeof searchParams.query === "string" ? searchParams.query : null;
  const canManage = canManageGovernance(session.user.role);

  const [documents, queries, activeQuery] = await Promise.all([
    db.governanceDocument.findMany({
      where: { schoolId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }]
    }),
    db.governanceQuery.findMany({
      where: { schoolId },
      include: { sources: { include: { document: true, version: true } } },
      orderBy: { createdAt: "desc" },
      take: 6
    }),
    queryId
      ? db.governanceQuery.findFirst({
          where: { id: queryId, schoolId },
          include: { sources: { include: { document: true, version: true } } }
        })
      : null
  ]);

  return (
    <PageShell
      title="School 2.0 Governance & Support Center"
      description="Upload school SOPs, retrieve quoted policy guidance, and keep a searchable history of leadership questions."
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ask a governance question</CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              This assistant is retrieval-first. It quotes uploaded documents, links to source material, and recommends escalation when confidence is low.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-3" action={askGovernanceQuestion}>
              <textarea
                name="question"
                className="min-h-[120px] w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm"
                placeholder="A student punched another student. What does our SOP say we should do?"
              />
              <Button variant="primary" type="submit">Ask question</Button>
            </form>

            {activeQuery ? (
              <div className="space-y-3 rounded-lg border border-[var(--border)] bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">Latest answer</div>
                    <div className="mt-1 text-xs text-gray-500">Confidence {activeQuery.confidence}%</div>
                  </div>
                  {activeQuery.lowConfidence ? <Badge variant="warning">Escalate to leadership</Badge> : <Badge variant="success">Document-backed answer</Badge>}
                </div>
                <p className="whitespace-pre-line text-sm leading-6 text-gray-700">{activeQuery.answer}</p>
                {activeQuery.lowConfidence ? (
                  <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Confidence is limited. Please review the underlying document and escalate to a human leader for final judgement.
                  </div>
                ) : null}
                <div className="grid gap-3">
                  {activeQuery.sources.map((source: any) => (
                    <QuoteCard
                      key={source.id}
                      title={source.document?.title ?? "Source"}
                      quote={source.quote ?? ""}
                      href={source.versionId ? `/governance/source/${source.versionId}` : undefined}
                      meta={source.version ? `Version ${source.version.version}` : undefined}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle>Upload or paste a governance document</CardTitle>
              <p className="mt-2 text-sm text-gray-600">Leadership-only controls are hidden from non-admin roles to keep demo paths cleaner.</p>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" action={uploadGovernanceDocument}>
                <input name="title" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Document title" />
                <select name="category" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                  {Object.entries(GOVERNANCE_CATEGORY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
                <input name="summary" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Short summary" />
                <input name="originalFilename" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Original filename (optional)" />
                <textarea name="body" className="min-h-[180px] w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Paste SOP text, policy text, or leadership notes here" />
                <Button variant="primary" type="submit">Save governance document</Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Leadership document controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
                Document upload, pinning, and version management are hidden for your role. You can still ask questions and open source previews.
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
                For investor teacher demos, this keeps the experience focused on retrieval, training, and packaged services rather than admin workflows.
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Document library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.length ? (
              documents.map((document: any) => {
                const latest = document.versions[0] ?? null;
                return (
                  <div key={document.id} className="rounded-lg border border-[var(--border)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Link className="font-semibold text-gray-900 hover:underline" href={`/governance/documents/${document.id}`}>
                            {document.title}
                          </Link>
                          <Badge variant={document.pinned ? "warning" : "info"}>{document.pinned ? "Pinned" : "Active"}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">{GOVERNANCE_CATEGORY_LABELS[document.category] ?? document.category}</div>
                        {document.summary ? <div className="mt-2 text-sm text-gray-600">{document.summary}</div> : null}
                        <div className="mt-2 text-xs text-gray-500">
                          {latest ? `Latest version ${latest.version} • updated ${formatDateTime(new Date(document.updatedAt))}` : "No versions yet"}
                        </div>
                      </div>
                      {canManage ? (
                        <form action={pinGovernanceDocument}>
                          <input type="hidden" name="documentId" value={document.id} />
                          <input type="hidden" name="pinned" value={document.pinned ? "false" : "true"} />
                          <Button variant="ghost" type="submit">{document.pinned ? "Unpin" : "Pin"}</Button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-sm text-gray-600">No governance documents uploaded yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent governance questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {queries.length ? (
              queries.map((query: any) => (
                <div key={query.id} className="rounded-lg border border-[var(--border)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="font-medium text-gray-900">{query.question}</div>
                    <Badge variant={query.lowConfidence ? "warning" : "success"}>{query.confidence}% confidence</Badge>
                  </div>
                  <div className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{query.answer}</div>
                  <Link className="mt-3 inline-block text-sm font-medium text-blue-700 hover:underline" href={`/governance?query=${query.id}`}>
                    Open answer →
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600">No governance questions asked yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
