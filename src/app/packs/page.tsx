import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { setPackStatus } from "@/app/actions/packs";
import { canManagePackAdoptions } from "@/lib/permissions";
import Link from "next/link";
import { formatEnumLabel } from "@/lib/school2/helpers";

const db = prisma as any;

export default async function PacksPage() {
  const { schoolId, session } = await requireActiveSchool();
  const canManage = canManagePackAdoptions(session.user.role);
  const [packs, adoptions] = await Promise.all([
    db.transformationPack.findMany({ orderBy: { name: "asc" } }),
    db.schoolPackAdoption.findMany({ where: { schoolId } })
  ]);

  const adoptionMap = new Map<string, any>(adoptions.map((adoption: any) => [adoption.packId, adoption]));

  return (
    <PageShell
      title="Transformation Packs"
      description="Curriculum-agnostic implementation packs for AI enablement, individualized learning, projects, and SEL."
    >
      {!canManage ? (
        <Card>
          <CardContent className="pt-6 text-sm text-gray-600">
            Pack activation controls are hidden for your role. You can still review the packs, suggested training, and linked offerings.
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {packs.map((pack: any) => {
          const adoption = adoptionMap.get(pack.id);
          return (
            <Card key={pack.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle>{pack.name}</CardTitle>
                    <div className="mt-1 text-xs uppercase tracking-wide text-gray-500">{formatEnumLabel(pack.pillar)}</div>
                    <div className="mt-2 text-sm text-gray-600">{pack.description}</div>
                  </div>
                  <Badge variant={adoption?.status === "ACTIVE" ? "success" : adoption?.status === "DEFERRED" ? "warning" : "info"}>
                    {formatEnumLabel(adoption?.status ?? "RECOMMENDED")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600">{pack.overview}</div>
                <div className="flex gap-2">
                  <Link className="rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-gray-50" href={`/packs/${pack.slug}`}>
                    Open pack
                  </Link>
                  {canManage ? (
                    <form action={setPackStatus}>
                      <input type="hidden" name="packId" value={pack.id} />
                      <input type="hidden" name="status" value={adoption?.status === "ACTIVE" ? "DEFERRED" : "ACTIVE"} />
                      <Button variant="secondary" type="submit">{adoption?.status === "ACTIVE" ? "Defer" : "Activate"}</Button>
                    </form>
                  ) : (
                    <div className="rounded-md border border-[var(--border)] px-3 py-2 text-sm text-gray-500">Leadership activates packs</div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageShell>
  );
}
