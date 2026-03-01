"use server";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { requireActiveSchool } from "@/lib/tenant";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(80, "Name is too long")
});

export async function updateMyProfile(formData: FormData) {
  const { session, schoolId } = await requireActiveSchool();

  const data = schema.parse({
    name: String(formData.get("name") ?? "").trim()
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: data.name }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "profile.update",
    entityType: "User",
    entityId: session.user.id,
    metadata: { name: data.name }
  });

  revalidatePath("/profile");
  redirect("/profile?success=Profile updated");
}
