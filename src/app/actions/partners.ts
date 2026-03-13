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

export async function createVendor(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const name = text("name", formData);
  if (!name) redirect("/partners?error=Vendor name is required");

  const vendor = await db.vendor.upsert({
    where: { key: text("key", formData) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
    update: {
      name,
      website: text("website", formData) || null,
      description: text("description", formData) || null,
      notes: text("notes", formData) || null
    },
    create: {
      key: text("key", formData) || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      website: text("website", formData) || null,
      description: text("description", formData) || null,
      notes: text("notes", formData) || null
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "vendor.upsert",
    entityType: "Vendor",
    entityId: vendor.id,
    metadata: { name: vendor.name }
  });

  revalidatePath("/partners");
  redirect("/partners?success=Vendor saved");
}

export async function createLicense(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const vendorId = text("vendorId", formData);
  const name = text("name", formData);
  if (!vendorId || !name) redirect("/partners?error=Vendor and license name are required");

  const license = await db.license.create({
    data: {
      schoolId,
      vendorId,
      toolId: text("toolId", formData) || null,
      name,
      status: text("status", formData) || "PLANNING",
      seatsPurchased: text("seatsPurchased", formData) ? Number(text("seatsPurchased", formData)) : null,
      seatsAssigned: text("seatsAssigned", formData) ? Number(text("seatsAssigned", formData)) : null,
      renewalDate: text("renewalDate", formData) ? new Date(text("renewalDate", formData)) : null,
      costNotes: text("costNotes", formData) || null,
      ownerName: text("ownerName", formData) || null,
      ownerEmail: text("ownerEmail", formData) || null,
      implementationNotes: text("implementationNotes", formData) || null
    }
  });

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "license.create",
    entityType: "License",
    entityId: license.id,
    metadata: { vendorId, name }
  });

  revalidatePath("/partners");
  redirect("/partners?success=License saved");
}

export async function updateLicenseStatus(formData: FormData) {
  const session = await requireRole(["ADMIN", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const licenseId = text("licenseId", formData);
  const status = text("status", formData) || "ACTIVE";

  const license = await db.license.findFirst({ where: { id: licenseId, schoolId } });
  if (!license) redirect("/partners?error=License not found");

  await db.license.update({ where: { id: licenseId }, data: { status } });
  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "license.status.update",
    entityType: "License",
    entityId: licenseId,
    metadata: { status }
  });

  revalidatePath("/partners");
  redirect("/partners?success=License updated");
}
