"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { activeSchoolCookieName } from "@/lib/tenant";
import { auditLog } from "@/lib/audit";

function safeRedirectTarget(raw: string | null | undefined, fallback: string) {
  const v = String(raw ?? "").trim();
  if (!v) return fallback;
  if (!v.startsWith("/")) return fallback;
  // Basic hardening: disallow protocol-relative, etc.
  if (v.startsWith("//")) return fallback;
  return v;
}

function appendQuery(url: string, key: string, value: string) {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${key}=${encodeURIComponent(value)}`;
}

export async function setActiveSchool(formData: FormData) {
  const session = await requireRole(["SUPER_ADMIN"]);
  const schoolId = String(formData.get("schoolId") ?? "");
  const redirectTo = safeRedirectTarget(formData.get("redirectTo") as any, "/dashboard");

  if (!schoolId) redirect("/settings?error=Missing school");

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) redirect("/settings?error=School not found");

  cookies().set(activeSchoolCookieName(), schoolId, { httpOnly: true, sameSite: "lax", path: "/" });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "school.switch_context",
    entityType: "School",
    entityId: schoolId
  });

  redirect(appendQuery(redirectTo, "success", "School context updated"));
}

export async function createSchool(formData: FormData) {
  const session = await requireRole(["SUPER_ADMIN"]);
  const name = String(formData.get("name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Asia/Jakarta").trim();

  if (!name || !city) redirect("/settings?error=Name and city are required");

  const school = await prisma.school.create({ data: { name, city, timezone } });

  await auditLog({
    schoolId: school.id,
    actorId: session.user.id,
    action: "school.create",
    entityType: "School",
    entityId: school.id,
    metadata: { name, city, timezone }
  });

  redirect("/settings?success=School created");
}
