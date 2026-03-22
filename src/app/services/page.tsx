import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAllOfferings } from "@/lib/school2/offerings";
import { formatEnumLabel } from "@/lib/school2/helpers";

const groupOrder = ["APP", "SERVICE", "CURRICULUM", "LESSON_PLAN"] as const;

export default async function ServicesPage() {
  const groups = groupOrder.map((group) => ({ group, offerings: getAllOfferings({ groups: [group] }) })).filter((item) => item.offerings.length > 0);

  return (
    <PageShell
      title="Services & Apps"
      description="A clearer view of the Centum package family: real in-product features, linked tools, packaged leadership modules, HR suites, curricula, and lesson-plan assets."
    >
      <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>How to frame this page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
              Some offerings here are fully built inside Centum Stack, some are linked tools, and some are packaged modules or suites that can be deployed separately later. That mix is intentional.
            </div>
            <div>
              The current version is designed to help investors and schools understand the breadth of the Centum operating layer without pretending that every single module is already a native in-platform workflow.
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 hover:bg-gray-50" href="/guide-builder">Open Guide Builder →</Link>
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 hover:bg-gray-50" href="/training">Open lesson-plan hub →</Link>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Packaging logic</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
              <div className="font-medium text-gray-900">Built in now</div>
              <div className="mt-1">Guide Builder and the broader governance / transformation surfaces already exist directly inside this repo.</div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
              <div className="font-medium text-gray-900">Packaged offerings</div>
              <div className="mt-1">Leadership modules and HR suites are represented in-platform so schools can see them, even if they later deploy as linked or separate surfaces.</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 space-y-6">
        {groups.map(({ group, offerings }) => (
          <Card key={group}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{formatEnumLabel(group)}</CardTitle>
                <Badge variant="info">{offerings.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {offerings.map((offering) => (
                <div key={offering.key} className="rounded-lg border border-[var(--border)] p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-gray-900">{offering.title}</div>
                    <Badge variant="info">{offering.badge}</Badge>
                  </div>
                  <div className="mt-2 text-gray-600">{offering.description}</div>
                  {offering.audience ? <div className="mt-2 text-xs uppercase tracking-wide text-gray-500">{offering.audience}</div> : null}
                  {offering.note ? <div className="mt-3 rounded-md border border-[var(--border)] bg-slate-50 px-3 py-2 text-xs text-gray-600">{offering.note}</div> : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link className="rounded-md border border-[var(--border)] px-3 py-2 font-medium text-gray-900 hover:bg-gray-50" href={`/services/${offering.key}`}>
                      Open details →
                    </Link>
                    <a className="rounded-md border border-[var(--border)] px-3 py-2 font-medium text-gray-900 hover:bg-gray-50" href={offering.href} target="_blank" rel="noreferrer">
                      {offering.cta ?? "Open link"}
                    </a>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
