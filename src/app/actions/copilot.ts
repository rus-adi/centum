"use server";

import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { runTransformationCopilot } from "@/lib/school2/copilot";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const db = prisma as any;

function text(name: string, formData: FormData) {
  return String(formData.get(name) ?? "").trim();
}

export async function generateCopilotRun() {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const result = await runTransformationCopilot({ schoolId, userId: session.user.id });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "copilot.run.create",
    entityType: "CopilotRun",
    entityId: result.run.id,
    metadata: { readinessScore: result.run.readinessScore, maturityScore: result.run.maturityScore }
  });

  revalidatePath("/transformation");
  revalidatePath("/transformation/report");
  redirect(`/transformation?run=${result.run.id}`);
}

export async function updateCopilotRecommendationStatus(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const recommendationId = text("recommendationId", formData);
  const status = text("status", formData) || "PENDING";

  const recommendation = await db.copilotRecommendation.findFirst({ where: { id: recommendationId, schoolId } });
  if (!recommendation) redirect("/transformation?error=Recommendation not found");

  await db.copilotRecommendation.update({ where: { id: recommendationId }, data: { status } });
  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "copilot.recommendation.update",
    entityType: "CopilotRecommendation",
    entityId: recommendationId,
    metadata: { status }
  });

  revalidatePath("/transformation");
  redirect("/transformation?success=Recommendation updated");
}
