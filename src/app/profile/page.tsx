import { PageShell } from "@/components/layout/page-shell";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/session";
import { updateMyProfile } from "@/app/actions/profile";

export default async function ProfilePage() {
  const { session, school, isSuperAdmin } = await requireActiveSchool();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, active: true, createdAt: true }
  });

  return (
    <PageShell title="My Profile">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-3" action={updateMyProfile}>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Name</label>
                <Input name="name" defaultValue={user?.name ?? ""} required />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <Input value={user?.email ?? session.user.email ?? ""} disabled />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Badge variant="info">{roleLabel(user?.role ?? session.user.role)}</Badge>
                {isSuperAdmin && <Badge variant="warning">Super Admin</Badge>}
                {user?.active === false && <Badge variant="danger">Disabled</Badge>}
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" type="submit">
                  Save
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>School context</CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              Your actions are scoped to the active school context.
            </p>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <div className="text-gray-500">Active school</div>
              <div className="font-medium text-gray-900">{school.name}</div>
              <div className="text-xs text-gray-600">{school.city} • {school.timezone}</div>
            </div>

            {isSuperAdmin ? (
              <div className="rounded-lg border border-[var(--border)] bg-gray-50 px-4 py-3 text-sm text-gray-700">
                You are a Super Admin. You can switch school context in <span className="font-medium">Settings</span>.
              </div>
            ) : (
              <div className="rounded-lg border border-[var(--border)] bg-gray-50 px-4 py-3 text-sm text-gray-700">
                Your account is attached to this school.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
