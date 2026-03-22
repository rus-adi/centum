import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function KnowledgeBasePage({
  searchParams
}: {
  searchParams?: { q?: string; category?: string };
}) {
  await requireActiveSchool();

  const q = (searchParams?.q ?? "").trim();
  const category = (searchParams?.category ?? "").trim();

  const where: any = { published: true };
  if (category) where.category = category;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } }
    ];
  }

  const [articles, categories] = await Promise.all([
    prisma.knowledgeArticle.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.knowledgeArticle.groupBy({ by: ["category"], where: { published: true } })
  ]);

  const catList = categories
    .map((c) => c.category)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return (
    <PageShell title="Knowledge Base">
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base</CardTitle>
          <p className="mt-2 text-sm text-gray-600">
            Playbooks, templates, and implementation guides for school transformation.
          </p>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-2 md:flex-row md:items-center" action="/knowledge" method="get">
            <Input
              name="q"
              placeholder="Search articles…"
              defaultValue={q}
              className="md:max-w-sm"
            />
            <select
              name="category"
              defaultValue={category}
              className="h-10 rounded-md border border-[var(--border)] bg-white px-3 text-sm text-gray-900"
            >
              <option value="">All categories</option>
              {catList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button type="submit" variant="primary">
                Search
              </Button>
              <Link href="/knowledge">
                <Button type="button" variant="secondary">
                  Reset
                </Button>
              </Link>
            </div>
          </form>

          <div className="mt-4 grid gap-3">
            {articles.map((a) => (
              <Link
                key={a.id}
                href={`/knowledge/${a.slug}`}
                className="rounded-lg border border-[var(--border)] p-4 transition hover:bg-gray-50"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-base font-semibold text-gray-900">{a.title}</div>
                  <Badge variant="neutral">{a.category}</Badge>
                </div>
                {a.excerpt && <div className="mt-1 text-sm text-gray-600">{a.excerpt}</div>}
              </Link>
            ))}

            {articles.length === 0 && (
              <div className="rounded-lg border border-dashed border-[var(--border)] p-6 text-sm text-gray-600">
                No articles found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
