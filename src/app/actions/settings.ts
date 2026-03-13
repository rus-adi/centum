"use server";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schoolSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  region: z.string().optional().nullable(),
  timezone: z.string().min(1),
  type: z.enum(["PUBLIC", "PRIVATE", "INTERNATIONAL", "HYBRID"]).optional().nullable(),
  curriculum: z.string().optional().nullable(),
  curriculumNotes: z.string().optional().nullable(),
  studentCount: z.coerce.number().int().positive().optional().nullable(),
  enrollment: z.coerce.number().int().positive().optional().nullable(),
  staffCount: z.coerce.number().int().positive().optional().nullable(),
  deviceModel: z.enum(["ONE_TO_ONE", "SHARED", "LAB_ONLY", "BYOD"]).optional().nullable(),
  deviceRatio: z.string().optional().nullable(),
  ecosystem: z.enum(["GOOGLE", "MICROSOFT", "MIXED"]).optional().nullable(),
  connectivity: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().nullable(),
  budgetSensitivity: z.enum(["LOW", "MEDIUM", "HIGH", "PREMIUM"]).optional().nullable(),
  constraints: z.string().optional().nullable(),
  nonNegotiables: z.string().optional().nullable(),
  aiAdoptionGoal: z.string().optional().nullable(),
  individualizedLearningGoal: z.string().optional().nullable(),
  projectBasedLearningGoal: z.string().optional().nullable(),
  selGoal: z.string().optional().nullable(),
  school2Vision: z.string().optional().nullable()
});

function emptyToNull(value: string | null) {
  const result = (value ?? "").trim();
  return result ? result : null;
}

function parseList(formData: FormData, key: string) {
  const direct = formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
  if (direct.length) return direct;

  const textarea = String(formData.get(`${key}Text`) ?? "")
    .split(/[\n,]/)
    .map((value) => value.trim())
    .filter(Boolean);
  return textarea;
}

export async function updateSchool(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const gradeBands = parseList(formData, "gradeBands");
  const priorityOutcomes = parseList(formData, "priorityOutcomes");
  const currentTooling = parseList(formData, "currentTooling");

  const data = schoolSchema.parse({
    name: String(formData.get("name") ?? "").trim(),
    city: String(formData.get("city") ?? "").trim(),
    region: emptyToNull(String(formData.get("region") ?? "")),
    timezone: String(formData.get("timezone") ?? "").trim(),
    type: emptyToNull(String(formData.get("type") ?? "")) as any,
    curriculum: emptyToNull(String(formData.get("curriculum") ?? "")),
    curriculumNotes: emptyToNull(String(formData.get("curriculumNotes") ?? "")),
    studentCount: emptyToNull(String(formData.get("studentCount") ?? "")) as any,
    enrollment: emptyToNull(String(formData.get("enrollment") ?? "")) as any,
    staffCount: emptyToNull(String(formData.get("staffCount") ?? "")) as any,
    deviceModel: emptyToNull(String(formData.get("deviceModel") ?? "")) as any,
    deviceRatio: emptyToNull(String(formData.get("deviceRatio") ?? "")),
    ecosystem: emptyToNull(String(formData.get("ecosystem") ?? "")) as any,
    connectivity: emptyToNull(String(formData.get("connectivity") ?? "")) as any,
    budgetSensitivity: emptyToNull(String(formData.get("budgetSensitivity") ?? "")) as any,
    constraints: emptyToNull(String(formData.get("constraints") ?? "")),
    nonNegotiables: emptyToNull(String(formData.get("nonNegotiables") ?? "")),
    aiAdoptionGoal: emptyToNull(String(formData.get("aiAdoptionGoal") ?? "")),
    individualizedLearningGoal: emptyToNull(String(formData.get("individualizedLearningGoal") ?? "")),
    projectBasedLearningGoal: emptyToNull(String(formData.get("projectBasedLearningGoal") ?? "")),
    selGoal: emptyToNull(String(formData.get("selGoal") ?? "")),
    school2Vision: emptyToNull(String(formData.get("school2Vision") ?? ""))
  });

  const updateData: any = {
      name: data.name,
      city: data.city,
      region: data.region ?? null,
      timezone: data.timezone,
      type: (data.type as any) ?? null,
      curriculum: data.curriculum ?? null,
      curriculumNotes: data.curriculumNotes ?? null,
      studentCount: (data.studentCount as any) ?? null,
      enrollment: (data.enrollment as any) ?? null,
      staffCount: (data.staffCount as any) ?? null,
      deviceModel: (data.deviceModel as any) ?? null,
      deviceRatio: data.deviceRatio ?? null,
      ecosystem: (data.ecosystem as any) ?? null,
      connectivity: (data.connectivity as any) ?? null,
      budgetSensitivity: (data.budgetSensitivity as any) ?? null,
      constraints: data.constraints ?? null,
      nonNegotiables: data.nonNegotiables ?? null,
      aiAdoptionGoal: data.aiAdoptionGoal ?? null,
      individualizedLearningGoal: data.individualizedLearningGoal ?? null,
      projectBasedLearningGoal: data.projectBasedLearningGoal ?? null,
      selGoal: data.selGoal ?? null,
      school2Vision: data.school2Vision ?? null,
      gradeBands: gradeBands.length ? gradeBands : null,
      priorityOutcomes: priorityOutcomes.length ? priorityOutcomes : null,
      currentTooling: currentTooling.length ? currentTooling : null
  };

  const updated = await prisma.school.update({
    where: { id: schoolId },
    data: updateData
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "school.update",
    entityType: "School",
    entityId: updated.id,
    metadata: {
      region: updated.region,
      enrollment: updated.enrollment,
      staffCount: updated.staffCount,
      budgetSensitivity: updated.budgetSensitivity,
      transformationStage: updated.transformationStage
    }
  });

  revalidatePath("/settings");
  revalidatePath("/transformation");
  redirect("/settings?success=School profile updated");
}

export async function setUserActive(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const userId = String(formData.get("userId") ?? "");
  const active = String(formData.get("active") ?? "true") === "true";

  if (!userId) redirect("/settings?error=Missing user");
  if (userId === session.user.id) redirect("/settings?error=You cannot deactivate your own account");

  const user = await prisma.user.findFirst({ where: { id: userId, schoolId } });
  if (!user) redirect("/settings?error=User not found");

  await prisma.user.update({ where: { id: user.id }, data: { active } });
  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: active ? "user.activate" : "user.deactivate",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role }
  });

  revalidatePath("/settings");
  redirect(`/settings?success=${encodeURIComponent(active ? "User activated" : "User deactivated")}`);
}

export async function setUserRole(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "STAFF") as any;

  if (!userId) redirect("/settings?error=Missing user");
  const user = await prisma.user.findFirst({ where: { id: userId, schoolId } });
  if (!user) redirect("/settings?error=User not found");

  await prisma.user.update({ where: { id: user.id }, data: { role } });
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
  if (userId === session.user.id) redirect("/settings?error=You cannot delete your own account");

  const user = await prisma.user.findFirst({ where: { id: userId, schoolId } });
  if (!user) redirect("/settings?error=User not found");

  await prisma.user.delete({ where: { id: user.id } });
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
