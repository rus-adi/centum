"use server";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { notifySchoolUsers } from "@/lib/notify";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const db = prisma as any;

export async function directToggleSchoolTool(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const toolId = String(formData.get("toolId") ?? "");
  const enabled = String(formData.get("enabled") ?? "false") === "true";

  if (!toolId) redirect("/tools?error=Missing tool");

  const st = await prisma.schoolTool.findFirst({ where: { schoolId, toolId }, include: { tool: true } });
  if (!st) redirect("/tools?error=Tool not found");

  if (enabled) {
    const reqs = await prisma.toolRequirement.findMany({ where: { toolId }, include: { module: true } });
    if (reqs.length > 0) {
      const completions = await prisma.trainingCompletion.findMany({
        where: { userId: session.user.id, moduleId: { in: reqs.map((req: any) => req.moduleId) } }
      });
      const completionSet = new Set(completions.map((completion: any) => `${completion.moduleId}:${completion.version}`));
      const missing = reqs.filter((req: any) => !completionSet.has(`${req.moduleId}:${req.module.currentVersion}`));

      if (missing.length > 0) {
        const names = missing.map((item: any) => item.module.title).join(", ");
        redirect(`/tools?error=${encodeURIComponent(`Training required before enabling: ${names}`)}`);
      }
    }
  }

  await prisma.schoolTool.update({
    where: { id: st.id },
    data: { enabled, recommended: enabled ? st.recommended : st.recommended }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "schooltool.toggle",
    entityType: "SchoolTool",
    entityId: st.id,
    metadata: { tool: st.tool.key, enabled }
  });

  await notifySchoolUsers({
    schoolId,
    type: "INFO",
    title: `Tool ${enabled ? "enabled" : "disabled"}: ${st.tool.name}`,
    body: "Tool availability has been updated.",
    link: "/tools"
  });

  revalidatePath("/tools");
  redirect(`/tools?success=${encodeURIComponent("Tool updated")}`);
}

export async function requestSchoolToolChange(formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const toolId = String(formData.get("toolId") ?? "");
  const desired = String(formData.get("enabled") ?? "true") === "true";

  if (!toolId) redirect("/tools?error=Missing tool");

  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) redirect("/tools?error=Tool not found");

  const req = await prisma.request.create({
    data: {
      schoolId,
      kind: "TOOL_ENABLE",
      type: `${desired ? "Enable" : "Disable"} ${tool.name}`,
      description: `Requested by ${session.user.email}.`,
      status: "SUBMITTED",
      decision: "PENDING",
      submittedById: session.user.id,
      toolId,
      desiredSchoolToolEnabled: desired,
      requestContext: { requestedFrom: "tool-catalog-v2", visibility: tool.visibility }
    }
  });

  await prisma.requestEvent.create({
    data: {
      requestId: req.id,
      actorId: session.user.id,
      type: "request.created",
      message: "Tool change request submitted."
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "request.create_tool_change",
    entityType: "Request",
    entityId: req.id,
    metadata: { toolId, desired }
  });

  revalidatePath("/requests");
  redirect(`/requests/${req.id}?success=Request submitted`);
}

export async function setToolRecommendationStatus(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const toolId = String(formData.get("toolId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || "Recommended by School 2.0 review.";
  const status = String(formData.get("status") ?? "PENDING").trim() || "PENDING";

  if (!toolId) redirect("/tools?error=Missing tool");

  await db.toolRecommendation.upsert({
    where: { schoolId_toolId: { schoolId, toolId } },
    update: { reason, status, recommendedById: session.user.id },
    create: { schoolId, toolId, reason, status, recommendedById: session.user.id }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "tool.recommendation.update",
    entityType: "ToolRecommendation",
    entityId: toolId,
    metadata: { status }
  });

  revalidatePath("/tools");
  redirect("/tools?success=Recommendation updated");
}
