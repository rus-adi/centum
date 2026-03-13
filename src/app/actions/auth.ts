"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { requireActiveSchool } from "@/lib/tenant";
import { auditLog } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { randomToken, sha256 } from "@/lib/security";
import { sendEmail } from "@/lib/email";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

function appUrl() {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

function debugLinksEnabled() {
  return (process.env.EMAIL_DEBUG_LINKS || "").toLowerCase() === "true";
}

export async function createInvite(formData: FormData) {
  const session = await requireRole(["ADMIN", "SUPER_ADMIN"]);
  const { schoolId } = await requireActiveSchool();
  const actorId = session.user.id;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "STAFF").trim() as any;

  if (!email) redirect("/settings?error=Email is required");

  const raw = randomToken(24);
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const invite = await prisma.inviteToken.create({
    data: { schoolId, email, role, tokenHash, invitedById: actorId, expiresAt }
  });

  const link = `${appUrl()}/invite?token=${raw}`;
  const subject = "You're invited to Centum Stack";
  const html = `
    <p>You have been invited to Centum Stack.</p>
    <p><a href="${link}">Accept invite</a></p>
    <p>This link expires in 7 days.</p>
  `;
  const sent = await sendEmail({ to: email, subject, html });

  await auditLog({
    schoolId,
    actorId,
    action: "invite.create",
    entityType: "InviteToken",
    entityId: invite.id,
    metadata: { email, role, sent: sent.ok }
  });

  if (!sent.ok && debugLinksEnabled()) {
    await notifyUser({
      userId: actorId,
      schoolId,
      type: "INFO",
      title: "Invite created (email not sent)",
      body: `Invite link: ${link}`,
      link: "/settings"
    });
    redirect(`/settings?info=${encodeURIComponent(`Invite created. Email not sent. Copy link: ${link}`)}`);
  }

  redirect("/settings?success=Invite created");
}

export async function acceptInvite(rawToken: string, formData: FormData) {
  const tokenHash = sha256(rawToken);
  const invite = await prisma.inviteToken.findFirst({
    where: { tokenHash, acceptedAt: null, expiresAt: { gt: new Date() } },
    include: { school: true }
  });
  if (!invite) redirect("/invite?error=invalid_or_expired");

  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!name || password.length < 6) redirect(`/invite?token=${encodeURIComponent(rawToken)}&error=invalid_form`);

  const existing = await prisma.user.findUnique({ where: { email: invite.email } });
  const hash = await bcrypt.hash(password, 10);

  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { name, password: hash, role: invite.role, schoolId: invite.schoolId, active: true }
      })
    : await prisma.user.create({
        data: { email: invite.email, name, password: hash, role: invite.role, schoolId: invite.schoolId, active: true }
      });

  await prisma.inviteToken.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });

  await auditLog({
    schoolId: invite.schoolId,
    actorId: invite.invitedById ?? null,
    action: "invite.accept",
    entityType: "User",
    entityId: user.id,
    metadata: { email: user.email, role: user.role }
  });

  redirect("/login?success=Account created. Please sign in.");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) redirect("/forgot?error=Email is required");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) redirect("/forgot?success=If that email exists, a reset link has been sent.");

  const raw = randomToken(24);
  const tokenHash = sha256(raw);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });

  const link = `${appUrl()}/reset?token=${raw}`;
  const subject = "Reset your Centum Stack password";
  const html = `
    <p>Reset your password using the link below:</p>
    <p><a href="${link}">Reset password</a></p>
    <p>This link expires in 1 hour.</p>
  `;
  const sent = await sendEmail({ to: email, subject, html });

  if (!sent.ok && debugLinksEnabled()) {
    redirect(`/forgot?info=${encodeURIComponent(`Email not sent. Use this reset link: ${link}`)}`);
  }

  redirect("/forgot?success=If that email exists, a reset link has been sent.");
}

export async function resetPassword(rawToken: string, formData: FormData) {
  const tokenHash = sha256(rawToken);
  const token = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
    include: { user: true }
  });
  if (!token) redirect("/reset?error=invalid_or_expired");

  const password = String(formData.get("password") ?? "");
  if (password.length < 6) redirect(`/reset?token=${encodeURIComponent(rawToken)}&error=weak_password`);

  const hash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: token.userId }, data: { password: hash, active: true } });
  await prisma.passwordResetToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });

  redirect("/login?success=Password updated. Please sign in.");
}
