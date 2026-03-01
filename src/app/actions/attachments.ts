"use server";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { supabaseAdmin, attachmentsBucket } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function uploadToSupabase(path: string, file: File) {
  const supabase = supabaseAdmin();
  const bucket = attachmentsBucket();

  const buf = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(bucket).upload(path, buf, {
    contentType: file.type || "application/octet-stream",
    upsert: false
  });

  if (error) throw error;

  return { bucket, path };
}

export async function uploadRequestAttachment(requestId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const req = await prisma.request.findFirst({ where: { id: requestId, schoolId } });
  if (!req) redirect("/requests?error=Request not found");

  const file = formData.get("file");
  if (!(file instanceof File)) redirect(`/requests/${req.id}?error=No file uploaded`);

  const safeName = (file.name || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${schoolId}/requests/${req.id}/${crypto.randomUUID()}-${safeName}`;

  try {
    const { bucket, path } = await uploadToSupabase(objectPath, file);

    const attachment = await prisma.fileAttachment.create({
      data: {
        schoolId,
        requestId: req.id,
        uploadedById: session.user.id,
        bucket,
        path,
        filename: file.name || safeName,
        mimeType: file.type || "application/octet-stream",
        size: file.size
      }
    });

    await prisma.requestEvent.create({
      data: { requestId: req.id, actorId: session.user.id, type: "attachment.added", message: "Attachment uploaded." }
    });

    await auditLog({
      schoolId,
      actorId: session.user.id,
      action: "request.attachment_add",
      entityType: "FileAttachment",
      entityId: attachment.id,
      metadata: { requestId: req.id, filename: attachment.filename, size: attachment.size }
    });

    if (req.assignedToId && req.assignedToId !== session.user.id) {
      await notifyUser({
        userId: req.assignedToId,
        schoolId,
        type: "INFO",
        title: "New request attachment",
        body: req.type,
        link: `/requests/${req.id}`
      });
    }

    revalidatePath(`/requests/${req.id}`);
    redirect(`/requests/${req.id}?success=Attachment uploaded`);
  } catch (e) {
    console.error(e);
    redirect(`/requests/${req.id}?error=${encodeURIComponent("Upload failed. Check Supabase Storage env vars.")}`);
  }
}

export async function uploadTicketAttachment(ticketId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const ticket = await prisma.ticket.findFirst({ where: { id: ticketId, schoolId } });
  if (!ticket) redirect("/support?error=Ticket not found");

  const file = formData.get("file");
  if (!(file instanceof File)) redirect(`/support/${ticket.id}?error=No file uploaded`);

  const safeName = (file.name || "attachment").replace(/[^a-zA-Z0-9._-]/g, "_");
  const objectPath = `${schoolId}/tickets/${ticket.id}/${crypto.randomUUID()}-${safeName}`;

  try {
    const { bucket, path } = await uploadToSupabase(objectPath, file);

    const attachment = await prisma.fileAttachment.create({
      data: {
        schoolId,
        ticketId: ticket.id,
        uploadedById: session.user.id,
        bucket,
        path,
        filename: file.name || safeName,
        mimeType: file.type || "application/octet-stream",
        size: file.size
      }
    });

    await prisma.ticketEvent.create({
      data: { ticketId: ticket.id, actorId: session.user.id, type: "attachment.added", message: "Attachment uploaded." }
    });

    await auditLog({
      schoolId,
      actorId: session.user.id,
      action: "ticket.attachment_add",
      entityType: "FileAttachment",
      entityId: attachment.id,
      metadata: { ticketId: ticket.id, filename: attachment.filename, size: attachment.size }
    });

    if (ticket.assignedToId && ticket.assignedToId !== session.user.id) {
      await notifyUser({
        userId: ticket.assignedToId,
        schoolId,
        type: "INFO",
        title: "New ticket attachment",
        body: ticket.subject,
        link: `/support/${ticket.id}`
      });
    }

    revalidatePath(`/support/${ticket.id}`);
    redirect(`/support/${ticket.id}?success=Attachment uploaded`);
  } catch (e) {
    console.error(e);
    redirect(`/support/${ticket.id}?error=${encodeURIComponent("Upload failed. Check Supabase Storage env vars.")}`);
  }
}
