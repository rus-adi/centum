import { notFound } from "next/navigation";
import Link from "next/link";
import { PageShell } from "@/components/layout/page-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getOfferingByKey } from "@/lib/school2/offerings";

const detailCopy: Record<string, { summary: string; bullets: string[]; notes?: string[] }> = {
  centum_learning_guide_builder: {
    summary: "The Learning Guide Builder is a real, built-in feature of this project. It is a deterministic prompt-builder for teachers and students, with separate modes and prompt structures.",
    bullets: [
      "Teacher mode for micro-lessons, worked examples, checkpoints, discussion guides, and presentation scaffolds",
      "Student mode for subject chat starters, get-unstuck help, hint-first support, and safer study prompts",
      "Supports one-off prompts, subject chat starters, and interactive walkthrough mode",
      "Designed to help people work with Gemini better rather than replace Gemini itself"
    ],
    notes: ["Alias route: /prompt-maker", "Built for users 13+", "Copy / open Gemini / .txt export included"]
  },
  empathy_leadership_platform: {
    summary: "This packaged platform concept groups the leadership-facing operating surfaces originally described for Empathy School into one clear story inside Centum Stack.",
    bullets: [
      "Shared dashboard and SOP retrieval",
      "Usable without AI first, prompt-pack mode next, direct API mode later",
      "Leadership Desk, Parent Communication, Incident & Escalation, Enrollment & Retention, Staffing & Coverage, Leadership Meeting OS, Attendance & Student Support, and Owner / Board Cockpit",
      "Leadership-first operational layer rather than a full separate SIS or ERP"
    ]
  },
  hr_dashboard_suite: {
    summary: "The HR Dashboard Suite is represented as a structured Centum offering even when deployed later as a standalone toolkit or linked workspace set.",
    bullets: [
      "Resume Review Workspace",
      "Hiring & Onboarding Workspace",
      "Cases & Performance Workspace",
      "Retention, Policy & Leave Workspace",
      "Offers, Staffing & Transition Workspace",
      "Planning, Renewals & Analytics Workspace"
    ],
    notes: ["The source doc describes this as a standalone HTML toolkit with 6 workspaces plus a launcher and 21 functional tools."]
  }
};

export default async function ServiceDetailPage({ params }: { params: { key: string } }) {
  const offering = getOfferingByKey(params.key);
  if (!offering) notFound();
  const details = detailCopy[offering.key] ?? {
    summary: offering.description,
    bullets: [
      `Audience: ${offering.audience ?? "School-facing users"}`,
      `Offering type: ${offering.badge}`,
      `Pillar: ${offering.pillar ?? "Cross-functional"}`
    ],
    notes: offering.note ? [offering.note] : []
  };

  return (
    <PageShell title={offering.title} description="Service / app detail view for onboarding, school conversations, and investor walkthroughs.">
      <div className="mb-4">
        <Link href="/services" className="text-sm font-medium text-blue-700 hover:underline">← Back to Services & Apps</Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{offering.title}</CardTitle>
              <Badge variant="info">{offering.badge}</Badge>
            </div>
            <p className="mt-2 text-sm text-gray-600">{details.summary}</p>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-gray-700">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
              This detail page is meant to make the offering feel intentional even when the final external link, subdomain, or standalone deployment is still being finalized.
            </div>
            <div>
              <div className="font-medium text-gray-900">What it includes</div>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {details.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
              </ul>
            </div>
            {details.notes?.length ? (
              <div>
                <div className="font-medium text-gray-900">Notes</div>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {details.notes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Use in demos and onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-700">
            <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4">
              <div className="font-medium text-gray-900">Audience</div>
              <div className="mt-1">{offering.audience ?? "School-facing users"}</div>
            </div>
            {offering.note ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
                {offering.note}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <a className="rounded-md border border-[var(--border)] px-3 py-2 font-medium text-gray-900 hover:bg-gray-50" href={offering.href} target="_blank" rel="noreferrer">
                {offering.cta ?? "Open link"}
              </a>
              <Link className="rounded-md border border-[var(--border)] px-3 py-2 font-medium text-gray-900 hover:bg-gray-50" href="/guide-builder">
                Open Guide Builder →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
