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
    isDemo: true,
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
    isDemo: true,
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
    isDemo: true,
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


  const globalNusantara = await ensureSchool({
    name: "Global Nusantara School",
    city: "Jakarta Barat",
    region: "DKI Jakarta",
    addressLine1: "Taman Meruya Ilir, Jalan Taman Meruya Ilir Blok L/1, RT 4/RW 2, Meruya Utara, Kec. Kembangan, Kota Jakarta Barat, DKI Jakarta 11620",
    website: "https://gns.sch.id/",
    contactEmail: "info@gns.sch.id",
    contactPhone: "(021) 58902899",
    schoolNotes: "Real onboarding school. Enrollment 60 is currently provisional from internal note and should be confirmed during discovery.",
    isDemo: false,
    timezone: "Asia/Jakarta",
    type: "PRIVATE",
    curriculum: "Cambridge / SPK",
    curriculumNotes: "Real onboarding shell created from public school information and internal onboarding note.",
    gradeBands: ["PRIMARY", "MIDDLE", "HIGH"],
    studentCount: 60,
    enrollment: 60,
    staffCount: 12,
    deviceModel: "SHARED",
    deviceRatio: "To be confirmed during onboarding",
    ecosystem: "MIXED",
    connectivity: "MEDIUM",
    constraints: "Real onboarding shell. Discovery and policy uploads still required.",
    nonNegotiables: "Do not contaminate investor-demo schools. Keep onboarding in a clean separate record.",
    priorityOutcomes: ["Onboarding readiness", "Safe AI adoption", "Leadership governance"],
    currentTooling: ["To be confirmed"],
    budgetSensitivity: "MEDIUM",
    maturityScore: 18,
    readinessScore: 24,
    transformationStage: "ONBOARDING",
    transformationProgress: 8,
    aiAdoptionGoal: "Start governance-first AI adoption after discovery and policy review.",
    individualizedLearningGoal: "To be defined during onboarding.",
    projectBasedLearningGoal: "To be defined during onboarding.",
    selGoal: "To be defined during onboarding.",
    school2Vision: "Create a clean onboarding shell for a real school entering the Centum process."
  });

  const empathy = await ensureSchool({
    name: "Empathy School Bali",
    city: "Gianyar",
    region: "Bali",
    addressLine1: "Jl. Raya Pejeng Kangin No. 8, Pejeng Kangin, Tampaksiring, Kabupaten Gianyar, Bali 80552, Indonesia",
    website: "https://empathy.school/",
    contactEmail: "admin@empathy.school",
    contactPhone: "+62 812-3862-2573",
    schoolNotes: "Real test / pilot school. Justin, Jesse, and Lily are seeded as teacher/mentor users so they can test the platform.",
    isDemo: false,
    timezone: "Asia/Makassar",
    type: "PRIVATE",
    curriculum: "Alternative / child-led",
    curriculumNotes: "Ages 1-15 from the public school description; pilot shell for teacher/mentor testing.",
    gradeBands: ["EARLY_YEARS", "PRIMARY", "MIDDLE"],
    studentCount: 75,
    enrollment: 75,
    staffCount: 18,
    deviceModel: "BYOD",
    deviceRatio: "Mixed; to be confirmed with school",
    ecosystem: "MIXED",
    connectivity: "HIGH",
    constraints: "Teacher-facing testing should stay simple and classroom-first.",
    nonNegotiables: "Keep separate from frozen investor demo schools.",
    priorityOutcomes: ["Teacher testing", "Prompt tools", "Lesson plan rollout", "Student portal framing"],
    currentTooling: ["Google Workspace", "WhatsApp", "To be confirmed"],
    budgetSensitivity: "MEDIUM",
    maturityScore: 38,
    readinessScore: 46,
    transformationStage: "PILOT",
    transformationProgress: 28,
    aiAdoptionGoal: "Support teacher and mentor testing with governed prompt-building and guide workflows.",
    individualizedLearningGoal: "Explore teacher-facing supports before a future learner portal.",
    projectBasedLearningGoal: "Use Project Finder AI and Inquiry Forge as light-entry pilots.",
    selGoal: "Use resiliency lesson plans and reflection supports as classroom-facing starting points.",
    school2Vision: "Pilot a teacher-first School 2.0 experience without disturbing the investor demo layer."
  });

    await ensureUser({ email: "hq@centum.id", name: "Centum HQ", role: "SUPER_ADMIN", active: true, password: passwordHash });
  const pilotAdmin = await ensureUser({ email: "admin.harapan@centum.id", name: "Harapan Admin", role: "ADMIN", active: true, password: passwordHash, schoolId: pilot.id });
  const pilotIT = await ensureUser({ email: "it.harapan@centum.id", name: "Harapan IT", role: "IT", active: true, password: passwordHash, schoolId: pilot.id });
  const pilotStaff = await ensureUser({ email: "staff.harapan@centum.id", name: "Harapan Staff", role: "STAFF", active: true, password: passwordHash, schoolId: pilot.id });
  const pilotTeacher = await ensureUser({ email: "teacher.harapan@centum.id", name: "Harapan Teacher", role: "TEACHER", active: true, password: passwordHash, schoolId: pilot.id });
  await ensureUser({ email: "admin.nusantara@centum.id", name: "Nusantara Admin", role: "ADMIN", active: true, password: passwordHash, schoolId: onboarding.id });
  const globalAdmin = await ensureUser({ email: "admin.globalnusantara.demo@centum.id", name: "Global Nusantara Admin", role: "ADMIN", active: true, password: passwordHash, schoolId: globalNusantara.id });
  const globalIT = await ensureUser({ email: "it.globalnusantara.demo@centum.id", name: "Global Nusantara IT", role: "IT", active: true, password: passwordHash, schoolId: globalNusantara.id });
  const globalStaff = await ensureUser({ email: "staff.globalnusantara.demo@centum.id", name: "Global Nusantara Staff", role: "STAFF", active: true, password: passwordHash, schoolId: globalNusantara.id });
  const empathyAdmin = await ensureUser({ email: "admin.empathy.demo@centum.id", name: "Empathy Admin", role: "ADMIN", active: true, password: passwordHash, schoolId: empathy.id });
  const empathyJustin = await ensureUser({ email: "justin.empathy.demo@centum.id", name: "Justin", role: "TEACHER", active: true, password: passwordHash, schoolId: empathy.id });
  const empathyJesse = await ensureUser({ email: "jesse.empathy.demo@centum.id", name: "Jesse", role: "TEACHER", active: true, password: passwordHash, schoolId: empathy.id });
  const empathyLily = await ensureUser({ email: "lily.empathy.demo@centum.id", name: "Lily", role: "TEACHER", active: true, password: passwordHash, schoolId: empathy.id });
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
      key: "google_email_foundation",
      name: "Google Email & Identity",
      description: "Packaged Google email, accounts, and identity setup for schools that need a clean foundational baseline.",
      category: "Foundation",
      useCase: "Email, identity, onboarding",
      visibility: "SCHOOL_VISIBLE",
      maturity: "ESTABLISHED",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Google",
      providerNotes: "Useful as a school-friendly foundational service even when broader Google Workspace setup is also in scope.",
      prerequisiteNotes: "Google Admin Basics recommended before wide rollout."
    },
    {
      key: "gemini_access",
      name: "Gemini Access",
      description: "Governed Gemini access packaged for leadership approval, staff rollout, and staged student enablement.",
      category: "AI Enablement",
      useCase: "Governed Gemini usage",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "MEDIUM",
      riskLevel: "MEDIUM",
      providerName: "Google",
      providerNotes: "Best positioned as governed access rather than unrestricted AI usage.",
      prerequisiteNotes: "AI Foundations and Academic Integrity should be complete first."
    },
    {
      key: "project_finder_ai",
      name: "Project Finder AI",
      description: "Lightweight project discovery app that helps staff or learners quickly find project directions and ideas.",
      category: "Projects",
      useCase: "Project discovery and project-based learning ideation",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "A simple first service offer that can sit in front of a broader projects rollout."
    },
    {
      key: "gemini_buddy",
      name: "Gemini Buddy",
      description: "Prompt scaffolding assistant that helps teachers or students get stronger Gemini outputs faster.",
      category: "AI Enablement",
      useCase: "Prompt scaffolding for Gemini",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Can point to the same underlying prompt app as Prompt Buddy while being packaged for a different audience."
    },
    {
      key: "prompt_buddy",
      name: "Prompt Buddy",
      description: "General prompt-building assistant for classroom planning, drafting, feedback, and internal staff workflows.",
      category: "AI Enablement",
      useCase: "Prompt generation",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Useful as a fast-win AI service that does not force major workflow change."
    },
    {
      key: "teacher_prompt_companion",
      name: "Teacher Prompt Companion",
      description: "Teacher-facing packaging of the prompt-building layer for lesson planning, worksheets, rubrics, and parent communication drafts.",
      category: "AI Enablement",
      useCase: "Teacher prompt generation",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Can share the same underlying app as Prompt Buddy while looking more specific and premium in demos."
    },
    {
      key: "leadership_governance_assistant",
      name: "Leadership Governance Assistant",
      description: "Leadership-facing governance and decision support for safer approvals, policy review, and rollout decisions.",
      category: "Governance",
      useCase: "Leadership governance and approvals",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Positions the governance story as a practical leadership app, not an autonomous advisor."
    },
    {
      key: "office_admin_ai",
      name: "Office Admin AI",
      description: "AI-powered office admin helper, powered by Clawbot, for school processes, repetitive tasks, and operational support.",
      category: "Operations",
      useCase: "Office workflows and process automation",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Useful as a visible operational quick win for school admin teams."
    },
    {
      key: "hr_rapid_review_bot",
      name: "HR Rapid Review Bot",
      description: "Screens resumes quickly so schools can move faster on recruitment without a large HR team.",
      category: "Operations",
      useCase: "Recruitment and resume triage",
      visibility: "CONSULTANT_ONLY",
      maturity: "PILOT_READY",
      costTier: "LOW",
      riskLevel: "MEDIUM",
      providerName: "Centum",
      providerNotes: "Strong investor story for back-office leverage even if some schools never buy it."
    },
    {
      key: "centum_learning_guide_builder",
      name: "Centum Learning Guide Builder",
      description: "Built-in deterministic prompt builder for teachers and students with separate modes, subject chat starters, walkthrough prompts, and Gemini-ready outputs.",
      category: "AI Enablement",
      useCase: "Prompt generation and classroom support",
      visibility: "SCHOOL_VISIBLE",
      maturity: "ESTABLISHED",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Implemented directly inside the product as /guide-builder and /prompt-maker.",
      prerequisiteNotes: "Guide Builder Quickstart recommended for first use."
    },
    {
      key: "empathy_leadership_platform",
      name: "Empathy Leadership Platform",
      description: "Packaged leadership platform concept with SOP retrieval, shared dashboarding, and multiple leadership modules.",
      category: "Governance",
      useCase: "Leadership coordination and operating rhythm",
      visibility: "CONSULTANT_ONLY",
      maturity: "PILOT_READY",
      costTier: "MEDIUM",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Represented as a packaged offering inside Centum Stack, even when deployed as a linked or separate surface later."
    },
    {
      key: "hr_dashboard_suite",
      name: "HR Dashboard Suite",
      description: "Structured school HR toolkit covering recruiting, onboarding, employee records, retention, staffing, and analytics.",
      category: "Operations",
      useCase: "HR workflows and back-office leverage",
      visibility: "CONSULTANT_ONLY",
      maturity: "PILOT_READY",
      costTier: "MEDIUM",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Useful to show broad operational leverage even if some schools never buy it."
    },
    {
      key: "sentinel_guide_builder",
      name: "Sentinel Guide Builder",
      description: "Helps teachers and students generate stronger Gemini prompts, lessons, and study support quickly.",
      category: "AI Enablement",
      useCase: "Prompt support and study support",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Important as a packaged AI support service for teachers and students."
    },
    {
      key: "interactive_prompt_walkthrough",
      name: "Interactive Prompt Walkthrough",
      description: "Guided prompt-learning system that teaches students how to build interactive prompts with Gemini.",
      category: "AI Enablement",
      useCase: "Prompt literacy and student prompt practice",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Can be positioned as either curriculum support or a linked training asset."
    },
    {
      key: "resiliency_ai_for_kids",
      name: "Resiliency AI for Kids",
      description: "Interactive student-facing app extension of the resiliency lesson-plan library.",
      category: "Support",
      useCase: "Student support and resilience routines",
      visibility: "RECOMMENDABLE",
      maturity: "EMERGING",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Prepare this in the catalog even if it is still being finalized."
    },
    {
      key: "inquiry_forge",
      name: "Inquiry Forge",
      description: "Teacher tool that generates structured prompts, topic lists, and project plans for history and social studies research with Gemini.",
      category: "Projects",
      useCase: "Research prompts and topic planning",
      visibility: "RECOMMENDABLE",
      maturity: "PILOT_READY",
      costTier: "LOW",
      riskLevel: "LOW",
      providerName: "Centum",
      providerNotes: "Useful as a concrete teacher productivity story inside projects and inquiry learning."
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
    },
    {
      key: "resiliency_lesson_plans",
      title: "Resiliency Lesson Plans Library",
      description: "Quick-start resiliency lesson plans for advisory, pastoral care, and calm classroom routines.",
      totalLessons: 3,
      currentVersion: 1,
      videoUrl: "https://example.com/resiliency-lesson-plans",
      transcript: "Walkthrough for where the resiliency lesson plans fit and how schools can launch them without changing curriculum.",
      checklist: ["Open the lesson-plan library", "Choose an advisory entry point", "Align facilitator notes"],
      pillar: "SEL"
    },
    {
      key: "ai_prompt_design",
      title: "AI Prompt Craft Fundamentals",
      description: "Curriculum-agnostic training on how teachers and students can build stronger prompts for Gemini and similar tools.",
      totalLessons: 4,
      currentVersion: 1,
      videoUrl: "https://example.com/ai-prompt-curriculum",
      transcript: "Recorded introduction to prompt design, iteration, tone control, and structured prompting.",
      checklist: ["Review prompt anatomy", "Practice prompt iteration", "Test prompts in Gemini"],
      attestationText: "I will use prompt-building support responsibly and verify outputs before use.",
      pillar: "AI_ENABLEMENT"
    },
    {
      key: "interactive_prompt_walkthrough",
      title: "Interactive Prompt Walkthrough",
      description: "Guided walkthrough for students and teachers learning how to build interactive prompts step by step.",
      totalLessons: 3,
      currentVersion: 1,
      videoUrl: "https://example.com/interactive-prompt-walkthrough",
      transcript: "Recorded walkthrough for prompt iteration, refinement, and student-friendly AI practice.",
      checklist: ["Open the walkthrough", "Practice a guided prompt", "Reflect on output quality"],
      pillar: "AI_ENABLEMENT"
    },
    {
      key: "guide_builder_quickstart",
      title: "Guide Builder Quickstart",
      description: "Quick-start training for teachers and students using the Centum Learning Guide Builder and Prompt Maker surfaces.",
      totalLessons: 2,
      currentVersion: 1,
      videoUrl: "/guide-builder",
      transcript: "Quickstart walkthrough for Teacher mode, Student mode, subject-chat starters, and copy-to-Gemini flow.",
      checklist: ["Open the Guide Builder", "Try one teacher preset", "Try one student preset", "Copy and test a prompt in Gemini"],
      attestationText: "I understand that the Guide Builder creates prompts and scaffolds, not final judgement-free answers.",
      pillar: "AI_ENABLEMENT"
    },
    {
      key: "project_launch_samples",
      title: "Project Launch Lesson Samples",
      description: "Sample teacher lesson plans for launching project work in a low-friction way.",
      totalLessons: 2,
      currentVersion: 1,
      videoUrl: "https://example.com/project-launch-lesson-samples",
      transcript: "Quick explanation of how the project launch samples help teachers start faster.",
      checklist: ["Open the sample library", "Select a launch routine", "Adapt to one class"],
      pillar: "PROJECTS"
    },
    {
      key: "ai_reflection_samples",
      title: "AI Reflection Lesson Samples",
      description: "Short classroom routines and prompts for responsible AI reflection and discussion.",
      totalLessons: 2,
      currentVersion: 1,
      videoUrl: "https://example.com/ai-reflection-lesson-samples",
      transcript: "Guidance on using AI reflection lesson samples in advisory or subject classrooms.",
      checklist: ["Review sample reflections", "Choose one activity", "Facilitate classroom discussion"],
      pillar: "AI_ENABLEMENT"
    }
  ];

  const moduleMap = {};
  for (const trainingModule of modules) {
    const saved = await ensureTraining(trainingModule);
    moduleMap[trainingModule.key] = saved;
  }

  const requirements = [
    { toolKey: "gemini_edu", moduleKey: "ai_foundations" },
    { toolKey: "gemini_edu", moduleKey: "academic_integrity" },
    { toolKey: "gemini_access", moduleKey: "ai_foundations" },
    { toolKey: "gemini_access", moduleKey: "academic_integrity" },
    { toolKey: "gemini_buddy", moduleKey: "ai_prompt_design" },
    { toolKey: "prompt_buddy", moduleKey: "ai_prompt_design" },
    { toolKey: "teacher_prompt_companion", moduleKey: "ai_prompt_design" },
    { toolKey: "centum_learning_guide_builder", moduleKey: "guide_builder_quickstart" },
    { toolKey: "sentinel_guide_builder", moduleKey: "ai_prompt_design" },
    { toolKey: "interactive_prompt_walkthrough", moduleKey: "interactive_prompt_walkthrough" },
    { toolKey: "inquiry_forge", moduleKey: "project_launch_samples" },
    { toolKey: "office_admin_ai", moduleKey: "google_admin" },
    { toolKey: "leadership_governance_assistant", moduleKey: "ai_foundations" },
    { toolKey: "ai_study_companion", moduleKey: "ai_foundations" },
    { toolKey: "project_finder_ai", moduleKey: "project_coaching" },
    { toolKey: "ai_project_agent", moduleKey: "project_coaching" },
    { toolKey: "google_workspace", moduleKey: "google_admin" },
    { toolKey: "google_email_foundation", moduleKey: "google_admin" }
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
      key: "google-gemini-foundation",
      name: "Google & Gemini Foundation",
      category: "Foundation",
      description: "Foundational Google email and governed Gemini access packaged as a calm first step.",
      overview: "Useful when a school wants a clean baseline service package before bigger transformation decisions.",
      toolKeys: ["google_email_foundation", "google_workspace", "gemini_access"],
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
      key: "prompting-companion-stack",
      name: "Prompting Companion Stack",
      category: "AI",
      description: "Shows schools multiple prompt-building entry points without forcing a major platform change.",
      overview: "Useful for investor demos and for schools that want packaged teacher or student prompt support.",
      toolKeys: ["gemini_access", "gemini_buddy", "prompt_buddy", "teacher_prompt_companion"],
      recommendedRoles: ["ADMIN", "COACH", "TEACHER"]
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
      key: "project-discovery-stack",
      name: "Project Discovery Stack",
      category: "Learning Model",
      description: "A lightweight entry point for project-based learning discovery and ideation.",
      overview: "Useful when a school wants to trial project discovery before committing to a broader projects rollout.",
      toolKeys: ["project_finder_ai", "ai_project_agent"],
      recommendedRoles: ["ADMIN", "COACH", "TEACHER"]
    },
    {
      key: "leadership-ops-stack",
      name: "Leadership Ops Stack",
      category: "Operations",
      description: "Packages leadership governance, office admin support, HR speed, and governed Gemini access into one executive-facing offer.",
      overview: "Useful for investors and school owners who want to see how Centum can reduce operational burden without changing curriculum.",
      toolKeys: ["leadership_governance_assistant", "office_admin_ai", "hr_rapid_review_bot", "google_email_foundation", "gemini_access"],
      recommendedRoles: ["SUPER_ADMIN", "ADMIN", "IT"]
    },
    {
      key: "guide-builder-starter",
      name: "Guide Builder Starter",
      category: "AI",
      description: "Teacher and student prompt-building starter package centered on the built-in Learning Guide Builder.",
      overview: "Useful for schools that want a real in-platform prompt tool before broader AI tooling decisions.",
      toolKeys: ["centum_learning_guide_builder", "gemini_access", "teacher_prompt_companion"],
      recommendedRoles: ["ADMIN", "COACH", "TEACHER"]
    },
    {
      key: "teacher-ai-companion-stack",
      name: "Teacher AI Companion Stack",
      category: "AI",
      description: "Packages teacher prompt support, inquiry scaffolds, guided walkthroughs, and project discovery into a flexible classroom support story.",
      overview: "Useful when a school wants to show many teacher-facing wins quickly even if the underlying tools overlap operationally.",
      toolKeys: ["sentinel_guide_builder", "teacher_prompt_companion", "interactive_prompt_walkthrough", "inquiry_forge", "project_finder_ai"],
      recommendedRoles: ["ADMIN", "COACH", "TEACHER"]
    },
    {
      key: "student-support-stack",
      name: "Student Support Stack",
      category: "Support",
      description: "Combines operational tools and support routines for calmer intervention work.",
      overview: "Helps schools make support response more consistent without changing curriculum.",
      toolKeys: ["google_workspace", "zoom", "notion", "resiliency_ai_for_kids"],
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
      templateResources: ["AI parent FAQ", "AI launch memo", "teacher guardrails checklist", "AI prompt curriculum overview"],
      recommendedToolCategories: ["AI Enablement", "Operations"],
      optionalBundleKeys: ["ai-starter", "google-gemini-foundation", "prompting-companion-stack"],
      proofPoints: ["Policy attestation complete", "pilot artifacts saved", "request backlog reduced"],
      nextActions: ["Finalize AI policy uploads", "Approve AI Starter bundle", "Assign AI Foundations", "Publish the prompt-craft curriculum"],
      suggestedTrainingKeys: ["ai_foundations", "academic_integrity", "ai_prompt_design"]
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
      templateResources: ["Project brief template", "milestone tracker", "project finder launch note"],
      recommendedToolCategories: ["Projects"],
      optionalBundleKeys: ["projects-stack", "project-discovery-stack"],
      proofPoints: ["Project milestone completion", "artifact quality review"],
      nextActions: ["Assign Project Coaching System", "Confirm milestone review rhythm", "Pilot in one subject area", "Link Project Finder AI for ideation"],
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
      templateResources: ["Behavior response checklist", "parent notification template", "resiliency lesson-plan link"],
      recommendedToolCategories: ["Support"],
      optionalBundleKeys: ["student-support-stack"],
      proofPoints: ["Faster incident response", "clearer parent communications"],
      nextActions: ["Upload safeguarding and behavior docs", "Train support staff", "Review incident logging", "Link the resiliency lesson-plan library"],
      suggestedTrainingKeys: ["sel_routines", "resiliency_lesson_plans"]
    }
  ];

  const packMap = {};
  for (const pack of packs) {
    const saved = await ensurePack(pack);
    packMap[pack.key] = saved;
  }

  for (const school of [onboarding, pilot, scale, globalNusantara, empathy]) {
    for (const key of Object.keys(toolMap)) {
      const enabledByDefault = school.id === pilot.id
        ? ["google_workspace", "google_classroom", "gemini_edu", "gemini_access", "ai_study_companion", "google_email_foundation", "notion", "zoom"].includes(key)
        : school.id === scale.id
        ? !["two_hour_learning", "teacher_prompt_companion"].includes(key)
        : school.id === empathy.id
        ? ["google_workspace", "google_email_foundation", "centum_learning_guide_builder", "project_finder_ai", "sentinel_guide_builder", "gemini_buddy"].includes(key)
        : school.id === globalNusantara.id
        ? ["google_email_foundation", "google_workspace", "centum_learning_guide_builder"].includes(key)
        : ["google_workspace", "google_email_foundation", "notion", "zoom"].includes(key);

      await prisma.schoolTool.upsert({
        where: { schoolId_toolId: { schoolId: school.id, toolId: toolMap[key].id } },
        update: { enabled: enabledByDefault, recommended: ["gemini_edu", "ai_study_companion", "gemini_access", "project_finder_ai", "prompt_buddy"].includes(key) },
        create: {
          schoolId: school.id,
          toolId: toolMap[key].id,
          enabled: enabledByDefault,
          recommended: ["gemini_edu", "ai_study_companion", "gemini_access", "project_finder_ai", "prompt_buddy"].includes(key),
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
  await prisma.toolRecommendation.upsert({
    where: { schoolId_toolId: { schoolId: pilot.id, toolId: toolMap["project_finder_ai"].id } },
    update: { reason: "Useful for showing a light project-based learning entry point.", status: "PENDING", recommendedById: pilotAdmin.id },
    create: { schoolId: pilot.id, toolId: toolMap["project_finder_ai"].id, reason: "Useful for showing a light project-based learning entry point.", status: "PENDING", recommendedById: pilotAdmin.id }
  });
  await prisma.toolRecommendation.upsert({
    where: { schoolId_toolId: { schoolId: pilot.id, toolId: toolMap["prompt_buddy"].id } },
    update: { reason: "Good fast-win prompt support for staff using Gemini.", status: "PENDING", recommendedById: pilotAdmin.id },
    create: { schoolId: pilot.id, toolId: toolMap["prompt_buddy"].id, reason: "Good fast-win prompt support for staff using Gemini.", status: "PENDING", recommendedById: pilotAdmin.id }
  });
  await prisma.toolRecommendation.upsert({
    where: { schoolId_toolId: { schoolId: globalNusantara.id, toolId: toolMap["centum_learning_guide_builder"].id } },
    update: { reason: "Useful as a safe first AI prompt layer during onboarding.", status: "RECOMMENDED", recommendedById: globalAdmin.id },
    create: { schoolId: globalNusantara.id, toolId: toolMap["centum_learning_guide_builder"].id, reason: "Useful as a safe first AI prompt layer during onboarding.", status: "RECOMMENDED", recommendedById: globalAdmin.id }
  });
  await prisma.toolRecommendation.upsert({
    where: { schoolId_toolId: { schoolId: empathy.id, toolId: toolMap["centum_learning_guide_builder"].id } },
    update: { reason: "Core teacher-facing testing surface for Empathy mentors.", status: "ACCEPTED", recommendedById: empathyAdmin.id },
    create: { schoolId: empathy.id, toolId: toolMap["centum_learning_guide_builder"].id, reason: "Core teacher-facing testing surface for Empathy mentors.", status: "ACCEPTED", recommendedById: empathyAdmin.id }
  });
  await prisma.toolRecommendation.upsert({
    where: { schoolId_toolId: { schoolId: empathy.id, toolId: toolMap["project_finder_ai"].id } },
    update: { reason: "Useful teacher-facing pilot for projects and community partnerships.", status: "PENDING", recommendedById: empathyAdmin.id },
    create: { schoolId: empathy.id, toolId: toolMap["project_finder_ai"].id, reason: "Useful teacher-facing pilot for projects and community partnerships.", status: "PENDING", recommendedById: empathyAdmin.id }
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
    { schoolId: scale.id, key: "pilot", title: "Pilot reviewed and expanded", order: 3, status: "COMPLETE" },
    { schoolId: globalNusantara.id, key: "profile", title: "Complete school profile", order: 1, status: "IN_PROGRESS" },
    { schoolId: globalNusantara.id, key: "governance", title: "Collect governance documents", order: 2, status: "NOT_STARTED" },
    { schoolId: globalNusantara.id, key: "pilot", title: "Define first onboarding scope", order: 3, status: "NOT_STARTED" },
    { schoolId: empathy.id, key: "profile", title: "Complete school profile", order: 1, status: "COMPLETE" },
    { schoolId: empathy.id, key: "governance", title: "Upload governance baseline", order: 2, status: "IN_PROGRESS" },
    { schoolId: empathy.id, key: "pilot", title: "Teacher testing pilot", order: 3, status: "IN_PROGRESS" }
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
  await prisma.schoolBundleAdoption.upsert({
    where: { schoolId_bundleId: { schoolId: pilot.id, bundleId: bundleMap["teacher-ai-companion-stack"].id } },
    update: { status: "RECOMMENDED", ownerId: pilotAdmin.id, notes: "Teacher-facing AI support bundle ready for review." },
    create: { schoolId: pilot.id, bundleId: bundleMap["teacher-ai-companion-stack"].id, status: "RECOMMENDED", ownerId: pilotAdmin.id, notes: "Teacher-facing AI support bundle ready for review." }
  });
  await prisma.schoolBundleAdoption.upsert({
    where: { schoolId_bundleId: { schoolId: scale.id, bundleId: bundleMap["leadership-ops-stack"].id } },
    update: { status: "PLANNING", ownerId: scaleAdmin.id, notes: "Operational efficiency bundle prepared for board discussion." },
    create: { schoolId: scale.id, bundleId: bundleMap["leadership-ops-stack"].id, status: "PLANNING", ownerId: scaleAdmin.id, notes: "Operational efficiency bundle prepared for board discussion." }
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
  await prisma.schoolBundleAdoption.upsert({
    where: { schoolId_bundleId: { schoolId: empathy.id, bundleId: bundleMap["guide-builder-starter"].id } },
    update: { status: "ACTIVE", ownerId: empathyAdmin.id, notes: "Teacher-facing pilot stack active for mentor testing." },
    create: { schoolId: empathy.id, bundleId: bundleMap["guide-builder-starter"].id, status: "ACTIVE", ownerId: empathyAdmin.id, notes: "Teacher-facing pilot stack active for mentor testing." }
  });
  await prisma.schoolPackAdoption.upsert({
    where: { schoolId_packId: { schoolId: empathy.id, packId: packMap["ai-enablement-pack"].id } },
    update: { status: "ACTIVE", ownerId: empathyAdmin.id, notes: "Teacher-facing AI testing with Guide Builder and prompt tools." },
    create: { schoolId: empathy.id, packId: packMap["ai-enablement-pack"].id, status: "ACTIVE", ownerId: empathyAdmin.id, notes: "Teacher-facing AI testing with Guide Builder and prompt tools." }
  });
  await prisma.schoolPackAdoption.upsert({
    where: { schoolId_packId: { schoolId: globalNusantara.id, packId: packMap["ai-enablement-pack"].id } },
    update: { status: "RECOMMENDED", ownerId: globalAdmin.id, notes: "Recommended first pillar for onboarding discussions." },
    create: { schoolId: globalNusantara.id, packId: packMap["ai-enablement-pack"].id, status: "RECOMMENDED", ownerId: globalAdmin.id, notes: "Recommended first pillar for onboarding discussions." }
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

  const empathyPhilosophy = await ensureGovernanceDocument({
    schoolId: empathy.id,
    createdById: empathyAdmin.id,
    title: "Empathy School Philosophy Notes",
    category: "SCHOOL_PHILOSOPHY",
    summary: "Teacher-facing philosophy notes for the Empathy pilot shell.",
    description: "Light philosophy note for seeded teacher testing",
    body: `Empathy School Bali is being framed in Centum as a teacher-first pilot environment. The goal is not to replace the school's educational philosophy, but to support staff with clearer tools, calmer workflows, and safer prompt-building support while preserving human judgement.`
  });

  const gnsOnboardingDoc = await ensureGovernanceDocument({
    schoolId: globalNusantara.id,
    createdById: globalAdmin.id,
    title: "Global Nusantara Onboarding Notes",
    category: "TRANSFORMATION_NOTES",
    summary: "Initial onboarding note for the real school shell.",
    description: "Seeded onboarding note",
    body: `This shell has been created for Global Nusantara School as a real onboarding record. Current public information has been added as a starting point, but enrollment, leadership contacts, governance uploads, and the exact first rollout scope still need confirmation during discovery.`
  });

  await ensureGovernanceQuery({
    schoolId: empathy.id,
    userId: empathyJustin.id,
    question: "What is the purpose of this Empathy pilot shell?",
    answer: "The seeded philosophy note explains that the Empathy shell is intended as a teacher-first pilot environment focused on tools, calmer workflows, and safer prompt-building support without replacing the school's educational philosophy.",
    document: empathyPhilosophy
  });
  await ensureGovernanceQuery({
    schoolId: globalNusantara.id,
    userId: globalAdmin.id,
    question: "What still needs confirmation for Global Nusantara onboarding?",
    answer: "The onboarding note says that enrollment, leadership contacts, governance uploads, and the first rollout scope still need confirmation during discovery.",
    document: gnsOnboardingDoc
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
    },
    {
      schoolId: pilot.id,
      slug: "resiliency-lesson-plan-note",
      title: "Resiliency Lesson Plans Launch Note",
      type: "WEEKLY_UPDATE_TEMPLATE",
      audience: "Parents and advisors",
      description: "Weekly update template for introducing resiliency lesson plans.",
      body: `This week we are introducing our resiliency lesson plans as part of the school's broader School 2.0 transition. These lessons support advisory, reflection, and student wellbeing without changing the school's core curriculum.`
    },
    {
      schoolId: pilot.id,
      slug: "gemini-access-explainer",
      title: "Gemini Access Explainer",
      type: "EXPLAINER",
      audience: "Parents and staff",
      description: "Short explainer for how governed Gemini access works.",
      body: `Gemini access is being introduced with leadership approval, staff training, and policy guardrails. This is governed access, not unrestricted AI use.`
    },
    {
      schoolId: empathy.id,
      slug: "empathy-teacher-pilot-note",
      title: "Empathy Teacher Pilot Note",
      type: "WEEKLY_UPDATE_TEMPLATE",
      audience: "Teachers and mentors",
      description: "Teacher-facing note explaining the Empathy pilot environment.",
      body: `This pilot shell is designed so Justin, Jesse, and Lily can test the Classroom Launchpad, Guide Builder, resiliency assets, and Project Finder AI without changing the existing school curriculum.`
    },
    {
      schoolId: globalNusantara.id,
      slug: "global-nusantara-onboarding-note",
      title: "Global Nusantara Onboarding Note",
      type: "EXPLAINER",
      audience: "Leadership and onboarding team",
      description: "Seed note for the real onboarding shell.",
      body: `Global Nusantara School has been added as a real onboarding shell inside Centum Stack. This record should remain separate from frozen investor-demo schools while discovery and profile confirmation proceed.`
    },
    {
      schoolId: pilot.id,
      slug: "gemini-access-explainer",
      title: "Gemini Access Explainer",
      type: "EXPLAINER",
      audience: "Parents and staff",
      description: "Short explainer for how governed Gemini access works.",
      body: `Gemini access is being introduced with leadership approval, staff training, and policy guardrails. This is governed access, not unrestricted AI use.`
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
  await prisma.trainingProgress.upsert({
    where: { userId_moduleId_version: { userId: pilotTeacher.id, moduleId: moduleMap["ai_prompt_design"].id, version: 1 } },
    update: { lessonsCompleted: 3 },
    create: { userId: pilotTeacher.id, moduleId: moduleMap["ai_prompt_design"].id, version: 1, lessonsCompleted: 3 }
  });
  await prisma.trainingCompletion.upsert({
    where: { userId_moduleId_version: { userId: pilotTeacher.id, moduleId: moduleMap["resiliency_lesson_plans"].id, version: 1 } },
    update: {},
    create: { userId: pilotTeacher.id, moduleId: moduleMap["resiliency_lesson_plans"].id, version: 1 }
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
    { kind: "TRAINING", title: "Assign AI Foundations", description: "Required before enabling broader AI usage." },
    { kind: "TRAINING", title: "Publish AI Prompt Craft Fundamentals", description: "Gives teachers and students a practical curriculum for better Gemini prompting." },
    { kind: "NEXT_ACTION", title: "Link Project Finder AI", description: "Adds a visible projects offer that leadership can package even before a full projects rollout." }
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
