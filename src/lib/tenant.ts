import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireSession, isSuperAdmin } from "@/lib/session";

const COOKIE_NAME = "centum_active_school";

export async function requireActiveSchool() {
  const session = await requireSession();
  const role = session.user.role;

  if (isSuperAdmin(role)) {
    const cookie = cookies().get(COOKIE_NAME)?.value;
    let schoolId = cookie ?? null;

    if (schoolId) {
      const school = await prisma.school.findUnique({ where: { id: schoolId } });
      if (school) return { session, schoolId: school.id, school, isSuperAdmin: true };
    }

    // fallback to first school
    const first = await prisma.school.findFirst({ orderBy: { createdAt: "asc" } });
    if (!first) throw new Error("No schools found in database.");
    return { session, schoolId: first.id, school: first, isSuperAdmin: true };
  }

  const schoolId = session.user.schoolId;
  if (!schoolId) throw new Error("User has no schoolId");
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) throw new Error("School not found");
  return { session, schoolId, school, isSuperAdmin: false };
}

export function activeSchoolCookieName() {
  return COOKIE_NAME;
}
