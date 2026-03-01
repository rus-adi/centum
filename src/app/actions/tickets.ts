"use server";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSchema = z.object({
  category: z.string().min(1),
  subject: z.string().min(1),
  description: z.string().min(1)
});

export async function createTicket(formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const data = createSchema.parse({
    category: String(formData.get("category") ?? "").trim(),
    subject: String(formData.get("subject") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim()
  });

  const ticket = await prisma.ticket.create({
    data: {
      schoolId,
      category: data.category,
      subject: data.subject,
      description: data.description,
      status: "OPEN",
      submittedById: session.user.id
    }
  });

  await prisma.ticketEvent.create({
    data: { ticketId: ticket.id, actorId: session.user.id, type: "ticket.created", message: "Ticket submitted." }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "ticket.create",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: { subject: ticket.subject }
  });

  // Notify IT/Admin
  const itUsers = await prisma.user.findMany({ where: { schoolId, active: true, role: { in: ["ADMIN", "IT"] } } });
  for (const u of itUsers) {
    await notifyUser({
      userId: u.id,
      schoolId,
      type: "ACTION",
      title: "New support ticket",
      body: ticket.subject,
      link: `/support/${ticket.id}`
    });
  }

  revalidatePath("/support");
  redirect(`/support/${ticket.id}?success=Ticket created`);
}

export async function updateTicketStatus(ticketId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const status = String(formData.get("status") ?? "OPEN") as any;

  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, schoolId } });
  if (!ticket) redirect("/support?error=Ticket not found");

  await prisma.ticket.update({ where: { id: ticket.id }, data: { status } });

  await prisma.ticketEvent.create({
    data: { ticketId: ticket.id, actorId: session.user.id, type: "status.changed", message: `Status changed to ${status}.` }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "ticket.update_status",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: { status }
  });

  if (ticket.assignedToId) {
    await notifyUser({
      userId: ticket.assignedToId,
      schoolId,
      type: "INFO",
      title: "Ticket status updated",
      body: `${ticket.subject} → ${status}`,
      link: `/support/${ticket.id}`
    });
  }

  revalidatePath("/support");
  revalidatePath(`/support/${ticket.id}`);
  redirect(`/support/${ticket.id}?success=Status updated`);
}

export async function assignTicket(ticketId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const assignedToId = String(formData.get("assignedToId") ?? "").trim();

  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, schoolId } });
  if (!ticket) redirect("/support?error=Ticket not found");

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { assignedToId: assignedToId || null, status: "IN_PROGRESS" }
  });

  await prisma.ticketEvent.create({
    data: {
      ticketId: ticket.id,
      actorId: session.user.id,
      type: "ticket.assigned",
      message: assignedToId ? "Assigned." : "Unassigned."
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "ticket.assign",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: { assignedToId: assignedToId || null }
  });

  if (assignedToId) {
    await notifyUser({
      userId: assignedToId,
      schoolId,
      type: "ACTION",
      title: "You were assigned a ticket",
      body: ticket.subject,
      link: `/support/${ticket.id}`
    });
  }

  revalidatePath("/support");
  revalidatePath(`/support/${ticket.id}`);
  redirect(`/support/${ticket.id}?success=Assignment updated`);
}

export async function addTicketComment(ticketId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const body = String(formData.get("body") ?? "").trim();
  if (!body) redirect(`/support/${ticketId}?error=Comment cannot be empty`);

  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, schoolId } });
  if (!ticket) redirect("/support?error=Ticket not found");

  const comment = await prisma.ticketComment.create({
    data: { ticketId: ticket.id, authorId: session.user.id, body }
  });

  await prisma.ticketEvent.create({
    data: { ticketId: ticket.id, actorId: session.user.id, type: "comment.added", message: "Comment added." }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "ticket.comment",
    entityType: "TicketComment",
    entityId: comment.id,
    metadata: { ticketId: ticket.id }
  });

  if (ticket.assignedToId && ticket.assignedToId !== session.user.id) {
    await notifyUser({
      userId: ticket.assignedToId,
      schoolId,
      type: "INFO",
      title: "New ticket comment",
      body: ticket.subject,
      link: `/support/${ticket.id}`
    });
  }

  revalidatePath(`/support/${ticket.id}`);
  redirect(`/support/${ticket.id}?success=Comment added`);
}

export async function deleteTicket(ticketId: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, schoolId } });
  if (!ticket) redirect("/support?error=Ticket not found");

  await prisma.ticket.delete({ where: { id: ticket.id } });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "ticket.delete",
    entityType: "Ticket",
    entityId: ticket.id,
    metadata: { subject: ticket.subject }
  });

  revalidatePath("/support");
  redirect("/support?success=Ticket deleted");
}
