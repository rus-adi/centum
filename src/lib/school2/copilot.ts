import { prisma } from "@/lib/prisma";
import { generateCopilotNarrative } from "@/lib/school2/llm";
import { buildSchoolScorecard } from "@/lib/school2/metrics";
import { toPlainArray } from "@/lib/school2/helpers";

const db = prisma as any;

function derivePackKeys(school: any, blockers: string[]) {
  const keys = ["ai-enablement-pack"];
  const goals = [school?.aiAdoptionGoal, school?.individualizedLearningGoal, school?.projectBasedLearningGoal, school?.selGoal]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/individual/i.test(goals)) keys.push("individualized-learning-pack");
  if (/project/i.test(goals) || blockers.some((item) => /project/i.test(item))) keys.push("projects-pack");
  if (/sel|wellbeing|behavior|support/i.test(goals) || blockers.some((item) => /governance/i.test(item))) keys.push("social-emotional-learning-pack");
  return Array.from(new Set(keys));
}

function deriveBundleKeys(priorityOutcomes: string[]) {
  const joined = priorityOutcomes.join(" ").toLowerCase();
  const keys = ["core-google"];
  if (joined.includes("ai")) keys.push("ai-starter");
  if (joined.includes("project")) keys.push("projects-stack");
  if (joined.includes("support") || joined.includes("accountability")) keys.push("student-support-stack");
  return Array.from(new Set(keys));
}

export async function runTransformationCopilot(input: { schoolId: string; userId?: string | null }) {
  const scorecard = await buildSchoolScorecard(input.schoolId);
  const school = scorecard.school;
  const blockers = [...scorecard.blockers];

  if (scorecard.trainingCompletionRate < 40) blockers.push("Training completion is below the rollout threshold");
  if (scorecard.governanceCoverage < 3) blockers.push("Governance & Support Center coverage is incomplete");
  if (!school?.budgetSensitivity) blockers.push("Budget and cost sensitivity are not yet documented");

  const nextActions = [
    scorecard.governanceCoverage < 3 ? "Upload or refresh the core policy set in Governance & Support." : "Review the most-used governance documents and pin them for leaders.",
    scorecard.trainingCompletionRate < 70 ? "Assign recorded training modules to leadership, IT, and frontline staff." : "Convert current training wins into role-based certification expectations.",
    scorecard.openRequests > 0 ? "Clear open requests and approvals to keep rollout momentum." : "Activate the next recommended tool or bundle with leadership sign-off."
  ];

  const packKeys = derivePackKeys(school, blockers);
  const bundleKeys = deriveBundleKeys(scorecard.priorityOutcomes);

  const packs = await db.transformationPack.findMany({ where: { key: { in: packKeys } } });
  const modules = await db.trainingModule.findMany({ where: { pillar: { in: packs.map((pack: any) => pack.pillar) } } });

  const plan30 = [
    "Finalize school profile, cost sensitivity, and transformation constraints.",
    "Upload core governance documents and test 5 policy questions.",
    `Assign ${Math.min(modules.length, 3)} essential training modules to leadership and IT.`
  ];
  const plan60 = [
    "Enable the first recommended bundle with prerequisite training complete.",
    "Run a contained pilot with clear weekly review rituals.",
    "Track request backlog, training completion, and governance coverage in the executive report."
  ];
  const plan90 = [
    "Review pilot evidence and decide what scales school-wide.",
    "Refresh the parent-facing growth assets with real proof points.",
    "Publish the next School 2.0 executive summary for principal or board review."
  ];

  const narrative = await generateCopilotNarrative({
    schoolName: school?.name ?? "This school",
    readinessScore: scorecard.readinessScore,
    maturityScore: scorecard.maturityScore,
    blockers,
    nextActions
  });

  const run = await db.copilotRun.create({
    data: {
      schoolId: input.schoolId,
      createdById: input.userId ?? null,
      readinessScore: scorecard.readinessScore,
      maturityScore: scorecard.maturityScore,
      maturitySummary: narrative.summary,
      blockers,
      nextActions,
      recommendedBundleKeys: bundleKeys,
      recommendedPackKeys: packKeys,
      suggestedTrainingKeys: modules.map((module: any) => module.key),
      plan30,
      plan60,
      plan90,
      executiveSummary: narrative.summary
    }
  });

  const recommendations = [
    ...blockers.map((item) => ({ kind: "BLOCKER", title: item, description: item })),
    ...nextActions.map((item) => ({ kind: "NEXT_ACTION", title: item, description: item })),
    ...bundleKeys.map((item) => ({ kind: "BUNDLE", title: item, description: `Recommended bundle: ${item}` })),
    ...packKeys.map((item) => ({ kind: "PACK", title: item, description: `Recommended pack: ${item}` })),
    ...modules.slice(0, 4).map((module: any) => ({ kind: "TRAINING", title: module.title, description: module.description }))
  ];

  for (const recommendation of recommendations) {
    await db.copilotRecommendation.create({
      data: {
        runId: run.id,
        schoolId: input.schoolId,
        kind: recommendation.kind,
        title: recommendation.title,
        description: recommendation.description,
        status: "PENDING"
      }
    });
  }

  await db.school.update({
    where: { id: input.schoolId },
    data: {
      readinessScore: scorecard.readinessScore,
      maturityScore: scorecard.maturityScore
    }
  });

  return {
    run,
    blockers,
    nextActions,
    packKeys,
    bundleKeys,
    suggestedTraining: modules,
    narrative,
    priorityOutcomes: toPlainArray(school?.priorityOutcomes)
  };
}
