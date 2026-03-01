"use server";

import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function markNotificationRead(formData: FormData) {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/notifications?error=Missing notification");

  const note = await prisma.notification.findFirst({ where: { id, userId: session.user.id } });
  if (!note) redirect("/notifications?error=Not found");

  await prisma.notification.update({ where: { id: note.id }, data: { readAt: new Date() } });
  revalidatePath("/notifications");
  redirect("/notifications?success=Marked as read");
}

export async function markAllNotificationsRead() {
  const session = await requireSession();
  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() }
  });
  revalidatePath("/notifications");
  redirect("/notifications?success=All notifications marked as read");
}
