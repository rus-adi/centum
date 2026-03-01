import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function KnowledgeArticlePage({ params }: { params: { slug: string } }) {
  await requireActiveSchool();

  const article = await prisma.knowledgeArticle.findUnique({ where: { slug: params.slug } });
  if (!article || !article.published) notFound();

  return (
    <PageShell title="Knowledge Base">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{article.title}</CardTitle>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="neutral">{article.category}</Badge>
                <span className="text-xs text-gray-500">Updated {article.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>

            <Link href="/knowledge">
              <Button variant="secondary">Back</Button>
            </Link>
          </div>
          {article.excerpt && <p className="mt-3 text-sm text-gray-600">{article.excerpt}</p>}
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap rounded-lg border border-[var(--border)] bg-gray-50 p-5 text-sm text-gray-900">
            {article.body}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
