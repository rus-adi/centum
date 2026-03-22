import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function notifyUser(params: {
  userId: string;
  schoolId?: string | null;
  type?: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  const { userId, schoolId, type = "INFO", title, body, link } = params;
  await prisma.notification.create({
    data: { userId, schoolId: schoolId ?? null, type, title, body, link }
  });
}

export async function notifySchoolUsers(params: {
  schoolId: string;
  type?: NotificationType;
  title: string;
  body?: string;
  link?: string;
}) {
  const { schoolId, type = "INFO", title, body, link } = params;
  const users = await prisma.user.findMany({ where: { schoolId, active: true } });
  if (users.length === 0) return;

  await prisma.notification.createMany({
    data: users.map((u) => ({
      userId: u.id,
      schoolId,
      type,
      title,
      body,
      link
    }))
  });
}
