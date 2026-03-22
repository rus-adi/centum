"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isForbidden = /forbidden/i.test(error.message);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="text-xs uppercase tracking-[0.22em] text-gray-500">Centum Stack</div>
          <CardTitle>{isForbidden ? "That action is hidden for this role" : "Something interrupted the demo flow"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-gray-600">
          <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
            {isForbidden
              ? "This usually means the current persona does not have access to an admin-only workflow. Use the visible navigation or switch to an admin / HQ demo account for leadership actions."
              : "Try resetting the page first. If the issue persists, go back to a stable investor-demo surface such as the dashboard, training hub, or governance workspace."}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={() => reset()}>
              Try again
            </Button>
            <Link className="inline-flex items-center justify-center rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50" href="/dashboard">
              Open dashboard
            </Link>
            <Link className="inline-flex items-center justify-center rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50" href="/training">
              Open training hub
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
