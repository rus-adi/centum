import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function auditLog(
  params: {
    schoolId: string;
    actorId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: any;
  },
  db: DbClient = prisma
) {
  const { schoolId, actorId, action, entityType, entityId, metadata } = params;

  await db.auditLog.create({
    data: {
      schoolId,
      actorId: actorId ?? null,
      action,
      entityType,
      entityId: entityId ?? null,
      metadata: metadata ?? undefined
    }
  });
}
