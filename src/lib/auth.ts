import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const MAX_FAILS = 10;
const WINDOW_MINUTES = 15;

function getIp(req: any): string | null {
  try {
    const xf = req?.headers?.get?.("x-forwarded-for") || req?.headers?.["x-forwarded-for"];
    if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
    const xr = req?.headers?.get?.("x-real-ip") || req?.headers?.["x-real-ip"];
    if (typeof xr === "string" && xr.length) return xr.trim();
  } catch {}
  return null;
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  // Explicit secret (recommended for stability across dev/prod)
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        const emailRaw = (credentials?.email ?? "").toString().trim().toLowerCase();
        const password = (credentials?.password ?? "").toString();

        if (!emailRaw || !password) return null;

        const ip = getIp(req);

        const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
        const failCount = await prisma.authAttempt.count({
          where: { email: emailRaw, success: false, createdAt: { gt: since } }
        });

        if (failCount >= MAX_FAILS) {
          // Too many failed attempts (rate limit)
          await prisma.authAttempt.create({ data: { email: emailRaw, ip, success: false } });
          return null;
        }

        const user = await prisma.user.findUnique({ where: { email: emailRaw } });

        if (!user || !user.active) {
          await prisma.authAttempt.create({ data: { email: emailRaw, ip, success: false } });
          return null;
        }

        const ok = await bcrypt.compare(password, user.password);
        await prisma.authAttempt.create({ data: { email: emailRaw, ip, success: ok } });

        if (!ok) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId
        } as any;
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On initial sign-in, `user` is provided.
      // On subsequent requests, only `token` is available.
      if (user) {
        token.uid = (user as any).id ?? token.uid ?? token.sub;
        token.role = (user as any).role ?? token.role;
        token.schoolId = (user as any).schoolId ?? token.schoolId ?? null;
      }

      // Safety: ensure we always have a stable user id.
      // NextAuth typically sets `sub` to the user id.
      if (!token.uid && token.sub) {
        token.uid = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (!session.user) session.user = {} as any;

      // Prefer our custom `uid`, fall back to NextAuth's `sub`.
      const uid = (token.uid as string | undefined) ?? (token.sub as string | undefined);
      if (uid) session.user.id = uid;

      session.user.role = ((token.role as string | undefined) ?? (session.user.role as any) ?? "STAFF") as any;
      session.user.schoolId = (token.schoolId as string | null | undefined) ?? null;
      return session;
    }
  },
  pages: { signIn: "/login" }
};
