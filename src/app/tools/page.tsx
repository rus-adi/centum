import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, THead, TH, TD } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { requestSchoolToolChange, directToggleSchoolTool } from "@/app/actions/tools";

function toolStatus(enabled: boolean) {
  return enabled ? <Badge variant="success">Enabled</Badge> : <Badge variant="neutral">Disabled</Badge>;
}

export default async function ToolsPage() {
  const { schoolId, isSuperAdmin, session } = await requireActiveSchool();

  const canDirect = isSuperAdmin || ["ADMIN", "IT"].includes(session.user.role);

  const [schoolTools, completions] = await Promise.all([
    prisma.schoolTool.findMany({
      where: { schoolId },
      include: {
        tool: {
          include: {
            requirements: { include: { module: true } }
          }
        }
      },
      orderBy: { tool: { name: "asc" } }
    }),
    prisma.trainingCompletion.findMany({ where: { userId: session.user.id } })
  ]);

  const completionSet = new Set(completions.map((c) => `${c.moduleId}:${c.version}`));

  return (
    <PageShell title="Tools">
      <Card>
        <CardHeader>
          <CardTitle>Tools</CardTitle>
          <p className="mt-2 text-sm text-gray-600">
            Enable or request changes to your school&apos;s tool stack. Some tools require training before they can be
            enabled.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <tr>
                <TH>Tool</TH>
                <TH>Status</TH>
                <TH>Eligibility</TH>
                <TH>Prerequisites</TH>
                <TH className="text-right">Action</TH>
              </tr>
            </THead>
            <tbody>
              {schoolTools.map((st) => {
                const reqs = st.tool.requirements ?? [];
                const missing = reqs.filter((r) => !completionSet.has(`${r.moduleId}:${r.module.currentVersion}`));
                const nextEnabled = !st.enabled;
                const canEnableNow = !nextEnabled || missing.length === 0;

                return (
                  <tr key={st.id}>
                    <TD>
                      <div className="font-medium text-gray-900">{st.tool.name}</div>
                      <div className="mt-1 text-xs text-gray-500">{st.tool.description}</div>
                    </TD>
                    <TD>{toolStatus(st.enabled)}</TD>
                    <TD>
                      <Badge variant="neutral">{st.eligible}</Badge>
                    </TD>
                    <TD>
                      {reqs.length === 0 ? (
                        <div className="text-sm text-gray-600">—</div>
                      ) : (
                        <div className="space-y-1">
                          {reqs.map((r) => {
                            const met = completionSet.has(`${r.moduleId}:${r.module.currentVersion}`);
                            return (
                              <div key={r.id} className="flex items-center gap-2">
                                <Badge variant={met ? "success" : "warning"}>{met ? "Done" : "Missing"}</Badge>
                                <span className="text-sm text-gray-800">{r.module.title}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {missing.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Complete prerequisites in <Link className="text-blue-700 hover:underline" href="/training">Training Hub</Link>.
                        </div>
                      )}
                    </TD>
                    <TD className="text-right">
                      {canDirect ? (
                        <form action={directToggleSchoolTool} className="inline-flex">
                          <input type="hidden" name="toolId" value={st.toolId} />
                          <input type="hidden" name="enabled" value={String(!st.enabled)} />
                          <Button type="submit" variant="primary" disabled={!canEnableNow}>
                            {st.enabled ? "Disable" : missing.length > 0 ? "Training required" : "Enable"}
                          </Button>
                        </form>
                      ) : (
                        <form action={requestSchoolToolChange} className="inline-flex">
                          <input type="hidden" name="toolId" value={st.toolId} />
                          <input type="hidden" name="enabled" value={String(!st.enabled)} />
                          <Button type="submit" variant="secondary">
                            Request change
                          </Button>
                        </form>
                      )}
                    </TD>
                  </tr>
                );
              })}

              {schoolTools.length === 0 && (
                <tr>
                  <TD colSpan={5} className="text-center text-gray-500">
                    No tools configured.
                  </TD>
                </tr>
              )}
            </tbody>
          </Table>

          {!canDirect && (
            <div className="mt-4 text-xs text-gray-500">
              You do not have direct tool enable permissions. Requests will go to the admin/IT queue.
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
