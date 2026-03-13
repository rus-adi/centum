"use server";

import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { auditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const db = prisma as any;

export async function requestStackBundle(formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const bundleKey = String(formData.get("bundleKey") ?? "");
  if (!bundleKey) redirect("/stacks?error=Missing bundle");

  const bundle = await prisma.stackBundle.findUnique({ where: { key: bundleKey } });
  if (!bundle) redirect("/stacks?error=Bundle not found");

  await db.schoolBundleAdoption.upsert({
    where: { schoolId_bundleId: { schoolId, bundleId: bundle.id } },
    update: {
      status: "PLANNING",
      notes: `Requested by ${session.user.email}`,
      ownerId: session.user.id
    },
    create: {
      schoolId,
      bundleId: bundle.id,
      status: "PLANNING",
      notes: `Requested by ${session.user.email}`,
      ownerId: session.user.id
    }
  });

  const req = await prisma.request.create({
    data: {
      schoolId,
      kind: "STACK_BUNDLE",
      type: `Request bundle: ${bundle.name}`,
      description: `Request enabling the '${bundle.name}' bundle (${bundle.category}).`,
      status: "SUBMITTED",
      submittedById: session.user.id,
      bundleKey,
      requestContext: { category: bundle.category, bundleName: bundle.name }
    }
  });

  await prisma.requestEvent.create({
    data: {
      requestId: req.id,
      actorId: session.user.id,
      type: "request.created",
      message: `Requested bundle: ${bundle.name}`
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

export async function setBundleStatus(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const bundleId = String(formData.get("bundleId") ?? "");
  const status = String(formData.get("status") ?? "PLANNING") || "PLANNING";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await db.schoolBundleAdoption.upsert({
    where: { schoolId_bundleId: { schoolId, bundleId } },
    update: { status, notes, ownerId: session.user.id },
    create: { schoolId, bundleId, status, notes, ownerId: session.user.id }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "bundle.status.update",
    entityType: "SchoolBundleAdoption",
    entityId: bundleId,
    metadata: { status }
  });

  revalidatePath("/stacks");
  redirect("/stacks?success=Bundle updated");
}
