import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { supabaseAdmin, signedUrlTTL } from "@/lib/supabase";
import { activeSchoolCookieName } from "@/lib/tenant";

// Uses Prisma + Supabase server-side; keep this on Node.js runtime.
export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Some sessions may not include our custom user.id (e.g. after schema/callback changes).
  // Fall back to email if needed.
  const sessionUser: any = session.user;
  const id = typeof sessionUser?.id === "string" && sessionUser.id.length ? sessionUser.id : null;
  const email = typeof sessionUser?.email === "string" && sessionUser.email.length ? sessionUser.email.toLowerCase() : null;

  const user = id
    ? await prisma.user.findUnique({ where: { id } })
    : email
      ? await prisma.user.findUnique({ where: { email } })
      : null;
  if (!user || !user.active) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let schoolId: string | null = user.schoolId ?? null;

  if (user.role === "SUPER_ADMIN") {
    const cookieName = activeSchoolCookieName();
    const cookie = cookies().get(cookieName)?.value ?? null;
    if (cookie) {
      schoolId = cookie;
    } else {
      const first = await prisma.school.findFirst({ orderBy: { createdAt: "asc" } });
      schoolId = first?.id ?? null;
    }
  }

  if (!schoolId) return NextResponse.json({ error: "No school context" }, { status: 400 });

  const attachment = await prisma.fileAttachment.findFirst({
    where: { id: params.id, schoolId }
  });

  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const supabase = supabaseAdmin();
    const ttl = signedUrlTTL();

    const { data, error } = await supabase.storage
      .from(attachment.bucket)
      .createSignedUrl(attachment.path, ttl);

    if (error || !data?.signedUrl) {
      console.error(error);
      return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl, { status: 302 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }
}
