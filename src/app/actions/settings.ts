"use server";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const schoolSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  timezone: z.string().min(1),

  type: z.enum(["PUBLIC", "PRIVATE", "INTERNATIONAL", "HYBRID"]).optional().nullable(),
  curriculum: z.string().optional().nullable(),
  studentCount: z.coerce.number().int().positive().optional().nullable(),
  deviceModel: z.enum(["ONE_TO_ONE", "SHARED", "LAB_ONLY", "BYOD"]).optional().nullable(),
  ecosystem: z.enum(["GOOGLE", "MICROSOFT", "MIXED"]).optional().nullable(),
  connectivity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().nullable(),
  constraints: z.string().optional().nullable()
});

function emptyToNull(v: string | null) {
  const s = (v ?? "").trim();
  return s ? s : null;
}

export async function updateSchool(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const gradeBands = formData
    .getAll("gradeBands")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const priorityOutcomes = formData
    .getAll("priorityOutcomes")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const data = schoolSchema.parse({
    name: String(formData.get("name") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    timezone: String(formData.get("timezone") ?? "").trim(),

    type: emptyToNull(String(formData.get("type") ?? "")) as any,
    curriculum: emptyToNull(String(formData.get("curriculum") ?? "")),
    studentCount: emptyToNull(String(formData.get("studentCount") ?? "")) as any,
    deviceModel: emptyToNull(String(formData.get("deviceModel") ?? "")) as any,
    ecosystem: emptyToNull(String(formData.get("ecosystem") ?? "")) as any,
    connectivity: emptyToNull(String(formData.get("connectivity") ?? "")) as any,
    constraints: emptyToNull(String(formData.get("constraints") ?? ""))
  });

  const updated = await prisma.school.update({
    where: { id: schoolId },
    data: {
      name: data.name,
      city: data.city,
      timezone: data.timezone,

      type: (data.type as any) ?? null,
      curriculum: data.curriculum ?? null,
      studentCount: (data.studentCount as any) ?? null,
      deviceModel: (data.deviceModel as any) ?? null,
      ecosystem: (data.ecosystem as any) ?? null,
      connectivity: (data.connectivity as any) ?? null,
      constraints: data.constraints ?? null,

      gradeBands: gradeBands.length
        ? gradeBands
        : Prisma.DbNull,

      priorityOutcomes: priorityOutcomes.length
        ? priorityOutcomes
        : Prisma.DbNull
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "school.update",
    entityType: "School",
    entityId: updated.id,
    metadata: {
      name: updated.name,
      city: updated.city,
      timezone: updated.timezone,
      type: updated.type,
      curriculum: updated.curriculum,
      studentCount: updated.studentCount,
      deviceModel: updated.deviceModel,
      ecosystem: updated.ecosystem,
      connectivity: updated.connectivity
    }
  });

  revalidatePath("/settings");
  redirect("/settings?success=School updated");
}

export async function setUserActive(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const userId = String(formData.get("userId") ?? "");
  const active = String(formData.get("active") ?? "true") === "true";

  if (!userId) redirect("/settings?error=Missing user");

  if (userId === session.user.id)
    redirect("/settings?error=You cannot deactivate your own account");

  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId }
  });

  if (!user) redirect("/settings?error=User not found");

  await prisma.user.update({
    where: { id: user.id },
    data: { active }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: active ? "user.activate" : "user.deactivate",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role }
  });

  revalidatePath("/settings");
  redirect(
    `/settings?success=${encodeURIComponent(
      active ? "User activated" : "User deactivated"
    )}`
  );
}

export async function setUserRole(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "STAFF") as any;

  if (!userId) redirect("/settings?error=Missing user");

  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId }
  });

  if (!user) redirect("/settings?error=User not found");

  await prisma.user.update({
    where: { id: user.id },
    data: { role }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "user.set_role",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role }
  });

  revalidatePath("/settings");
  redirect("/settings?success=Role updated");
}

export async function deleteUser(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const userId = String(formData.get("userId") ?? "");

  if (!userId) redirect("/settings?error=Missing user");

  if (userId === session.user.id)
    redirect("/settings?error=You cannot delete your own account");

  const user = await prisma.user.findFirst({
    where: { id: userId, schoolId }
  });

  if (!user) redirect("/settings?error=User not found");

  await prisma.user.delete({
    where: { id: user.id }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "user.delete",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role }
  });

  revalidatePath("/settings");
  redirect("/settings?success=User deleted");
}