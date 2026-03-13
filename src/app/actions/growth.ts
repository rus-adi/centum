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

export async function createGrowthAsset(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const title = text("title", formData);
  const body = text("body", formData);
  if (!title || !body) redirect("/growth?error=Title and body are required");

  const asset = await db.growthAsset.create({
    data: {
      schoolId,
      slug: text("slug", formData) || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title,
      type: text("type", formData) || "FAQ",
      audience: text("audience", formData) || null,
      description: text("description", formData) || null,
      body,
      createdById: session.user.id
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "growth.create",
    entityType: "GrowthAsset",
    entityId: asset.id,
    metadata: { type: asset.type }
  });

  revalidatePath("/growth");
  redirect(`/growth/${asset.slug}?success=Asset created`);
}
