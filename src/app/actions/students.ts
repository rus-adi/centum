"use server";

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { requireActiveSchool } from "@/lib/tenant";
import { requireRole } from "@/lib/rbac";
import { parseCSV } from "@/lib/csv";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

function normalizeStudentCode(code: string | null | undefined) {
  const cleaned = (code ?? "").trim();
  if (!cleaned) return null;
  return cleaned.toUpperCase();
}

const schema = z.object({
  studentCode: z.string().optional().nullable(),
  name: z.string().min(1),
  grade: z.coerce.number().int().min(1).max(12),
  status: z.enum(["ACTIVE", "PENDING", "DISABLED"]).optional(),
  coachName: z.string().optional().nullable()
});

export async function createStudent(formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER"]);
  const { schoolId } = await requireActiveSchool();

  const data = schema.parse({
    studentCode: String(formData.get("studentCode") ?? "").trim() || null,
    name: String(formData.get("name") ?? "").trim(),
    grade: formData.get("grade"),
    status: String(formData.get("status") ?? "ACTIVE"),
    coachName: String(formData.get("coachName") ?? "").trim() || null
  });

  const studentCode = normalizeStudentCode(data.studentCode);

  // Fast, user-friendly duplicate check.
  if (studentCode) {
    const dup = await prisma.student.findFirst({ where: { schoolId, studentCode } });
    if (dup) {
      redirect(`/students/new?error=${encodeURIComponent(`Student code '${studentCode}' already exists.`)}`);
    }
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const student = await tx.student.create({
        data: {
          schoolId,
          studentCode,
          name: data.name,
          grade: data.grade,
          status: data.status ?? "ACTIVE",
          coachName: data.coachName || null
        }
      });

      await auditLog(
        {
          schoolId,
          actorId: session.user.id,
          action: "student.create",
          entityType: "Student",
          entityId: student.id,
          metadata: { studentCode: student.studentCode, name: student.name, grade: student.grade, status: student.status }
        },
        tx
      );
    });

    revalidatePath("/students");
    redirect("/students?success=Student created");
  } catch (e: any) {
    const isDup = e?.code === "P2002";
    redirect(
      `/students/new?error=${encodeURIComponent(
        isDup ? `Student code '${studentCode ?? ""}' already exists.` : "Failed to create student. Please try again."
      )}`
    );
  }
}

export async function updateStudent(studentId: string, formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "COACH", "TEACHER"]);
  const { schoolId } = await requireActiveSchool();

  const data = schema.parse({
    studentCode: String(formData.get("studentCode") ?? "").trim() || null,
    name: String(formData.get("name") ?? "").trim(),
    grade: formData.get("grade"),
    status: String(formData.get("status") ?? "ACTIVE"),
    coachName: String(formData.get("coachName") ?? "").trim() || null
  });

  const studentCode = normalizeStudentCode(data.studentCode);

  // Ensure student belongs to school
  const existing = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!existing) redirect("/students?error=Student not found");

  // Duplicate check (ignore self)
  if (studentCode) {
    const dup = await prisma.student.findFirst({ where: { schoolId, studentCode, id: { not: existing.id } } });
    if (dup) {
      redirect(`/students/${studentId}?error=${encodeURIComponent(`Student code '${studentCode}' already exists.`)}`);
    }
  }

  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.student.update({
        where: { id: existing.id },
        data: {
          studentCode,
          name: data.name,
          grade: data.grade,
          status: data.status ?? "ACTIVE",
          coachName: data.coachName || null
        }
      });

      await auditLog(
        {
          schoolId,
          actorId: session.user.id,
          action: "student.update",
          entityType: "Student",
          entityId: updated.id,
          metadata: { studentCode: updated.studentCode, name: updated.name, grade: updated.grade, status: updated.status }
        },
        tx
      );
    });

    revalidatePath("/students");
    revalidatePath(`/students/${studentId}`);
    redirect(`/students/${studentId}?success=Student updated`);
  } catch (e: any) {
    const isDup = e?.code === "P2002";
    redirect(
      `/students/${studentId}?error=${encodeURIComponent(
        isDup ? `Student code '${studentCode ?? ""}' already exists.` : "Failed to update student. Please try again."
      )}`
    );
  }
}

export async function deleteStudent(studentId: string) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const existing = await prisma.student.findFirst({ where: { id: studentId, schoolId } });
  if (!existing) redirect("/students?error=Student not found");

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.student.delete({ where: { id: existing.id } });

    await auditLog(
      {
        schoolId,
        actorId: session.user.id,
        action: "student.delete",
        entityType: "Student",
        entityId: existing.id,
        metadata: { studentCode: existing.studentCode, name: existing.name }
      },
      tx
    );
  });

  revalidatePath("/students");
  redirect("/students?success=Student deleted");
}

export async function importStudentsCSV(formData: FormData) {
  const session = await requireRole(["ADMIN", "STAFF", "IT", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();

  const file = formData.get("file");
  if (!(file instanceof File)) redirect("/students/import?error=No file uploaded");

  const text = await file.text();
  const { headers, rows } = parseCSV(text);

  // Expected headers: studentCode,name,grade,status,coachName
  const errors: string[] = [];
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 2; // header = line 1
    const studentCode = normalizeStudentCode((r.studentCode ?? r.code ?? "").trim() || null);
    const name = (r.name ?? "").trim();
    const gradeRaw = (r.grade ?? "").trim();
    const grade = parseInt(gradeRaw, 10);
    const statusRaw = ((r.status ?? "ACTIVE") as string).trim().toUpperCase();
    const coachName = (r.coachName ?? r.coach ?? "").trim() || null;

    if (!name || !Number.isFinite(grade)) {
      skipped++;
      errors.push(`Row ${rowNum}: missing name or grade`);
      continue;
    }
    if (grade < 1 || grade > 12) {
      skipped++;
      errors.push(`Row ${rowNum}: grade must be 1–12`);
      continue;
    }

    const status = ["ACTIVE", "PENDING", "DISABLED"].includes(statusRaw) ? (statusRaw as any) : "ACTIVE";

    if (studentCode) {
      const dup = await prisma.student.findFirst({ where: { schoolId, studentCode } });
      if (dup) {
        skipped++;
        errors.push(`Row ${rowNum}: studentCode '${studentCode}' already exists`);
        continue;
      }
    }

    try {
      await prisma.student.create({
        data: { schoolId, studentCode, name, grade, status, coachName }
      });
      created++;
    } catch (e: any) {
      skipped++;
      errors.push(`Row ${rowNum}: failed to create (maybe duplicate studentCode)`);
    }
  }

  await auditLog({
    schoolId,
    actorId: session.user.id,
    action: "student.import_csv",
    entityType: "Student",
    entityId: null,
    metadata: { created, skipped, headers }
  });

  revalidatePath("/students");

  const msg = `Imported ${created} students. Skipped ${skipped}.`;
  if (errors.length > 0) {
    const preview = errors.slice(0, 6).join(" | ");
    redirect(`/students?info=${encodeURIComponent(msg + " Errors: " + preview + (errors.length > 6 ? " …" : ""))}`);
  }

  redirect(`/students?success=${encodeURIComponent(msg)}`);
}
