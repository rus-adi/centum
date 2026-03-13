/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function splitIntoChunks(input, maxLength = 520, overlap = 80) {
  const text = String(input || "").replace(/\s+/g, " ").trim();
  if (!text) return [];
  const paragraphs = text
    .split(/\n{2,}|(?<=\.)\s+(?=[A-Z0-9])/)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = "";
  for (const paragraph of paragraphs) {
    if (`${buffer} ${paragraph}`.trim().length <= maxLength) {
      buffer = `${buffer} ${paragraph}`.trim();
      continue;
    }
    if (buffer) chunks.push(buffer);
    if (paragraph.length <= maxLength) {
      buffer = paragraph;
      continue;
    }
    let cursor = 0;
    while (cursor < paragraph.length) {
      const slice = paragraph.slice(cursor, cursor + maxLength).trim();
      if (slice) chunks.push(slice);
      cursor += Math.max(1, maxLength - overlap);
    }
    buffer = "";
  }
  if (buffer) chunks.push(buffer);
  return chunks;
}

async function ensureSchool(payload) {
  const existing = await prisma.school.findFirst({ where: { name: payload.name } });
  if (existing) {
    return prisma.school.update({ where: { id: existing.id }, data: payload });
  }
  return prisma.school.create({ data: payload });
}

async function ensureUser({ email, ...data }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return prisma.user.update({ where: { id: existing.id }, data });
  }
  return prisma.user.create({ data: { email, ...data } });
}

async function ensureTool(tool) {
  return prisma.tool.upsert({
    where: { key: tool.key },
    update: tool,
    create: tool
  });
}

async function ensureTraining(module) {
  return prisma.trainingModule.upsert({
    where: { key: module.key },
    update: module,
    create: module
  });
}

async function ensureBundle(bundle) {
  return prisma.stackBundle.upsert({
    where: { key: bundle.key },
    update: bundle,
    create: bundle
  });
}

async function ensurePack(pack) {
  return prisma.transformationPack.upsert({
    where: { key: pack.key },
    update: pack,
    create: pack
  });
}

async function ensureVendor(vendor) {
  return prisma.vendor.upsert({
    where: { key: vendor.key },
    update: vendor,
    create: vendor
  });
}

async function ensureGovernanceDocument({ schoolId, createdById, title, category, summary, description, body }) {
  let document = await prisma.governanceDocument.findFirst({ where: { schoolId, title } });
  if (!document) {
    document = await prisma.governanceDocument.create({
      data: {
        schoolId,
        createdById,
        title,
        category,
        summary,
        description,
        pinned: true,
        status: "ACTIVE"
      }
    });
  } else {
    document = await prisma.governanceDocument.update({
      where: { id: document.id },
      data: { category, summary, description, pinned: true, status: "ACTIVE" }
    });
  }

  let version = await prisma.governanceDocumentVersion.findFirst({
    where: { documentId: document.id, version: 1 },
    include: { chunks: true }
  });

  if (!version) {
    version = await prisma.governanceDocumentVersion.create({
      data: {
        documentId: document.id,
        version: 1,
        body,
        originalFilename: `${slugify(title)}.txt`,
        mimeType: "text/plain",
        uploadedById: createdById
      },
      include: { chunks: true }
    });
  }

  const existingChunks = await prisma.governanceChunk.count({ where: { versionId: version.id } });
  if (!existingChunks) {
    const chunks = splitIntoChunks(body);
    if (chunks.length) {
      await prisma.governanceChunk.createMany({
        data: chunks.map((content, ordinal) => ({ versionId: version.id, ordinal, content, keywordText: content.toLowerCase() }))
      });
    }
  }

  return prisma.governanceDocument.findUnique({
    where: { id: document.id },
    include: { versions: { include: { chunks: true }, orderBy: { version: "desc" } } }
  });
}

async function ensureGovernanceQuery({ schoolId, userId, question, answer, document }) {
  const existing = await prisma.governanceQuery.findFirst({ where: { schoolId, question } });
  let query = existing;
  if (!query) {
    query = await prisma.governanceQuery.create({
      data: {
        schoolId,
        userId,
        question,
        answer,
        confidence: 86,
        usedFallback: true,
        lowConfidence: false,
        escalationRecommended: /safeguard|injury|incident/i.test(question)
      }
    });
  }

  const version = document.versions[0];
  const chunk = version?.chunks?.[0];
  if (version && chunk) {
    const source = await prisma.governanceQuerySource.findFirst({ where: { queryId: query.id, chunkId: chunk.id } });
    if (!source) {
      await prisma.governanceQuerySource.create({
        data: {
          queryId: query.id,
          documentId: document.id,
          versionId: version.id,
          chunkId: chunk.id,
          quote: chunk.content,
          relevance: 1
        }
      });
    }
  }
}

async function main() {
  const passwordHash = await bcrypt.hash("password", 10);

  const onboarding = await ensureSchool({
    name: "SMP Demo Nusantara",
    city: "Bekasi",
    region: "West Java",
    timezone: "Asia/Jakarta",
    type: "PUBLIC",
    curriculum: "National curriculum",
    curriculumNotes: "Curriculum remains unchanged while School 2.0 operating habits are introduced.",
    gradeBands: ["MIDDLE"],
    studentCount: 950,
    enrollment: 950,
    staffCount: 62,
    deviceModel: "SHARED",
    deviceRatio: "1 device for every 4 students",
    ecosystem: "MIXED",
    connectivity: "MEDIUM",
    constraints: "Shared devices and phased deployment by grade band.",
    nonNegotiables: "No disruptive curriculum changes in the first year.",
    priorityOutcomes: ["Reduce teacher workload", "Improve student support"],
    currentTooling: ["Google Workspace", "WhatsApp parent communication", "Shared device labs"],
    budgetSensitivity: "LOW",
    maturityScore: 36,
    readinessScore: 42,
    transformationStage: "ONBOARDING",
    transformationProgress: 20,
    aiAdoptionGoal: "Introduce leadership-ready AI workflows safely before broad student access.",
    individualizedLearningGoal: "Improve small-group support without purchasing a new curriculum.",
    projectBasedLearningGoal: "Pilot short project cycles in Grade 8.",
    selGoal: "Improve behavior routines and incident follow-up consistency.",
    school2Vision: "A safe, staged School 2.0 transition that leadership can govern confidently."
  });

  const pilot = await ensureSchool({
    name: "SMA Demo Harapan",
    city: "Jakarta",
    region: "DKI Jakarta",
    timezone: "Asia/Jakarta",
    type: "PRIVATE",
    curriculum: "National + Cambridge",
    curriculumNotes: "Cambridge and national tracks remain intact.",
    gradeBands: ["MIDDLE", "HIGH"],
    studentCount: 420,
    enrollment: 420,
    staffCount: 48,
    deviceModel: "ONE_TO_ONE",
    deviceRatio: "1:1 devices in Grades 8-12",
    ecosystem: "GOOGLE",
    connectivity: "HIGH",
    constraints: "Keep national curriculum and avoid a full LMS replacement.",
    nonNegotiables: "Parent communication must stay calm and transparent.",
    priorityOutcomes: ["Teacher AI readiness", "Student accountability", "Faster operations", "Project-based learning"],
    currentTooling: ["Google Workspace", "Google Classroom", "Notion"],
    budgetSensitivity: "MEDIUM",
    maturityScore: 67,
    readinessScore: 72,
    transformationStage: "PILOT",
    transformationProgress: 65,
    aiAdoptionGoal: "Enable leadership-approved AI use with governance and training first.",
    individualizedLearningGoal: "Use assistive tools to support feedback and targeted interventions.",
    projectBasedLearningGoal: "Expand project routines to two departments.",
    selGoal: "Link advisory and behavior routines to clearer policy guidance.",
    school2Vision: "Leadership-driven transition engine that modernizes the school without replacing its curriculum."
  });

  const scale = await ensureSchool({
    name: "SMA Demo Bandung",
    city: "Bandung",
    region: "West Java",
    timezone: "Asia/Jakarta",
    type: "PRIVATE",
    curriculum: "National curriculum",
    curriculumNotes: "Scaling proven workflows rather than redesigning academic programs.",
    gradeBands: ["HIGH"],
    studentCount: 680,
    enrollment: 680,
    staffCount: 71,
    deviceModel: "ONE_TO_ONE",
    deviceRatio: "1:1 school-issued devices",
    ecosystem: "GOOGLE",
    connectivity: "HIGH",
    constraints: "Maintain parent confidence and board confidence during scale-up.",
    nonNegotiables: "Keep exam readiness intact while modernizing the operating model.",
    priorityOutcomes: ["Higher scores", "Project-based learning", "Operational efficiency"],
    currentTooling: ["Google Workspace", "Gemini for Education", "Zoom", "Notion"],
    budgetSensitivity: "HIGH",
    maturityScore: 84,
    readinessScore: 87,
    transformationStage: "SCALE",
    transformationProgress: 90,
    aiAdoptionGoal: "Standardize safe AI usage across departments.",
    individualizedLearningGoal: "Use workflow data to target coaching and intervention more effectively.",
    projectBasedLearningGoal: "Embed capstone and project coaching routines across the high school.",
    selGoal: "Improve advisory consistency and parent communication confidence.",
    school2Vision: "A multi-pillar School 2.0 rollout with disciplined governance and measurable operating leverage."
  });

  await ensureUser({ email: "hq@centum.id", name: "Centum HQ", role: "SUPER_ADMIN", active: true, password: passwordHash });
  const pilotAdmin = await ensureUser({ email: "admin.harapan@centum.id", name: "Harapan Admin", role: "ADMIN", active: true, password: passwordHash, schoolId: pilot.id });
  const pilotIT = await ensureUser({ email: "it.harapan@centum.id", name: "Harapan IT", role: "IT", active: true, password: passwordHash, schoolId: pilot.id });
  const pilotStaff = await ensureUser({ email: "staff.harapan@centum.id", name: "Harapan Staff", role: "STAFF", active: true, password: passwordHash, schoolId: pilot.id });
  await ensureUser({ email: "admin.nusantara@centum.id", name: "Nusantara Admin", role: "ADMIN", active: true, password: passwordHash, schoolId: onboarding.id });
  const scaleAdmin = await ensureUser({ email: "admin.bandung@centum.id", name: "Bandung Admin", role: "ADMIN", active: true, password: passwordHash, schoolId: scale.id });

  const tools = [
    {
      key: "google_workspace",
      name: "Google Workspace",
      description: "Core productivity and identity foundation for modern school operations.",
      category: "Foundation",
      useCase: "Identity, collaboration, communication",
      visibility: "SCHOOL_VISIBLE",
      maturity: "ESTABLISHED",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Google",
      providerNotes: "Suitable for most schools as a baseline operating layer.",
      prerequisiteNotes: "Google Admin Basics recommended before large-scale rollout."
    },
    {
      key: "google_classroom",
      name: "Google Classroom",
      description: "Lightweight workflow layer for assignments and classroom organization.",
      category: "Foundation",
      useCase: "Assignments and teacher workflow",
      visibility: "SCHOOL_VISIBLE",
      maturity: "ESTABLISHED",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Google",
      providerNotes: "Optional where schools want a lightweight classroom layer."
    },
    {
      key: "gemini_edu",
      name: "Gemini for Education",
      description: "Governed AI assistant for school-approved staff and student use cases.",
      category: "AI Enablement",
      useCase: "AI adoption, drafting, supported workflow automation",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "MEDIUM",
      riskLevel: "MEDIUM",
      providerName: "Google",
      providerNotes: "Should be introduced with policy retrieval and leadership approval.",
      prerequisiteNotes: "AI Foundations and AI Usage Policy review required."
    },
    {
      key: "ai_study_companion",
      name: "AI Study Companion",
      description: "Guided practice and feedback to support targeted intervention workflows.",
      category: "Individualized Learning",
      useCase: "Practice, feedback, study planning",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "MEDIUM",
      riskLevel: "MEDIUM",
      providerName: "Centum partner network",
      providerNotes: "Best introduced for pilot cohorts first."
    },
    {
      key: "ai_project_agent",
      name: "AI Project Agent",
      description: "Supports project coaching, milestones, and artifact review.",
      category: "Projects",
      useCase: "Project-based learning enablement",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "HIGH",
      riskLevel: "MEDIUM",
      providerName: "Centum partner network",
      providerNotes: "Useful once routines and project milestones are already defined."
    },
    {
      key: "notion",
      name: "Notion",
      description: "Shared operational playbooks, SOP notes, and implementation knowledge capture.",
      category: "Operations",
      useCase: "Playbooks, documentation, templates",
      visibility: "SCHOOL_VISIBLE",
      maturity: "ESTABLISHED",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Notion"
    },
    {
      key: "zoom",
      name: "Zoom",
      description: "Video meetings for parent communication, school walkthroughs, and training.",
      category: "Operations",
      useCase: "Meetings and recorded training",
      visibility: "SCHOOL_VISIBLE",
      maturity: "ESTABLISHED",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Zoom"
    },
    {
      key: "two_hour_learning",
      name: "2 Hour Learning",
      description: "High-cost, niche operating model that remains hidden unless explicitly recommended.",
      category: "Advanced Models",
      useCase: "Niche transformation model",
      visibility: "INTERNAL_ONLY",
      maturity: "EMERGING",
      costTier: "PREMIUM",
      riskLevel: "HIGH",
      providerName: "2 Hour Learning",
      providerNotes: "Keep consultant-only by default unless the school context strongly warrants it."
    }
  ];

  const toolMap = {};
  for (const tool of tools) {
    const saved = await ensureTool(tool);
    toolMap[tool.key] = saved;
  }

  const modules = [
    {
      key: "ai_foundations",
      title: "AI Classroom Foundations",
      description: "Leadership-safe rollout of AI workflows before broad classroom use.",
      totalLessons: 5,
      currentVersion: 1,
      videoUrl: "https://example.com/training/ai-foundations",
      transcript: "Video walkthrough, transcript, and checklist for safe AI implementation.",
      checklist: ["Watch the walkthrough", "Review AI policy", "Complete attestation"],
      attestationText: "I will use AI in line with school policy and escalation rules.",
      pillar: "AI_ENABLEMENT"
    },
    {
      key: "academic_integrity",
      title: "Academic Integrity in the AI Era",
      description: "Academic policy, integrity, and assessment design in AI-enabled environments.",
      totalLessons: 4,
      currentVersion: 2,
      videoUrl: "https://example.com/training/academic-integrity",
      transcript: "Recorded briefing on integrity, evidence, and allowed AI usage.",
      checklist: ["Review policy examples", "Complete quiz", "Acknowledge staff expectations"],
      attestationText: "I understand the latest integrity expectations.",
      pillar: "AI_ENABLEMENT"
    },
    {
      key: "project_coaching",
      title: "Project Coaching System",
      description: "Short-cycle project routines, milestones, and coaching loops.",
      totalLessons: 4,
      currentVersion: 1,
      videoUrl: "https://example.com/training/project-coaching",
      transcript: "Recorded project coaching walkthrough.",
      checklist: ["Set milestone cadence", "Adopt evidence artifacts", "Clarify feedback roles"],
      pillar: "PROJECTS"
    },
    {
      key: "google_admin",
      title: "Google Admin Basics",
      description: "Provisioning, policies, groups, and device/admin foundations.",
      totalLessons: 3,
      currentVersion: 1,
      videoUrl: "https://example.com/training/google-admin",
      transcript: "Recorded foundation for Google Workspace administration.",
      checklist: ["Review domain settings", "Confirm groups", "Confirm role ownership"],
      pillar: "AI_ENABLEMENT"
    },
    {
      key: "sel_routines",
      title: "SEL & Behavior Routines",
      description: "Leadership and staff routines for calmer classrooms and clearer escalation.",
      totalLessons: 3,
      currentVersion: 1,
      videoUrl: "https://example.com/training/sel-routines",
      transcript: "Recorded guidance for support routines and communication.",
      checklist: ["Review advisory routines", "Align behavior responses", "Review parent communications"],
      pillar: "SEL"
    }
  ];

  const moduleMap = {};
  for (const module of modules) {
    const saved = await ensureTraining(module);
    moduleMap[module.key] = saved;
  }

  const requirements = [
    { toolKey: "gemini_edu", moduleKey: "ai_foundations" },
    { toolKey: "gemini_edu", moduleKey: "academic_integrity" },
    { toolKey: "ai_study_companion", moduleKey: "ai_foundations" },
    { toolKey: "ai_project_agent", moduleKey: "project_coaching" },
    { toolKey: "google_workspace", moduleKey: "google_admin" }
  ];

  for (const requirement of requirements) {
    await prisma.toolRequirement.upsert({
      where: {
        toolId_moduleId: { toolId: toolMap[requirement.toolKey].id, moduleId: moduleMap[requirement.moduleKey].id }
      },
      update: {},
      create: { toolId: toolMap[requirement.toolKey].id, moduleId: moduleMap[requirement.moduleKey].id }
    });
  }

  const bundles = [
    {
      key: "core-google",
      name: "Core Google Stack",
      category: "Foundation",
      description: "Baseline communication, identity, and lightweight workflow stack.",
      overview: "Good foundation for schools starting their School 2.0 operating layer.",
      toolKeys: ["google_workspace", "google_classroom"],
      recommendedRoles: ["ADMIN", "IT", "TEACHER"]
    },
    {
      key: "ai-starter",
      name: "AI Starter Stack",
      category: "AI",
      description: "Governed AI rollout with training and policy prerequisites.",
      overview: "Use once leadership has approved the AI usage policy and training baseline.",
      toolKeys: ["gemini_edu", "ai_study_companion"],
      recommendedRoles: ["ADMIN", "IT", "COACH"]
    },
    {
      key: "projects-stack",
      name: "Projects Stack",
      category: "Learning Model",
      description: "Supports project coaching, milestone routines, and evidence capture.",
      overview: "Useful after initial project routines are defined by leadership.",
      toolKeys: ["ai_project_agent", "notion"],
      recommendedRoles: ["ADMIN", "COACH", "TEACHER"]
    },
    {
      key: "student-support-stack",
      name: "Student Support Stack",
      category: "Support",
      description: "Combines operational tools and support routines for calmer intervention work.",
      overview: "Helps schools make support response more consistent without changing curriculum.",
      toolKeys: ["google_workspace", "zoom", "notion"],
      recommendedRoles: ["ADMIN", "COACH", "TEACHER"]
    }
  ];

  const bundleMap = {};
  for (const bundle of bundles) {
    const saved = await ensureBundle(bundle);
    bundleMap[bundle.key] = saved;
  }

  const packs = [
    {
      key: "ai-enablement-pack",
      slug: "ai-enablement-pack",
      name: "AI Enablement Pack",
      pillar: "AI_ENABLEMENT",
      description: "Leadership-first AI adoption without forcing a curriculum change.",
      overview: "Governance, readiness, training, and a staged rollout path for safe AI adoption.",
      readinessChecklist: ["Upload AI usage policy", "Assign AI Foundations", "Confirm approval workflow"],
      implementationMilestones: ["Leadership review completed", "Pilot cohort selected", "Parent comms approved"],
      templateResources: ["AI parent FAQ", "AI launch memo", "teacher guardrails checklist"],
      recommendedToolCategories: ["AI Enablement", "Operations"],
      optionalBundleKeys: ["ai-starter"],
      proofPoints: ["Policy attestation complete", "pilot artifacts saved", "request backlog reduced"],
      nextActions: ["Finalize AI policy uploads", "Approve AI Starter bundle", "Assign AI Foundations"],
      suggestedTrainingKeys: ["ai_foundations", "academic_integrity"]
    },
    {
      key: "individualized-learning-pack",
      slug: "individualized-learning-pack",
      name: "Individualized Learning Pack",
      pillar: "INDIVIDUALIZED_LEARNING",
      description: "Operational supports for more targeted instruction and feedback.",
      overview: "Helps schools create repeatable intervention and feedback loops without replacing the curriculum.",
      readinessChecklist: ["Map intervention workflow", "Define feedback expectations", "Select pilot grades"],
      implementationMilestones: ["Pilot support workflow", "Review evidence", "Expand to second cohort"],
      templateResources: ["Intervention tracker", "teacher feedback template"],
      recommendedToolCategories: ["Individualized Learning"],
      optionalBundleKeys: ["ai-starter"],
      proofPoints: ["Faster intervention cycles", "improved feedback consistency"],
      nextActions: ["Select a target grade band", "Pilot the Study Companion", "Measure intervention turnaround"],
      suggestedTrainingKeys: ["ai_foundations"]
    },
    {
      key: "projects-pack",
      slug: "projects-pack",
      name: "Projects Pack",
      pillar: "PROJECTS",
      description: "Implementation routines for project-based learning support.",
      overview: "Project coaching, milestones, and evidence routines that stay curriculum-agnostic.",
      readinessChecklist: ["Define project artifacts", "Clarify milestone cadence", "Train project coaches"],
      implementationMilestones: ["One pilot department live", "milestone review ritual active", "student exhibitions captured"],
      templateResources: ["Project brief template", "milestone tracker"],
      recommendedToolCategories: ["Projects"],
      optionalBundleKeys: ["projects-stack"],
      proofPoints: ["Project milestone completion", "artifact quality review"],
      nextActions: ["Assign Project Coaching System", "Confirm milestone review rhythm", "Pilot in one subject area"],
      suggestedTrainingKeys: ["project_coaching"]
    },
    {
      key: "social-emotional-learning-pack",
      slug: "social-emotional-learning-pack",
      name: "Social-Emotional Learning Pack",
      pillar: "SEL",
      description: "Support routines, parent communication, and calmer response workflows.",
      overview: "Strengthens advisory, behavior, and communication routines as part of a broader transformation.",
      readinessChecklist: ["Upload behavior policy", "Upload incident escalation SOP", "Train key staff"],
      implementationMilestones: ["Advisory routines aligned", "parent comms templates approved", "incident follow-up audit"],
      templateResources: ["Behavior response checklist", "parent notification template"],
      recommendedToolCategories: ["Support"],
      optionalBundleKeys: ["student-support-stack"],
      proofPoints: ["Faster incident response", "clearer parent communications"],
      nextActions: ["Upload safeguarding and behavior docs", "Train support staff", "Review incident logging"],
      suggestedTrainingKeys: ["sel_routines"]
    }
  ];

  const packMap = {};
  for (const pack of packs) {
    const saved = await ensurePack(pack);
    packMap[pack.key] = saved;
  }

  for (const school of [onboarding, pilot, scale]) {
    for (const key of Object.keys(toolMap)) {
      const enabledByDefault = school.id === pilot.id
        ? !["ai_project_agent", "two_hour_learning"].includes(key)
        : school.id === scale.id
        ? key !== "two_hour_learning"
        : ["google_workspace", "notion", "zoom"].includes(key);

      await prisma.schoolTool.upsert({
        where: { schoolId_toolId: { schoolId: school.id, toolId: toolMap[key].id } },
        update: { enabled: enabledByDefault, recommended: ["gemini_edu", "ai_study_companion"].includes(key) },
        create: {
          schoolId: school.id,
          toolId: toolMap[key].id,
          enabled: enabledByDefault,
          recommended: ["gemini_edu", "ai_study_companion"].includes(key),
          eligible: key === "ai_study_companion" ? "Grades 8–12" : "Grades 7–12"
        }
      });
    }
  }

  await prisma.toolRecommendation.upsert({
    where: { schoolId_toolId: { schoolId: pilot.id, toolId: toolMap["gemini_edu"].id } },
    update: { reason: "Leadership-approved AI pilot after training completion.", status: "PENDING", recommendedById: pilotAdmin.id },
    create: { schoolId: pilot.id, toolId: toolMap["gemini_edu"].id, reason: "Leadership-approved AI pilot after training completion.", status: "PENDING", recommendedById: pilotAdmin.id }
  });
  await prisma.toolRecommendation.upsert({
    where: { schoolId_toolId: { schoolId: onboarding.id, toolId: toolMap["google_workspace"].id } },
    update: { reason: "Foundation operating layer before additional tools.", status: "ACCEPTED" },
    create: { schoolId: onboarding.id, toolId: toolMap["google_workspace"].id, reason: "Foundation operating layer before additional tools.", status: "ACCEPTED" }
  });

  for (const gate of [
    { schoolId: onboarding.id, key: "profile", title: "Complete school profile", order: 1, status: "COMPLETE" },
    { schoolId: onboarding.id, key: "governance", title: "Upload governance baseline", order: 2, status: "IN_PROGRESS" },
    { schoolId: onboarding.id, key: "pilot", title: "Define first pilot", order: 3, status: "NOT_STARTED" },
    { schoolId: pilot.id, key: "profile", title: "Complete school profile", order: 1, status: "COMPLETE" },
    { schoolId: pilot.id, key: "governance", title: "Upload governance baseline", order: 2, status: "COMPLETE" },
    { schoolId: pilot.id, key: "pilot", title: "Run first pilot", order: 3, status: "IN_PROGRESS" },
    { schoolId: scale.id, key: "profile", title: "Complete school profile", order: 1, status: "COMPLETE" },
    { schoolId: scale.id, key: "governance", title: "Upload governance baseline", order: 2, status: "COMPLETE" },
    { schoolId: scale.id, key: "pilot", title: "Pilot reviewed and expanded", order: 3, status: "COMPLETE" }
  ]) {
    await prisma.implementationGate.upsert({
      where: { schoolId_key: { schoolId: gate.schoolId, key: gate.key } },
      update: { title: gate.title, order: gate.order, status: gate.status, completedAt: gate.status === "COMPLETE" ? new Date() : null },
      create: { ...gate, description: null, completedAt: gate.status === "COMPLETE" ? new Date() : null }
    });
  }

  await prisma.schoolBundleAdoption.upsert({
    where: { schoolId_bundleId: { schoolId: pilot.id, bundleId: bundleMap["ai-starter"].id } },
    update: { status: "PLANNING", ownerId: pilotAdmin.id, notes: "Pending final leadership approval." },
    create: { schoolId: pilot.id, bundleId: bundleMap["ai-starter"].id, status: "PLANNING", ownerId: pilotAdmin.id, notes: "Pending final leadership approval." }
  });
  await prisma.schoolBundleAdoption.upsert({
    where: { schoolId_bundleId: { schoolId: scale.id, bundleId: bundleMap["projects-stack"].id } },
    update: { status: "ACTIVE", ownerId: scaleAdmin.id, notes: "Bundle active across the capstone pilot." },
    create: { schoolId: scale.id, bundleId: bundleMap["projects-stack"].id, status: "ACTIVE", ownerId: scaleAdmin.id, notes: "Bundle active across the capstone pilot." }
  });

  await prisma.schoolPackAdoption.upsert({
    where: { schoolId_packId: { schoolId: pilot.id, packId: packMap["ai-enablement-pack"].id } },
    update: { status: "ACTIVE", ownerId: pilotAdmin.id },
    create: { schoolId: pilot.id, packId: packMap["ai-enablement-pack"].id, status: "ACTIVE", ownerId: pilotAdmin.id }
  });
  await prisma.schoolPackAdoption.upsert({
    where: { schoolId_packId: { schoolId: scale.id, packId: packMap["projects-pack"].id } },
    update: { status: "ACTIVE", ownerId: scaleAdmin.id },
    create: { schoolId: scale.id, packId: packMap["projects-pack"].id, status: "ACTIVE", ownerId: scaleAdmin.id }
  });

  const behaviorDoc = await ensureGovernanceDocument({
    schoolId: pilot.id,
    createdById: pilotAdmin.id,
    title: "Behavior Policy",
    category: "BEHAVIOR_POLICY",
    summary: "Behavior responses, parent notification expectations, and escalation thresholds.",
    description: "Pilot school behavior policy",
    body: `Physical aggression triggers immediate removal from the immediate scene, a same-day incident note, and parent notification before the end of the school day. Leadership reviews whether suspension or in-school removal is required based on severity and repeat pattern. Staff should not make public disciplinary statements in front of peers.

If a student punches another student, the staff member ensures safety first, informs the principal or delegated school leader, documents the incident, and contacts the parent or guardian the same day. Repeat incidents require a leadership conference and a support plan.`
  });

  const aiPolicy = await ensureGovernanceDocument({
    schoolId: pilot.id,
    createdById: pilotAdmin.id,
    title: "AI Usage Policy",
    category: "AI_USAGE_POLICY",
    summary: "Leadership-approved boundaries for staff and student AI usage.",
    description: "AI use in the pilot school",
    body: `Student AI access may be enabled only after leadership approval, staff training completion, and confirmation that the school has published an approved AI usage policy. Staff must cite when AI materially contributes to parent-facing or student-facing outputs that affect judgement or grading.

School leaders should review safeguarding, academic integrity, and parent communication considerations before enabling student AI access.`
  });

  const safeguardingDoc = await ensureGovernanceDocument({
    schoolId: onboarding.id,
    createdById: pilotIT.id,
    title: "Incident Escalation SOP",
    category: "INCIDENT_ESCALATION",
    summary: "Operational steps for significant student incidents.",
    description: "Escalation SOP for leadership review",
    body: `For any incident involving physical harm, safeguarding risk, or suspected abuse, the staff member escalates immediately to the principal or safeguarding lead. The school records the timeline, the immediate response, and the communication steps taken with families. Staff must not improvise public statements or contradict the written escalation chain.`
  });

  await ensureGovernanceQuery({
    schoolId: pilot.id,
    userId: pilotAdmin.id,
    question: "A student punched another student. What does our SOP say we should do?",
    answer: "The behavior policy says to secure safety first, notify leadership immediately, record the incident, and contact the parent or guardian the same day. Repeat incidents require a leadership conference and support plan.",
    document: behaviorDoc
  });
  await ensureGovernanceQuery({
    schoolId: pilot.id,
    userId: pilotAdmin.id,
    question: "What should leadership review before enabling student AI access?",
    answer: "Leadership should review safeguarding, academic integrity, and parent communication considerations before enabling student AI access.",
    document: aiPolicy
  });

  const google = await ensureVendor({ key: "google", name: "Google", website: "https://edu.google.com", description: "Core productivity and AI provider." });
  const notionVendor = await ensureVendor({ key: "notion", name: "Notion", website: "https://www.notion.so", description: "Operational knowledge and playbook platform." });

  await prisma.license.upsert({
    where: { id: `pilot-google-license` },
    update: {},
    create: {
      id: `pilot-google-license`,
      schoolId: pilot.id,
      vendorId: google.id,
      toolId: toolMap["google_workspace"].id,
      name: "Google Workspace for Education",
      status: "ACTIVE",
      seatsPurchased: 480,
      seatsAssigned: 451,
      costNotes: "Education plan negotiated centrally.",
      ownerName: "Harapan IT",
      ownerEmail: "it.harapan@centum.id",
      implementationNotes: "Renewal review due before the next academic year."
    }
  });
  await prisma.license.upsert({
    where: { id: `scale-notion-license` },
    update: {},
    create: {
      id: `scale-notion-license`,
      schoolId: scale.id,
      vendorId: notionVendor.id,
      toolId: toolMap["notion"].id,
      name: "Notion team workspace",
      status: "ACTIVE",
      seatsPurchased: 90,
      seatsAssigned: 64,
      costNotes: "Used for implementation playbooks and evidence capture.",
      ownerName: "Bandung Admin",
      ownerEmail: "admin.bandung@centum.id",
      implementationNotes: "Shared with project coordinators and department leaders."
    }
  });

  const growthAssets = [
    {
      schoolId: pilot.id,
      slug: "parent-faq-ai-pilot",
      title: "Parent FAQ — AI Pilot",
      type: "FAQ",
      audience: "Parents",
      description: "A calm explainer for the first AI pilot.",
      body: `What is changing? We are piloting leadership-approved AI tools in limited settings. What is not changing? Our curriculum and final human responsibility remain the same. How are we keeping students safe? AI access only follows policy approval, staff training, and clear escalation rules.`
    },
    {
      schoolId: pilot.id,
      slug: "open-house-school-2-outline",
      title: "Open House Deck Outline",
      type: "DECK_OUTLINE",
      audience: "Parents and prospective families",
      description: "Storyline for how the school is becoming School 2.0.",
      body: `Slide 1: Why School 2.0. Slide 2: What stays the same. Slide 3: Governance and safety. Slide 4: Training and teacher enablement. Slide 5: Evidence from pilot routines.`
    },
    {
      schoolId: scale.id,
      slug: "centum-track-explainer",
      title: "What is the Centum Track?",
      type: "EXPLAINER",
      audience: "Parents",
      description: "Explainer draft for family-facing communication.",
      body: `The Centum Track is not a new curriculum. It is the school's structured transition into School 2.0: safer AI adoption, stronger projects, clearer support routines, and leadership-ready governance.`
    }
  ];

  for (const asset of growthAssets) {
    await prisma.growthAsset.upsert({ where: { slug: asset.slug }, update: asset, create: asset });
  }

  await prisma.trainingCompletion.upsert({
    where: { userId_moduleId_version: { userId: pilotStaff.id, moduleId: moduleMap["academic_integrity"].id, version: 1 } },
    update: {},
    create: { userId: pilotStaff.id, moduleId: moduleMap["academic_integrity"].id, version: 1 }
  });
  await prisma.trainingCompletion.upsert({
    where: { userId_moduleId_version: { userId: scaleAdmin.id, moduleId: moduleMap["project_coaching"].id, version: 1 } },
    update: {},
    create: { userId: scaleAdmin.id, moduleId: moduleMap["project_coaching"].id, version: 1 }
  });

  let pilotRun = await prisma.copilotRun.findFirst({ where: { schoolId: pilot.id }, orderBy: { createdAt: "desc" } });
  if (!pilotRun) {
    pilotRun = await prisma.copilotRun.create({
      data: {
        schoolId: pilot.id,
        createdById: pilotAdmin.id,
        readinessScore: pilot.readinessScore,
        maturityScore: pilot.maturityScore,
        maturitySummary: "Harapan is in a strong pilot position: governance baseline exists, leadership is aligned, and the next leverage point is training completion plus careful AI rollout.",
        blockers: ["Academic integrity retraining still incomplete for some staff.", "AI Starter bundle still waiting for final approval."],
        nextActions: ["Complete current policy retraining.", "Approve AI Starter bundle.", "Publish parent-facing pilot FAQ."],
        recommendedBundleKeys: ["ai-starter", "projects-stack"],
        recommendedPackKeys: ["ai-enablement-pack", "projects-pack"],
        suggestedTrainingKeys: ["ai_foundations", "academic_integrity", "project_coaching"],
        plan30: ["Complete governance review", "Assign training", "Approve pilot cohort"],
        plan60: ["Run the first approved AI pilot", "Review parent comms feedback", "Capture evidence artifacts"],
        plan90: ["Expand the pilot", "Publish executive report", "Decide what scales"],
        executiveSummary: "Harapan should move forward as a governed AI-native pilot school without changing curriculum. The clearest next step is to finish retraining, approve the AI Starter bundle, and use the Governance & Support Center as the decision backbone."
      }
    });
  }

  const pilotRecommendations = [
    { kind: "BLOCKER", title: "Complete academic integrity retraining", description: "Current policy version is not yet complete for all relevant staff." },
    { kind: "NEXT_ACTION", title: "Approve AI Starter bundle", description: "Bundle is already staged and waiting for final sign-off." },
    { kind: "PACK", title: "Activate AI Enablement Pack", description: "Keeps rollout leadership-first and governed." },
    { kind: "TRAINING", title: "Assign AI Foundations", description: "Required before enabling broader AI usage." }
  ];

  for (const rec of pilotRecommendations) {
    await prisma.copilotRecommendation.create({
      data: { runId: pilotRun.id, schoolId: pilot.id, kind: rec.kind, title: rec.title, description: rec.description, status: "PENDING" }
    });
  }

  if ((await prisma.student.count({ where: { schoolId: pilot.id } })) === 0) {
    await prisma.student.createMany({
      data: [
        { schoolId: pilot.id, studentCode: "HRP-0001", name: "Sophia Tan", grade: 8, status: "ACTIVE", coachName: "Dewi" },
        { schoolId: pilot.id, studentCode: "HRP-0002", name: "Alif Jaya", grade: 9, status: "ACTIVE", coachName: "Budi" },
        { schoolId: pilot.id, studentCode: "HRP-0003", name: "Nadine Putri", grade: 10, status: "PENDING", coachName: "Coach Dewi" }
      ]
    });
  }

  if ((await prisma.request.count({ where: { schoolId: pilot.id } })) === 0) {
    await prisma.request.create({
      data: {
        schoolId: pilot.id,
        kind: "STACK_BUNDLE",
        type: "Approve AI Starter bundle",
        description: "Leadership review for AI Starter rollout.",
        status: "SUBMITTED",
        submittedById: pilotStaff.id,
        bundleKey: "ai-starter"
      }
    });
  }

  if ((await prisma.ticket.count({ where: { schoolId: pilot.id } })) === 0) {
    await prisma.ticket.create({
      data: {
        schoolId: pilot.id,
        category: "Implementation",
        subject: "Policy upload cleanup",
        description: "Need final review of the AI Usage Policy before broader access.",
        status: "OPEN",
        submittedById: pilotStaff.id,
        assignedToId: pilotIT.id
      }
    });
  }

  const knowledgeArticles = [
    {
      slug: "school-2-0-principles",
      title: "School 2.0 principles",
      category: "Transformation",
      excerpt: "Centum helps schools modernize without forcing a curriculum change.",
      body: "Centum Stack is curriculum-agnostic, tool-agnostic, leadership-first, and designed to scale delivery through reusable playbooks, governance, and training.",
      published: true
    },
    {
      slug: "why-governance-before-ai-access",
      title: "Why governance comes before AI access",
      category: "Governance",
      excerpt: "Leadership should retrieve, cite, and review policy first.",
      body: "The Governance & Support Center is retrieval-first by design. Leaders should quote policy, review the source document, and escalate to humans for high-risk decisions.",
      published: true
    }
  ];

  for (const article of knowledgeArticles) {
    await prisma.knowledgeArticle.upsert({
      where: { slug: article.slug },
      update: article,
      create: article
    });
  }

  console.log("Centum Stack V2 demo data seeded.");
  console.log("Demo accounts:");
  console.log("- hq@centum.id / password");
  console.log("- admin.harapan@centum.id / password");
  console.log("- staff.harapan@centum.id / password");
  console.log("- it.harapan@centum.id / password");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
