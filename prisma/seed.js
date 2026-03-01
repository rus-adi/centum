/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function ensureSchool({
  name,
  city,
  stage,
  progress,
  profile
}) {
  const existing = await prisma.school.findFirst({ where: { name } });
  const data = {
    name,
    city,
    timezone: "Asia/Jakarta",
    transformationStage: stage,
    transformationProgress: progress,
    ...profile
  };

  if (existing) {
    return prisma.school.update({ where: { id: existing.id }, data });
  }
  return prisma.school.create({ data });
}

async function upsertTool(t) {
  return prisma.tool.upsert({
    where: { key: t.key },
    update: { name: t.name, description: t.description },
    create: t
  });
}

async function upsertKnowledge(a) {
  return prisma.knowledgeArticle.upsert({
    where: { slug: a.slug },
    update: {
      title: a.title,
      category: a.category,
      excerpt: a.excerpt,
      body: a.body,
      published: a.published
    },
    create: a
  });
}

async function upsertBundle(b) {
  return prisma.stackBundle.upsert({
    where: { key: b.key },
    update: {
      name: b.name,
      category: b.category,
      description: b.description,
      toolKeys: b.toolKeys
    },
    create: b
  });
}

async function upsertGate(schoolId, g) {
  return prisma.implementationGate.upsert({
    where: { schoolId_key: { schoolId, key: g.key } },
    update: {
      title: g.title,
      description: g.description,
      order: g.order,
      status: g.status,
      completedAt: g.status === "COMPLETE" ? g.completedAt || new Date() : null
    },
    create: {
      schoolId,
      key: g.key,
      title: g.title,
      description: g.description,
      order: g.order,
      status: g.status,
      completedAt: g.status === "COMPLETE" ? g.completedAt || new Date() : null
    }
  });
}

async function main() {
  // ---------------------------------------------------------------------------
  // Schools (demo)
  // ---------------------------------------------------------------------------
  const harapan = await ensureSchool({
    name: "SMA Demo Harapan",
    city: "Jakarta",
    stage: "PILOT",
    progress: 65,
    profile: {
      type: "PRIVATE",
      curriculum: "National + Cambridge (demo)",
      gradeBands: ["MIDDLE", "HIGH"],
      studentCount: 420,
      deviceModel: "ONE_TO_ONE",
      ecosystem: "GOOGLE",
      connectivity: "HIGH",
      constraints: "Keep national curriculum. No full LMS swap in year 1.",
      priorityOutcomes: ["Teacher AI readiness", "Student accountability", "Faster operations"]
    }
  });

  const bandung = await ensureSchool({
    name: "SMA Demo Bandung",
    city: "Bandung",
    stage: "SCALE",
    progress: 90,
    profile: {
      type: "PRIVATE",
      curriculum: "National (demo)",
      gradeBands: ["HIGH"],
      studentCount: 680,
      deviceModel: "ONE_TO_ONE",
      ecosystem: "GOOGLE",
      connectivity: "HIGH",
      constraints: "Minimize disruption to parents. Preserve exam prep.",
      priorityOutcomes: ["Higher scores", "Project-based learning", "Operational efficiency"]
    }
  });

  const nusantara = await ensureSchool({
    name: "SMP Demo Nusantara",
    city: "Bekasi",
    stage: "ONBOARDING",
    progress: 20,
    profile: {
      type: "PUBLIC",
      curriculum: "National (demo)",
      gradeBands: ["MIDDLE"],
      studentCount: 950,
      deviceModel: "SHARED",
      ecosystem: "MIXED",
      connectivity: "MEDIUM",
      constraints: "Shared devices; phased rollout by grade.",
      priorityOutcomes: ["Reduce teacher workload", "Improve student support"]
    }
  });

  // ---------------------------------------------------------------------------
  // Tools
  // ---------------------------------------------------------------------------
  const tools = [
    { key: "google_workspace", name: "Google Workspace", description: "Core apps (Docs, Drive, Gmail) + admin controls." },
    { key: "google_classroom", name: "Google Classroom", description: "Lightweight assignment workflow (optional)." },
    { key: "gemini_edu", name: "Gemini for Education", description: "AI assistant governed by school policies." },
    { key: "ai_study_companion", name: "AI Study Companion", description: "Guided practice, feedback, and study planning." },
    { key: "ai_project_agent", name: "AI Project Agent", description: "Supports project coaching and milestones." },
    { key: "zoom", name: "Zoom", description: "Video conferencing for parent calls + training." },
    { key: "notion", name: "Notion", description: "Staff playbooks + operational documentation." }
  ];
  for (const t of tools) await upsertTool(t);

  const allTools = await prisma.tool.findMany();

  async function ensureSchoolTools(schoolId) {
    for (const t of allTools) {
      await prisma.schoolTool.upsert({
        where: { schoolId_toolId: { schoolId, toolId: t.id } },
        update: {},
        create: {
          schoolId,
          toolId: t.id,
          enabled: t.key !== "ai_project_agent", // keep one tool disabled to show enable flow
          eligible: t.key === "ai_study_companion" ? "Grades 8–12" : "Grades 7–12"
        }
      });
    }
  }

  await ensureSchoolTools(harapan.id);
  await ensureSchoolTools(bandung.id);
  await ensureSchoolTools(nusantara.id);

  // ---------------------------------------------------------------------------
  // Training modules
  // ---------------------------------------------------------------------------
  const modules = [
    { key: "ai_foundations", title: "AI Classroom Foundations", description: "Run AI-integrated learning blocks safely and consistently.", totalLessons: 5 },
    { key: "academic_integrity", title: "Academic Integrity in the AI Era", description: "Ethics, assessments, and AI policy enforcement.", totalLessons: 5 },
    { key: "project_coaching", title: "Project Coaching System", description: "Coach-led execution that builds accountability.", totalLessons: 4 },
    { key: "google_admin", title: "Google Admin Basics", description: "Account provisioning, groups, and policies.", totalLessons: 4 }
  ];

  for (const m of modules) {
    await prisma.trainingModule.upsert({
      where: { key: m.key },
      update: { title: m.title, description: m.description, totalLessons: m.totalLessons },
      create: m
    });
  }

  // Bump integrity version to show "Update Required"
  const integrity = await prisma.trainingModule.findUnique({ where: { key: "academic_integrity" } });
  if (integrity && integrity.currentVersion < 2) {
    await prisma.trainingModule.update({ where: { id: integrity.id }, data: { currentVersion: 2 } });
  }

  const moduleMap = Object.fromEntries((await prisma.trainingModule.findMany()).map((m) => [m.key, m]));

  // ---------------------------------------------------------------------------
  // Tool requirements (Investor MVP: show gating / prerequisites)
  // ---------------------------------------------------------------------------
  const toolMap = Object.fromEntries(allTools.map((t) => [t.key, t]));

  const requirements = [
    { toolKey: "gemini_edu", moduleKey: "ai_foundations" },
    { toolKey: "gemini_edu", moduleKey: "academic_integrity" },
    { toolKey: "ai_study_companion", moduleKey: "ai_foundations" },
    { toolKey: "ai_project_agent", moduleKey: "project_coaching" },
    { toolKey: "google_workspace", moduleKey: "google_admin" }
  ];

  for (const r of requirements) {
    const tool = toolMap[r.toolKey];
    const module = moduleMap[r.moduleKey];
    if (!tool || !module) continue;

    await prisma.toolRequirement.upsert({
      where: { toolId_moduleId: { toolId: tool.id, moduleId: module.id } },
      update: {},
      create: { toolId: tool.id, moduleId: module.id }
    });
  }

  // ---------------------------------------------------------------------------
  // Users (password = "password")
  // ---------------------------------------------------------------------------
  const hash = await bcrypt.hash("password", 10);

  // SUPER_ADMIN (no schoolId)
  await prisma.user.upsert({
    where: { email: "hq@centum.id" },
    update: { name: "Centum HQ", role: "SUPER_ADMIN", active: true },
    create: { email: "hq@centum.id", name: "Centum HQ", role: "SUPER_ADMIN", active: true, password: hash }
  });

  async function ensureUser({ email, name, role, schoolId }) {
    return prisma.user.upsert({
      where: { email },
      update: { name, role, active: true, schoolId },
      create: { email, name, role, active: true, schoolId, password: hash }
    });
  }

  // Harapan
  const harapanAdmin = await ensureUser({ email: "admin.harapan@centum.id", name: "Harapan Admin", role: "ADMIN", schoolId: harapan.id });
  const harapanStaff = await ensureUser({ email: "staff.harapan@centum.id", name: "Harapan Staff", role: "STAFF", schoolId: harapan.id });
  const harapanIT = await ensureUser({ email: "it.harapan@centum.id", name: "Harapan IT", role: "IT", schoolId: harapan.id });

  // Bandung
  const bandungAdmin = await ensureUser({ email: "admin.bandung@centum.id", name: "Bandung Admin", role: "ADMIN", schoolId: bandung.id });
  const bandungStaff = await ensureUser({ email: "staff.bandung@centum.id", name: "Bandung Staff", role: "STAFF", schoolId: bandung.id });

  // Nusantara
  const nusantaraAdmin = await ensureUser({ email: "admin.nusantara@centum.id", name: "Nusantara Admin", role: "ADMIN", schoolId: nusantara.id });

  // Seed a completion for Harapan staff on old integrity version 1 (to demonstrate "update required")
  if (harapanStaff && moduleMap.academic_integrity) {
    await prisma.trainingCompletion.upsert({
      where: {
        userId_moduleId_version: { userId: harapanStaff.id, moduleId: moduleMap.academic_integrity.id, version: 1 }
      },
      update: {},
      create: { userId: harapanStaff.id, moduleId: moduleMap.academic_integrity.id, version: 1 }
    });
  }

  // Seed a completion for Bandung staff for AI foundations (current version)
  if (bandungStaff && moduleMap.ai_foundations) {
    await prisma.trainingCompletion.upsert({
      where: {
        userId_moduleId_version: { userId: bandungStaff.id, moduleId: moduleMap.ai_foundations.id, version: moduleMap.ai_foundations.currentVersion }
      },
      update: {},
      create: { userId: bandungStaff.id, moduleId: moduleMap.ai_foundations.id, version: moduleMap.ai_foundations.currentVersion }
    });
  }

  // ---------------------------------------------------------------------------
  // Implementation gates (Investor MVP)
  // ---------------------------------------------------------------------------
  const baseGates = [
    { key: "discovery", title: "Discovery & outcomes", description: "Collect school profile + non-negotiables + success metrics.", order: 1 },
    { key: "infra", title: "Infrastructure readiness", description: "Connectivity, devices, identity, and admin access confirmed.", order: 2 },
    { key: "accounts", title: "Account provisioning", description: "Staff + student accounts created and tested.", order: 3 },
    { key: "tools", title: "Tool stack configured", description: "Approved tools enabled; bundles documented; access workflow tested.", order: 4 },
    { key: "training", title: "Training completion", description: "Staff completes training modules required for tools and policy.", order: 5 },
    { key: "policy", title: "Policy + integrity", description: "AI policy & academic integrity process implemented.", order: 6 },
    { key: "pilot", title: "Pilot launch", description: "Pilot cohort running; feedback loop active.", order: 7 },
    { key: "scale", title: "Scale rollout", description: "Expand to more grades; measure outcomes and iterate.", order: 8 }
  ];

  const gateStatusBySchool = {
    [nusantara.id]: {
      discovery: "COMPLETE",
      infra: "IN_PROGRESS",
      accounts: "NOT_STARTED",
      tools: "NOT_STARTED",
      training: "NOT_STARTED",
      policy: "NOT_STARTED",
      pilot: "NOT_STARTED",
      scale: "NOT_STARTED"
    },
    [harapan.id]: {
      discovery: "COMPLETE",
      infra: "COMPLETE",
      accounts: "COMPLETE",
      tools: "IN_PROGRESS",
      training: "IN_PROGRESS",
      policy: "COMPLETE",
      pilot: "IN_PROGRESS",
      scale: "NOT_STARTED"
    },
    [bandung.id]: {
      discovery: "COMPLETE",
      infra: "COMPLETE",
      accounts: "COMPLETE",
      tools: "COMPLETE",
      training: "COMPLETE",
      policy: "COMPLETE",
      pilot: "COMPLETE",
      scale: "IN_PROGRESS"
    }
  };

  for (const school of [nusantara, harapan, bandung]) {
    for (const g of baseGates) {
      await upsertGate(school.id, {
        ...g,
        status: gateStatusBySchool[school.id][g.key]
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Knowledge base (Investor MVP)
  // ---------------------------------------------------------------------------
  const articles = [
    {
      slug: "onboarding-checklist",
      title: "Onboarding Checklist",
      category: "Implementation",
      excerpt: "A step-by-step checklist to get a school live in 30–60 days.",
      published: true,
      body: `Use this checklist to run a predictable rollout.\n\n1) Confirm decision-makers\n2) Inventory devices + connectivity\n3) Approve tool stack\n4) Provision accounts\n5) Train staff\n6) Launch pilot\n7) Scale + measure\n`
    },
    {
      slug: "google-workspace-setup",
      title: "Google Workspace Setup (School)",
      category: "Tools",
      excerpt: "Minimum recommended configuration for identity and security.",
      published: true,
      body: `Recommended steps:\n- Create OU structure (Students / Staff)\n- Enable 2FA for staff\n- Configure groups and aliases\n- Set Drive sharing policies\n- Create onboarding templates\n`
    },
    {
      slug: "ai-policy-starter",
      title: "AI Policy Starter (Academic Integrity)",
      category: "Policy",
      excerpt: "Template guidance for safe AI adoption in schools.",
      published: true,
      body: `Core sections:\n- Allowed vs not allowed\n- Assessment rules\n- Citation expectations\n- Teacher escalation process\n- Student privacy\n`
    },
    {
      slug: "pilot-cohort-design",
      title: "How to Design a Pilot Cohort",
      category: "Implementation",
      excerpt: "Pick the right grades, subjects, and teachers for a strong pilot.",
      published: true,
      body: `A good pilot is small enough to manage and big enough to learn:\n- 1–2 grade levels\n- 3–5 teachers\n- Weekly feedback loop\n- Clear success metrics\n`
    },
    {
      slug: "tool-access-workflow",
      title: "Tool Access Workflow",
      category: "Operations",
      excerpt: "How requests + approvals + audit trails should flow.",
      published: true,
      body: `Recommended workflow:\n1) Staff submits request\n2) Admin/IT reviews\n3) Approve/deny with notes\n4) Implement changes\n5) Notify requester\n`
    }
  ];

  for (const a of articles) await upsertKnowledge(a);

  // ---------------------------------------------------------------------------
  // Stacks / bundles (Investor MVP)
  // ---------------------------------------------------------------------------
  const bundles = [
    {
      key: "core-google",
      name: "Core Google Stack",
      category: "Foundation",
      description: "Baseline stack for identity, communication, and lightweight learning workflows.",
      toolKeys: ["google_workspace", "google_classroom"]
    },
    {
      key: "ai-starter",
      name: "AI Starter Stack",
      category: "AI",
      description: "AI tools with policy and training prerequisites for safe rollout.",
      toolKeys: ["gemini_edu", "ai_study_companion"]
    },
    {
      key: "projects-stack",
      name: "Project Coaching Stack",
      category: "Learning Model",
      description: "Tools and routines that support projects, milestones, and coaching.",
      toolKeys: ["ai_project_agent", "notion"]
    }
  ];

  for (const b of bundles) await upsertBundle(b);

  // ---------------------------------------------------------------------------
  // Students (demo)
  // ---------------------------------------------------------------------------
  async function ensureStudents(schoolId, prefix) {
    const count = await prisma.student.count({ where: { schoolId } });
    if (count > 0) return;

    const students = [
      { studentCode: `${prefix}-0001`, name: "Sophia Tan", grade: 8, status: "ACTIVE", coachName: "Dewi" },
      { studentCode: `${prefix}-0002`, name: "Alif Jaya", grade: 9, status: "ACTIVE", coachName: "Budi" },
      { studentCode: `${prefix}-0003`, name: "Nadine Putri", grade: 10, status: "PENDING", coachName: "Coach Dewi" },
      { studentCode: `${prefix}-0004`, name: "Faisal Halim", grade: 11, status: "PENDING", coachName: "Coach Budi" },
      { studentCode: `${prefix}-0005`, name: "Aditya Harsa", grade: 11, status: "DISABLED", coachName: null }
    ];

    for (const s of students) {
      await prisma.student.create({ data: { schoolId, ...s } });
    }
  }

  await ensureStudents(harapan.id, "HRP");
  await ensureStudents(bandung.id, "BDG");

  // ---------------------------------------------------------------------------
  // Requests + Tickets (demo)
  // ---------------------------------------------------------------------------
  async function ensureOpsData() {
    // Harapan requests
    const reqCount = await prisma.request.count({ where: { schoolId: harapan.id } });
    if (reqCount === 0) {
      const projectTool = await prisma.tool.findUnique({ where: { key: "ai_project_agent" } });
      const targetStudent = await prisma.student.findFirst({ where: { schoolId: harapan.id, studentCode: "HRP-0003" } });

      const r1 = await prisma.request.create({
        data: {
          schoolId: harapan.id,
          kind: "GENERAL",
          type: "New Student Provisioning",
          description: "Provision accounts for newly enrolled students.",
          status: "SUBMITTED",
          submittedById: harapanStaff.id
        }
      });
      await prisma.requestEvent.create({
        data: { requestId: r1.id, actorId: harapanStaff.id, type: "request.created", message: "Request submitted." }
      });

      // Tool enablement request
      const r2 = await prisma.request.create({
        data: {
          schoolId: harapan.id,
          kind: "TOOL_ENABLE",
          type: "Enable AI Project Agent",
          description: "Request enabling AI Project Agent for project-based learning.",
          status: "IN_PROGRESS",
          submittedById: harapanStaff.id,
          assignedToId: harapanIT.id,
          toolId: projectTool?.id ?? null,
          desiredSchoolToolEnabled: true
        }
      });
      await prisma.requestEvent.createMany({
        data: [
          { requestId: r2.id, actorId: harapanStaff.id, type: "request.created", message: "Tool enablement request submitted." },
          { requestId: r2.id, actorId: harapanIT.id, type: "request.assigned", message: "Assigned to IT." }
        ]
      });

      // Student tool access request
      const studyTool = await prisma.tool.findUnique({ where: { key: "ai_study_companion" } });
      const r3 = await prisma.request.create({
        data: {
          schoolId: harapan.id,
          kind: "STUDENT_TOOL_ACCESS",
          type: "Enable AI Study Companion for Nadine Putri",
          description: "Enable access for student HRP-0003.",
          status: "SUBMITTED",
          submittedById: harapanStaff.id,
          toolId: studyTool?.id ?? null,
          studentId: targetStudent?.id ?? null,
          desiredStudentToolEnabled: true
        }
      });
      await prisma.requestEvent.create({
        data: { requestId: r3.id, actorId: harapanStaff.id, type: "request.created", message: "Student tool access request submitted." }
      });
    }

    // Harapan tickets
    const ticketCount = await prisma.ticket.count({ where: { schoolId: harapan.id } });
    if (ticketCount === 0) {
      const t1 = await prisma.ticket.create({
        data: {
          schoolId: harapan.id,
          category: "Tool Access",
          subject: "Request AI Study Companion",
          description: "Please enable the tool for Grade 8 cohort.",
          submittedById: harapanStaff.id,
          assignedToId: harapanIT.id,
          status: "OPEN"
        }
      });
      await prisma.ticketEvent.createMany({
        data: [
          { ticketId: t1.id, actorId: harapanStaff.id, type: "ticket.created", message: "Ticket submitted." },
          { ticketId: t1.id, actorId: harapanIT.id, type: "ticket.assigned", message: "Assigned to IT." }
        ]
      });

      const t2 = await prisma.ticket.create({
        data: {
          schoolId: harapan.id,
          category: "Policy",
          subject: "Integrity clarification",
          description: "What changed in the updated policy for take-home work?",
          submittedById: harapanStaff.id,
          status: "IN_PROGRESS"
        }
      });
      await prisma.ticketEvent.create({
        data: { ticketId: t2.id, actorId: harapanStaff.id, type: "ticket.created", message: "Ticket submitted." }
      });
    }

    // Updates
    const updCount = await prisma.updatePost.count({ where: { schoolId: harapan.id } });
    if (updCount === 0) {
      await prisma.updatePost.createMany({
        data: [
          {
            schoolId: harapan.id,
            month: "February 2026",
            title: "Policy Refresh: Academic Integrity",
            body: "Updated academic integrity rules. Staff must re-complete the integrity training module.",
            requiresTraining: true,
            trainingModuleId: moduleMap.academic_integrity?.id ?? null,
            newTrainingVersion: moduleMap.academic_integrity?.currentVersion ?? null
          },
          {
            schoolId: harapan.id,
            month: "January 2026",
            title: "Gemini Integration Update",
            body: "Enhanced capabilities added for deeper AI support.",
            requiresTraining: false
          }
        ]
      });
    }
  }

  await ensureOpsData();

  console.log("✅ Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
