"use server";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { notifySchoolUsers } from "@/lib/notify";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { monthLabel } from "@/lib/format";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createUpdate(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const month = String(formData.get("month") ?? "").trim() || monthLabel(new Date());
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  const requiresTraining = String(formData.get("requiresTraining") ?? "false") === "true";
  const trainingModuleId = String(formData.get("trainingModuleId") ?? "").trim() || null;

  if (!title || !body) redirect("/updates?error=Title and body are required");

  let newTrainingVersion: number | null = null;

  if (requiresTraining) {
    if (!trainingModuleId) redirect("/updates?error=Select a training module");
    const mod = await prisma.trainingModule.findUnique({ where: { id: trainingModuleId } });
    if (!mod) redirect("/updates?error=Training module not found");

    const bumped = await prisma.trainingModule.update({
      where: { id: mod.id },
      data: { currentVersion: mod.currentVersion + 1 }
    });
    newTrainingVersion = bumped.currentVersion;
  }

  const post = await prisma.updatePost.create({
    data: {
      schoolId,
      month,
      title,
      body,
      requiresTraining,
      trainingModuleId: requiresTraining ? trainingModuleId : null,
      newTrainingVersion
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "update.create",
    entityType: "UpdatePost",
    entityId: post.id,
    metadata: { month, title, requiresTraining, trainingModuleId, newTrainingVersion }
  });

  await notifySchoolUsers({
    schoolId,
    type: requiresTraining ? "ALERT" : "INFO",
    title: requiresTraining ? "Training required: update posted" : "New update posted",
    body: title,
    link: "/updates"
  });

  revalidatePath("/updates");
  revalidatePath("/training");
  redirect("/updates?success=Update posted");
}
