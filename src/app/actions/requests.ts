"use server";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const db = prisma as any;

const createSchema = z.object({
  type: z.string().min(1),
  description: z.string().optional().nullable()
});

export async function createRequest(formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const data = createSchema.parse({
    type: String(formData.get("type") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim()
  });

  const req = await prisma.request.create({
    data: {
      schoolId,
      kind: "GENERAL",
      type: data.type,
      description: data.description || null,
      status: "SUBMITTED",
      submittedById: session.user.id
    }
  });

  await prisma.requestEvent.create({
    data: { requestId: req.id, actorId: session.user.id, type: "request.created", message: "Request submitted." }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "request.create",
    entityType: "Request",
    entityId: req.id,
    metadata: { type: req.type }
  });

  const admins = await prisma.user.findMany({ where: { schoolId, active: true, role: { in: ["ADMIN", "IT"] } } });
  for (const user of admins) {
    await notifyUser({
      userId: user.id,
      schoolId,
      type: "ACTION",
      title: "New request submitted",
      body: req.type,
      link: `/requests/${req.id}`
    });
  }

  revalidatePath("/requests");
  redirect(`/requests/${req.id}?success=Request submitted`);
}

export async function updateRequestStatus(requestId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const status = String(formData.get("status") ?? "SUBMITTED") as any;

  const req = await prisma.request.findFirst({ where: { id: requestId, schoolId } });
  if (!req) redirect("/requests?error=Request not found");

  await prisma.request.update({ where: { id: req.id }, data: { status } });
  await prisma.requestEvent.create({
    data: { requestId: req.id, actorId: session.user.id, type: "status.changed", message: `Status changed to ${status}.` }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "request.update_status",
    entityType: "Request",
    entityId: req.id,
    metadata: { status }
  });

  if (req.assignedToId) {
    await notifyUser({
      userId: req.assignedToId,
      schoolId,
      type: "INFO",
      title: "Request status updated",
      body: `${req.type} → ${status}`,
      link: `/requests/${req.id}`
    });
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${req.id}`);
  redirect(`/requests/${req.id}?success=Status updated`);
}

export async function assignRequest(requestId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const assignedToId = String(formData.get("assignedToId") ?? "").trim();

  const req = await prisma.request.findFirst({ where: { id: requestId, schoolId } });
  if (!req) redirect("/requests?error=Request not found");

  await prisma.request.update({
    where: { id: req.id },
    data: { assignedToId: assignedToId || null, status: "IN_PROGRESS" }
  });

  await prisma.requestEvent.create({
    data: { requestId: req.id, actorId: session.user.id, type: "request.assigned", message: assignedToId ? "Assigned." : "Unassigned." }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "request.assign",
    entityType: "Request",
    entityId: req.id,
    metadata: { assignedToId: assignedToId || null }
  });

  if (assignedToId) {
    await notifyUser({
      userId: assignedToId,
      schoolId,
      type: "ACTION",
      title: "You were assigned a request",
      body: req.type,
      link: `/requests/${req.id}`
    });
  }

  revalidatePath("/requests");
  revalidatePath(`/requests/${req.id}`);
  redirect(`/requests/${req.id}?success=Assignment updated`);
}

export async function addRequestComment(requestId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/requests/${requestId}?error=Comment cannot be empty`);

  const req = await prisma.request.findFirst({ where: { id: requestId, schoolId } });
  if (!req) redirect("/requests?error=Request not found");

  const comment = await prisma.requestComment.create({ data: { requestId: req.id, authorId: session.user.id, body } });
  await prisma.requestEvent.create({ data: { requestId: req.id, actorId: session.user.id, type: "comment.added", message: "Comment added." } });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "request.comment",
    entityType: "RequestComment",
    entityId: comment.id,
    metadata: { requestId: req.id }
  });

  if (req.assignedToId && req.assignedToId !== session.user.id) {
    await notifyUser({
      userId: req.assignedToId,
      schoolId,
      type: "INFO",
      title: "New request comment",
      body: req.type,
      link: `/requests/${req.id}`
    });
  }

  revalidatePath(`/requests/${req.id}`);
  redirect(`/requests/${req.id}?success=Comment added`);
}

export async function decideRequest(requestId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const decision = String(formData.get("decision") ?? "APPROVED") as "APPROVED" | "DENIED";

  const req = await prisma.request.findFirst({
    where: { id: requestId, schoolId },
    include: { tool: true, student: true }
  });
  if (!req) redirect("/requests?error=Request not found");

  if (decision === "APPROVED") {
    if (req.kind === "TOOL_ENABLE" && req.toolId != null && req.desiredSchoolToolEnabled != null) {
      const schoolTool = await prisma.schoolTool.findFirst({ where: { schoolId, toolId: req.toolId } });
      if (schoolTool) {
        await prisma.schoolTool.update({ where: { id: schoolTool.id }, data: { enabled: req.desiredSchoolToolEnabled } });
      }
    }

    if (req.kind === "STUDENT_TOOL_ACCESS" && req.toolId && req.studentId && req.desiredStudentToolEnabled != null) {
      await prisma.studentToolAccess.upsert({
        where: { studentId_toolId: { studentId: req.studentId, toolId: req.toolId } },
        update: { enabled: req.desiredStudentToolEnabled },
        create: { studentId: req.studentId, toolId: req.toolId, enabled: req.desiredStudentToolEnabled }
      });
    }

    if (req.kind === "STACK_BUNDLE" && req.bundleKey) {
      const bundle = await prisma.stackBundle.findUnique({ where: { key: req.bundleKey } });
      if (bundle) {
        await db.schoolBundleAdoption.upsert({
          where: { schoolId_bundleId: { schoolId, bundleId: bundle.id } },
          update: { status: "ACTIVE", ownerId: session.user.id },
          create: { schoolId, bundleId: bundle.id, status: "ACTIVE", ownerId: session.user.id }
        });
      }
    }

    if (req.packKey) {
      const pack = await db.transformationPack.findUnique({ where: { key: req.packKey } });
      if (pack) {
        await db.schoolPackAdoption.upsert({
          where: { schoolId_packId: { schoolId, packId: pack.id } },
          update: { status: "ACTIVE", ownerId: session.user.id },
          create: { schoolId, packId: pack.id, status: "ACTIVE", ownerId: session.user.id }
        });
      }
    }
  } else {
    if (req.kind === "STACK_BUNDLE" && req.bundleKey) {
      const bundle = await prisma.stackBundle.findUnique({ where: { key: req.bundleKey } });
      if (bundle) {
        await db.schoolBundleAdoption.upsert({
          where: { schoolId_bundleId: { schoolId, bundleId: bundle.id } },
          update: { status: "DEFERRED", ownerId: session.user.id },
          create: { schoolId, bundleId: bundle.id, status: "DEFERRED", ownerId: session.user.id }
        });
      }
    }
  }

  await prisma.request.update({ where: { id: req.id }, data: { decision, status: "COMPLETED" } });
  await prisma.requestEvent.create({
    data: {
      requestId: req.id,
      actorId: session.user.id,
      type: `decision.${decision.toLowerCase()}`,
      message: `Decision: ${decision}.`
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "request.decision",
    entityType: "Request",
    entityId: req.id,
    metadata: { decision, kind: req.kind, bundleKey: req.bundleKey, packKey: req.packKey }
  });

  if (req.submittedById) {
    await notifyUser({
      userId: req.submittedById,
      schoolId,
      type: "INFO",
      title: `Request ${decision.toLowerCase()}`,
      body: req.type,
      link: `/requests/${req.id}`
    });
  }

  revalidatePath("/requests");
  revalidatePath("/tools");
  revalidatePath("/stacks");
  revalidatePath("/packs");
  revalidatePath(`/students/${req.studentId ?? ""}`);
  revalidatePath(`/requests/${req.id}`);
  redirect(`/requests/${req.id}?success=Decision recorded`);
}

export async function deleteRequest(requestId: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const req = await prisma.request.findFirst({ where: { id: requestId, schoolId } });
  if (!req) redirect("/requests?error=Request not found");

  await prisma.request.delete({ where: { id: req.id } });
  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "request.delete",
    entityType: "Request",
    entityId: req.id,
    metadata: { type: req.type }
  });

  revalidatePath("/requests");
  redirect("/requests?success=Request deleted");
}
