import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function QualityPage() {
  return (
    <PageShell title="Implementation & Quality">
      <Card>
        <CardHeader>
          <CardTitle>Quality gates (MVP)</CardTitle>
          <p className="mt-2 text-sm text-gray-600">
            This page acts as a lightweight operational checklist for partner schools.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2">
                <Badge variant="success">Ready</Badge>
                <div className="font-medium text-gray-900">Provisioning workflow</div>
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Students created + status tracked</li>
                <li>Tool enablement managed via Tools page</li>
                <li>Requests capture approvals + audit trail</li>
              </ul>
            </div>

            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2">
                <Badge variant="info">In progress</Badge>
                <div className="font-medium text-gray-900">Usage telemetry</div>
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Database includes ToolUsageLog model</li>
                <li>Integrate Google / Gemini / LMS events next</li>
              </ul>
            </div>

            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2">
                <Badge variant="success">Ready</Badge>
                <div className="font-medium text-gray-900">Training compliance</div>
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Lesson progress tracked per module</li>
                <li>Updates can force retraining (version bump)</li>
              </ul>
            </div>

            <div className="rounded-lg border border-[var(--border)] p-4">
              <div className="flex items-center gap-2">
                <Badge variant="warning">Recommended</Badge>
                <div className="font-medium text-gray-900">Next hardening steps</div>
              </div>
              <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Enable Sentry for error reporting</li>
                <li>Add database migrations (Prisma migrate)</li>
                <li>Configure email provider + domain</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
