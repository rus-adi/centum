import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { createLicense, createVendor, updateLicenseStatus } from "@/app/actions/partners";

const db = prisma as any;

export default async function PartnersPage() {
  const { schoolId } = await requireActiveSchool();
  const [vendors, licenses, tools] = await Promise.all([
    db.vendor.findMany({ orderBy: { name: "asc" } }),
    db.license.findMany({ where: { schoolId }, include: { vendor: true, tool: true }, orderBy: { createdAt: "desc" } }),
    db.tool.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <PageShell
      title="Partner Ops"
      description="Lightweight vendor and license operations for a tool-orchestration model rather than a proprietary all-in-one stack."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Add or refresh a vendor</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-3" action={createVendor}>
              <input name="name" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Vendor name" />
              <input name="key" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="vendor-key (optional)" />
              <input name="website" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Website" />
              <textarea name="notes" className="min-h-[120px] w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Notes" />
              <Button variant="primary" type="submit">Save vendor</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Create a license record</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-3" action={createLicense}>
              <select name="vendorId" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                <option value="">Select vendor</option>
                {vendors.map((vendor: any) => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
              </select>
              <input name="name" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="License / contract name" />
              <select name="toolId" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm">
                <option value="">Link to tool (optional)</option>
                {tools.map((tool: any) => <option key={tool.id} value={tool.id}>{tool.name}</option>)}
              </select>
              <div className="grid gap-3 md:grid-cols-2">
                <input name="seatsPurchased" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Seats purchased" />
                <input name="seatsAssigned" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Seats assigned" />
              </div>
              <input name="renewalDate" type="date" className="w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" />
              <textarea name="implementationNotes" className="min-h-[120px] w-full rounded-md border border-[var(--border)] px-3 py-2 text-sm" placeholder="Implementation notes" />
              <Button variant="primary" type="submit">Save license</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4">
        {licenses.map((license: any) => (
          <Card key={license.id}>
            <CardContent className="flex flex-col gap-4 pt-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-semibold text-gray-900">{license.name}</div>
                  <Badge variant={license.status === "ACTIVE" ? "success" : license.status === "PLANNING" ? "info" : "warning"}>{license.status}</Badge>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {license.vendor?.name ?? "Vendor"}
                  {license.tool?.name ? ` • ${license.tool.name}` : ""}
                  {license.seatsPurchased ? ` • ${license.seatsAssigned ?? 0}/${license.seatsPurchased} seats assigned` : ""}
                </div>
                {license.implementationNotes ? <div className="mt-2 text-sm text-gray-600">{license.implementationNotes}</div> : null}
              </div>
              <form className="flex gap-2" action={updateLicenseStatus}>
                <input type="hidden" name="licenseId" value={license.id} />
                <input type="hidden" name="status" value={license.status === "ACTIVE" ? "PAUSED" : "ACTIVE"} />
                <Button variant="secondary" type="submit">{license.status === "ACTIVE" ? "Pause" : "Activate"}</Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
