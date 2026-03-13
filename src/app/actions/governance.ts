"use server";

import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { createGovernanceDocument, createGovernanceVersion, answerGovernanceQuestion } from "@/lib/school2/governance";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const db = prisma as any;

function text(name: string, formData: FormData) {
  return String(formData.get(name) ?? "").trim();
}

export async function uploadGovernanceDocument(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const title = text("title", formData);
  const category = text("category", formData) || "OTHER";
  const body = text("body", formData);

  if (!title || !body) redirect("/governance?error=Title and document content are required");

  const result = await createGovernanceDocument({
    schoolId,
    createdById: session.user.id,
    title,
    category,
    summary: text("summary", formData) || null,
    description: text("description", formData) || null,
    body,
    originalFilename: text("originalFilename", formData) || null,
    mimeType: text("mimeType", formData) || null,
    storagePath: text("storagePath", formData) || null,
    notes: text("notes", formData) || null
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "governance.document.create",
    entityType: "GovernanceDocument",
    entityId: result.document.id,
    metadata: { title, category, version: result.version.version }
  });

  revalidatePath("/governance");
  redirect(`/governance/documents/${result.document.id}?success=Document created`);
}

export async function addGovernanceVersion(documentId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const document = await db.governanceDocument.findFirst({ where: { id: documentId, schoolId } });
  if (!document) redirect("/governance?error=Document not found");

  const body = text("body", formData);
  if (!body) redirect(`/governance/documents/${documentId}?error=Version content is required`);

  const version = await createGovernanceVersion({
    documentId,
    uploadedById: session.user.id,
    body,
    originalFilename: text("originalFilename", formData) || null,
    mimeType: text("mimeType", formData) || null,
    storagePath: text("storagePath", formData) || null,
    notes: text("notes", formData) || null
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "governance.version.create",
    entityType: "GovernanceDocumentVersion",
    entityId: version.id,
    metadata: { documentId, version: version.version }
  });

  revalidatePath(`/governance/documents/${documentId}`);
  redirect(`/governance/documents/${documentId}?success=Version added`);
}

export async function askGovernanceQuestion(formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const question = text("question", formData);
  if (!question) redirect("/governance?error=Question is required");

  const result = await answerGovernanceQuestion({
    schoolId,
    userId: session.user.id,
    question
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "governance.query",
    entityType: "GovernanceQuery",
    entityId: result.query.id,
    metadata: { question, confidence: result.query.confidence }
  });

  revalidatePath("/governance");
  redirect(`/governance?query=${result.query.id}`);
}

export async function pinGovernanceDocument(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const documentId = text("documentId", formData);
  const pinned = text("pinned", formData) === "true";

  const document = await db.governanceDocument.findFirst({ where: { id: documentId, schoolId } });
  if (!document) redirect("/governance?error=Document not found");

  await db.governanceDocument.update({ where: { id: documentId }, data: { pinned } });
  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: pinned ? "governance.pin" : "governance.unpin",
    entityType: "GovernanceDocument",
    entityId: documentId
  });

  revalidatePath("/governance");
  redirect("/governance?success=Document updated");
}
