import { PageShell } from "@/components/layout/page-shell";
import { GuideBuilderApp } from "@/components/guide-builder/guide-builder-app";

export default async function GuideBuilderPage() {
  return (
    <PageShell
      title="Guide Builder"
      description="Centum Learning Guide Builder — built-in teacher and student prompt generation for Gemini-ready classroom and study support."
    >
      <GuideBuilderApp />
    </PageShell>
  );
}
