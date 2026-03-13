import { prisma } from "@/lib/prisma";
import { percent, stageWeight, toPlainArray } from "@/lib/school2/helpers";

const db = prisma as any;

export async function buildSchoolScorecard(schoolId: string) {
  const [school, gates, modules, completions, recommendedTools, enabledTools, requests, tickets, docs, licenses, packAdoptions, bundleAdoptions] =
    await Promise.all([
      db.school.findUnique({ where: { id: schoolId } }),
      db.implementationGate.findMany({ where: { schoolId } }),
      db.trainingModule.findMany(),
      db.trainingCompletion.findMany({ where: { user: { is: { schoolId } } } }),
      db.toolRecommendation.count({ where: { schoolId, status: { in: ["PENDING", "ACCEPTED"] } } }),
      db.schoolTool.count({ where: { schoolId, enabled: true } }),
      db.request.findMany({ where: { schoolId } }),
      db.ticket.findMany({ where: { schoolId, status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      db.governanceDocument.count({ where: { schoolId, status: "ACTIVE" } }),
      db.license.count({ where: { schoolId, status: { in: ["PLANNING", "ACTIVE"] } } }),
      db.schoolPackAdoption.findMany({ where: { schoolId } }),
      db.schoolBundleAdoption.findMany({ where: { schoolId } })
    ]);

  const completedGates = gates.filter((gate: any) => gate.status === "COMPLETE").length;
  const trainingRequired = modules.length * Math.max(1, school?.staffCount ?? 1);
  const trainingCompletionRate = modules.length
    ? percent(completions.length, Math.max(modules.length, trainingRequired))
    : 0;

  const openRequests = requests.filter((request: any) => request.status !== "COMPLETED").length;
  const unresolvedTickets = tickets.length;
  const blockers = [] as string[];

  if (openRequests > 3) blockers.push("Approval queue backlog");
  if (unresolvedTickets > 0) blockers.push("Open support / implementation tickets");
  if (docs < 3) blockers.push("Governance document coverage is still thin");
  if (!school?.deviceModel || school?.connectivity === "LOW") blockers.push("Infrastructure readiness constraints");

  const readinessScore = Math.max(
    10,
    Math.min(
      100,
      Math.round(
        percent(completedGates, Math.max(1, gates.length)) * 0.35 +
          trainingCompletionRate * 0.2 +
          Math.min(enabledTools * 7, 20) +
          Math.min(docs * 6, 15) +
          stageWeight(school?.transformationStage) * 0.1 -
          unresolvedTickets * 3
      )
    )
  );

  const maturityScore = Math.max(
    10,
    Math.min(
      100,
      Math.round(
        stageWeight(school?.transformationStage) * 0.35 +
          Math.min(recommendedTools * 6, 18) +
          Math.min(packAdoptions.filter((item: any) => item.status === "ACTIVE").length * 8, 24) +
          Math.min(bundleAdoptions.filter((item: any) => item.status === "ACTIVE").length * 6, 12) +
          Math.min(licenses * 4, 12)
      )
    )
  );

  return {
    school,
    readinessScore,
    maturityScore,
    completedGates,
    totalGates: gates.length,
    trainingCompletionRate,
    enabledTools,
    openRequests,
    unresolvedTickets,
    governanceCoverage: docs,
    activeLicenses: licenses,
    blockers,
    adoptedPacks: packAdoptions,
    adoptedBundles: bundleAdoptions,
    priorityOutcomes: toPlainArray(school?.priorityOutcomes)
  };
}
