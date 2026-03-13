"use server";

import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const db = prisma as any;

function text(name: string, formData: FormData) {
  return String(formData.get(name) ?? "").trim();
}

export async function setPackStatus(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const packId = text("packId", formData);
  const status = text("status", formData) || "PLANNING";
  const notes = text("notes", formData) || null;

  const adoption = await db.schoolPackAdoption.upsert({
    where: { schoolId_packId: { schoolId, packId } },
    update: {
      status,
      notes,
      ownerId: session.user.id,
      startedAt: status === "IN_PROGRESS" || status === "ACTIVE" ? new Date() : undefined,
      completedAt: status === "COMPLETE" ? new Date() : null
    },
    create: {
      schoolId,
      packId,
      status,
      notes,
      ownerId: session.user.id,
      startedAt: status === "IN_PROGRESS" || status === "ACTIVE" ? new Date() : null,
      completedAt: status === "COMPLETE" ? new Date() : null
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "pack.status.update",
    entityType: "SchoolPackAdoption",
    entityId: adoption.id,
    metadata: { packId, status }
  });

  revalidatePath("/packs");
  redirect("/packs?success=Pack updated");
}
