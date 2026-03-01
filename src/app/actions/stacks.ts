"use server";

import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { auditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function requestStackBundle(formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const bundleKey = String(formData.get("bundleKey") ?? "");
  if (!bundleKey) redirect("/stacks?error=Missing bundle");

  const bundle = await prisma.stackBundle.findUnique({ where: { key: bundleKey } });
  if (!bundle) redirect("/stacks?error=Bundle not found");

  const req = await prisma.request.create({
    data: {
      schoolId,
      kind: "STACK_BUNDLE",
      type: `Request stack bundle: ${bundle.name}`,
      description: `Request enabling the '${bundle.name}' bundle (${bundle.category}).`,
      status: "SUBMITTED",
      submittedById: session.user.id
    }
  });

  await prisma.requestEvent.create({
    data: {
      requestId: req.id,
      actorId: session.user.id,
      type: "request.created",
      message: `Requested stack bundle: ${bundle.name}`
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "stacks.request_bundle",
    entityType: "Request",
    entityId: req.id,
    metadata: { bundleKey: bundle.key, bundleName: bundle.name }
  });

  revalidatePath("/requests");
  revalidatePath("/stacks");
  redirect("/stacks?success=Request submitted");
}
