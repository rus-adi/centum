import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Ensure user still exists and is active (important for deactivation)
  // NOTE: Some older cookies / sessions may not include our custom `user.id`.
  // In that case, fall back to email to resolve the user.
  let userId = (session.user as any)?.id as string | undefined;

  if (!userId) {
    const email = (session.user as any)?.email as string | undefined;
    if (email) {
      const byEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (byEmail) {
        userId = byEmail.id;
        (session.user as any).id = byEmail.id;
      }
    }
  }

  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) redirect("/login?error=account_disabled");

  // Sync role/schoolId from DB to session (token can be stale)
  session.user.role = user.role as any;
  session.user.schoolId = user.schoolId as any;

  return session;
}

export function isAdminRole(role: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export function isSuperAdmin(role: string) {
  return role === "SUPER_ADMIN";
}

export function roleLabel(role: string) {
  const m: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    ADMIN: "Admin",
    STAFF: "Staff",
    IT: "IT",
    COACH: "Coach",
    TEACHER: "Teacher"
  };
  return m[role] ?? role;
}
