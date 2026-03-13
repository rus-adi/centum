"use server";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function completeNextLesson(moduleId: string) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const trainingModule = await prisma.trainingModule.findUnique({ where: { id: moduleId } });
  if (!trainingModule) redirect("/training?error=Module not found");

  const version = trainingModule.currentVersion;
  const existing = await prisma.trainingProgress.findFirst({ where: { userId: session.user.id, moduleId: trainingModule.id, version } });
  const lessonsCompleted = existing ? existing.lessonsCompleted : 0;
  const next = Math.min(trainingModule.totalLessons, lessonsCompleted + 1);

  await prisma.trainingProgress.upsert({
    where: { userId_moduleId_version: { userId: session.user.id, moduleId: trainingModule.id, version } },
    update: { lessonsCompleted: next },
    create: { userId: session.user.id, moduleId: trainingModule.id, version, lessonsCompleted: next }
  });

  if (next >= trainingModule.totalLessons) {
    await prisma.trainingCompletion.upsert({
      where: { userId_moduleId_version: { userId: session.user.id, moduleId: trainingModule.id, version } },
      update: {},
      create: { userId: session.user.id, moduleId: trainingModule.id, version }
    });
  }

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "training.progress",
    entityType: "TrainingModule",
    entityId: trainingModule.id,
    metadata: { version, lessonsCompleted: next, title: trainingModule.title }
  });

  revalidatePath("/training");
  redirect(`/training?success=${encodeURIComponent(next >= trainingModule.totalLessons ? "Module completed" : "Progress saved")}`);
}

export async function resetTrainingProgress(moduleId: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const trainingModule = await prisma.trainingModule.findUnique({ where: { id: moduleId } });
  if (!trainingModule) redirect("/training?error=Module not found");

  const version = trainingModule.currentVersion;
  await prisma.trainingProgress.deleteMany({ where: { userId: session.user.id, moduleId: trainingModule.id, version } });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "training.reset_progress",
    entityType: "TrainingModule",
    entityId: trainingModule.id,
    metadata: { version }
  });

  revalidatePath("/training");
  redirect("/training?success=Progress reset");
}
