"use server";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function directSetStudentToolAccess(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const studentId = String(formData.get("studentId") ?? "");
  const toolId = String(formData.get("toolId") ?? "");
  const enabled = String(formData.get("enabled") ?? "true") === "true";

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) redirect("/students?error=Student not found");

  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) redirect(`/students/${studentId}?error=Tool not found`);

  await prisma.studentToolAccess.upsert({
    where: { studentId_toolId: { studentId, toolId } },
    update: { enabled },
    create: { studentId, toolId, enabled }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "studenttool.set",
    entityType: "StudentToolAccess",
    entityId: null,
    metadata: { studentId, tool: tool.key, enabled }
  });

  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}?success=${encodeURIComponent("Student tool access updated")}`);
}

export async function requestStudentToolAccessChange(formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const studentId = String(formData.get("studentId") ?? "");
  const toolId = String(formData.get("toolId") ?? "");
  const enabled = String(formData.get("enabled") ?? "true") === "true";

  const student = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!student) redirect("/students?error=Student not found");

  const tool = await prisma.tool.findUnique({ where: { id: toolId } });
  if (!tool) redirect(`/students/${studentId}?error=Tool not found`);

  const req = await prisma.request.create({
    data: {
      schoolId,
      kind: "STUDENT_TOOL_ACCESS",
      type: `${enabled ? "Enable" : "Disable"} ${tool.name} for ${student.name}`,
      description: `Requested by ${session.user.email}.`,
      status: "SUBMITTED",
      decision: "PENDING",
      submittedById: session.user.id,
      toolId,
      studentId,
      desiredStudentToolEnabled: enabled
    }
  });

  await prisma.requestEvent.create({
    data: {
      requestId: req.id,
      actorId: session.user.id,
      type: "request.created",
      message: "Student tool access request submitted."
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "request.create_student_tool_change",
    entityType: "Request",
    entityId: req.id,
    metadata: { studentId, toolId, enabled }
  });

  revalidatePath("/requests");
  redirect(`/requests/${req.id}?success=Request submitted`);
}
