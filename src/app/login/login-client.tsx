"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginClient({ error }: { error?: string | null }) {
  const err = error ?? null;
  const [loading, setLoading] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-xs uppercase tracking-[0.22em] text-gray-500">School 2.0 Platform</div>
          <CardTitle>Centum Stack</CardTitle>
          <p className="mt-2 text-sm text-gray-600">Sign in to continue your transformation work.</p>
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
              const fd = new FormData(e.currentTarget);
              const email = String(fd.get("email") || "");
              const password = String(fd.get("password") || "");
              await signIn("credentials", { email, password, callbackUrl: "/dashboard" });
              setLoading(false);
            }}
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <Input name="email" type="email" required placeholder="you@school.id" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
              <Input name="password" type="password" required placeholder="••••••••" />
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
    </div>
  );
}
