import { prisma } from "@/lib/prisma";
export async function notifyUser(params: {
  userId: string;
  schoolId?: string | null;
  type?: "INFO" | "ALERT" | "ACTION";
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
  type?: "INFO" | "ALERT" | "ACTION";
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
