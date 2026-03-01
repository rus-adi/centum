import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImportStudentsClient } from "./import-client";

export default function ImportStudentsPage() {
  return (
    <PageShell title="Import Students">
      <div className="mb-4">
        <Link href="/students" className="text-sm font-medium text-blue-700 hover:underline">
          ← Back to Students
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CSV import</CardTitle>
          <p className="mt-2 text-sm text-gray-600">
            Recommended columns: <span className="font-mono">studentCode,name,grade,status,coachName</span>
          </p>
        </CardHeader>
        <CardContent>
          <ImportStudentsClient />
        </CardContent>
      </Card>
    </PageShell>
  );
}
