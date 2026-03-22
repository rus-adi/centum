"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { ArrowRight, Building2, GraduationCap, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const demoPersonas = [
  {
    key: "hq",
    title: "Explore as HQ",
    subtitle: "Multi-school oversight • investor story",
    email: "hq@centum.id",
    roleHint: "HQ Command Center, cross-school readiness, executive reporting",
    icon: Building2
  },
  {
    key: "leader",
    title: "Explore as school leader",
    subtitle: "Principal / admin walkthrough",
    email: "admin.harapan@centum.id",
    roleHint: "Transformation Copilot, governance, bundles, packs, growth assets",
    icon: ShieldCheck
  },
  {
    key: "teacher",
    title: "Explore as teacher",
    subtitle: "Teacher-facing classroom path",
    email: "teacher.harapan@centum.id",
    roleHint: "Classroom Launchpad, lesson plans, prompt tools, training",
    icon: GraduationCap
  },
  {
    key: "global",
    title: "Global Nusantara onboarding",
    subtitle: "Real-school onboarding shell",
    email: "admin.globalnusantara.demo@centum.id",
    roleHint: "Clean onboarding record with school profile, readiness gates, and first-step recommendations",
    icon: ShieldCheck
  },
  {
    key: "empathy",
    title: "Empathy teacher test",
    subtitle: "Mentor / teacher test path",
    email: "justin.empathy.demo@centum.id",
    roleHint: "Teacher-first testing for Guide Builder, Project Finder AI, and resiliency assets",
    icon: GraduationCap
  }
] as const;

export function LoginClient({ error }: { error?: string | null }) {
  const err = error ?? null;
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[0.9fr,1.1fr]">
        <Card className="h-full">
          <CardHeader>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-500">School 2.0 Platform</div>
            <CardTitle>Centum Stack</CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to continue your transformation work. In seeded demo environments, all demo personas use the password <span className="font-medium text-gray-900">password</span>.
            </p>
          </CardHeader>
          <CardContent>
            {err && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {err === "account_disabled"
                  ? "Your account is disabled. Contact an administrator."
                  : "Login failed. Check your email/password and try again."}
              </div>
            )}

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                await signIn("credentials", { email, password, callbackUrl: "/" });
                setLoading(false);
              }}
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <Input name="email" type="email" required placeholder="you@school.id" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <Input name="password" type="password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button variant="primary" className="w-full" disabled={loading} type="submit">
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="flex items-center justify-between pt-2 text-sm">
                <a className="text-blue-700 hover:underline" href="/forgot">
                  Forgot password?
                </a>
                <span className="text-gray-500">Use your invite link to join.</span>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Investor demo paths</div>
            <CardTitle>Quick-fill a demo persona</CardTitle>
            <p className="mt-2 text-sm text-gray-600">
              These shortcuts make it easier to explore the same platform from HQ, school-leadership, and teacher perspectives without memorizing seeded accounts.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {demoPersonas.map((persona) => {
              const Icon = persona.icon;
              return (
                <button
                  key={persona.key}
                  type="button"
                  onClick={() => {
                    setEmail(persona.email);
                    setPassword("password");
                  }}
                  className="rounded-xl border border-[var(--border)] bg-white p-4 text-left shadow-card transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-full border border-blue-200 bg-blue-50 p-2 text-blue-700">
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <div className="mt-4 font-semibold text-gray-900">{persona.title}</div>
                  <div className="mt-1 text-sm text-gray-600">{persona.subtitle}</div>
                  <div className="mt-3 rounded-md border border-[var(--border)] bg-slate-50 px-3 py-2 text-xs text-gray-700">{persona.email}</div>
                  <div className="mt-3 text-sm leading-6 text-gray-600">{persona.roleHint}</div>
                  <div className="mt-4 text-xs font-medium uppercase tracking-wide text-blue-700">Click to fill credentials</div>
                </button>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
