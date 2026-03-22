import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { OfferingCard } from "@/components/ui/offering-card";
import { prisma } from "@/lib/prisma";
import { requireActiveSchool } from "@/lib/tenant";
import { getFeaturedOfferings } from "@/lib/school2/offerings";

const db = prisma as any;

export default async function StudentPreviewPage() {
  const { schoolId } = await requireActiveSchool();
  const [students, activeTools, activePacks] = await Promise.all([
    prisma.student.findMany({ where: { schoolId }, orderBy: [{ grade: "asc" }, { name: "asc" }], take: 8 }),
    db.schoolTool.findMany({ where: { schoolId, enabled: true }, include: { tool: true }, orderBy: { updatedAt: "desc" }, take: 6 }),
    db.schoolPackAdoption.findMany({ where: { schoolId, status: "ACTIVE" }, include: { pack: true }, orderBy: { createdAt: "desc" }, take: 4 })
  ]);

  const previewOfferings = getFeaturedOfferings().filter((offering) =>
    [
      "student_experience_preview",
      "project_finder_ai",
      "resiliency_ai_for_kids",
      "interactive_prompt_walkthrough",
      "centum_learning_guide_builder",
      "sentinel_guide_builder",
      "gemini_buddy"
    ].includes(offering.key)
  );

  return (
    <PageShell
      title="Student Experience Preview"
      description="A next-phase preview of the separate student-facing experience, seeded with sample learners, likely app entry points, and the current active-school context."
    >
      <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>How to frame this in investor demos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-6 text-gray-700">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
              The student product is intentionally framed as a separate portal, not as a tab inside the leadership console. That keeps the current Centum Stack story focused on school transformation while still showing a clear path for learner-facing expansion.
            </div>
            <div>
              Use this page to show that sample learners, likely entry points, and classroom-facing apps are already being considered — without over-promising that the student portal is fully shipping today.
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 hover:bg-gray-50" href="/dashboard">
                Back to current role dashboard →
              </Link>
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 hover:bg-gray-50" href="/training">
                Open teacher lesson-plan hub →
              </Link>
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 hover:bg-gray-50" href="/guide-builder">
                Open Guide Builder →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Likely learner entry points</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="info">Project Finder AI</Badge>
              <Badge variant="info">Resiliency AI for Kids</Badge>
              <Badge variant="info">Interactive Prompt Walkthrough</Badge>
              <Badge variant="info">Gemini Buddy</Badge>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Placeholder links remain highlighted so your team can replace them later with the correct student-facing subdomain or app routes.
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4 text-sm text-gray-700">
              The current school has {activeTools.length} enabled tool record(s) and {activePacks.length} active pack rollout(s) that could eventually influence which student tools appear in the future learner portal.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {previewOfferings.map((offering) => (
          <OfferingCard
            key={offering.key}
            title={offering.title}
            description={offering.description}
            href={offering.href}
            badge={offering.badge}
            iconKey={offering.iconKey}
            audience={offering.audience}
            note={offering.note}
            cta={offering.cta}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Sample student profiles</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {students.length ? (
              students.map((student) => (
                <div key={student.id} className="rounded-lg border border-[var(--border)] p-4">
                  <div className="font-semibold text-gray-900">{student.name}</div>
                  <div className="mt-1 text-sm text-gray-600">Grade {student.grade}</div>
                  <div className="mt-2 text-sm text-gray-600">
                    {student.coachName ? `Coach ${student.coachName}` : "No coach assigned yet"}
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-wide text-gray-500">Future student experience seed</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-gray-600">No sample students have been seeded yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>School context likely to shape the student portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">Recently enabled tools</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeTools.length ? (
                  activeTools.map((record: any) => (
                    <Badge key={record.id} variant="neutral">{record.tool?.name ?? "Tool"}</Badge>
                  ))
                ) : (
                  <div className="text-sm text-gray-600">No enabled tools found yet.</div>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900">Active packs</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {activePacks.length ? (
                  activePacks.map((record: any) => (
                    <Badge key={record.id} variant="info">{record.pack?.name ?? "Transformation Pack"}</Badge>
                  ))
                ) : (
                  <div className="text-sm text-gray-600">No active packs yet.</div>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4 text-sm text-gray-700">
              This page is intentionally positioned as preview-only. It helps investors see the product expansion path without confusing the current leadership platform with a full student LMS.
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
