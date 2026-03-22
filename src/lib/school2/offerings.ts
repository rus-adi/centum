export type OfferingGroup = "LESSON_PLAN" | "CURRICULUM" | "APP" | "SERVICE";
export type OfferingPillar = "AI_ENABLEMENT" | "INDIVIDUALIZED_LEARNING" | "PROJECTS" | "SEL";

export type FeaturedOffering = {
  key: string;
  title: string;
  description: string;
  href: string;
  cta?: string;
  badge: string;
  audience?: string;
  note?: string;
  iconKey: "shield" | "sparkles" | "compass" | "bot" | "mail" | "graduation" | "briefcase" | "building" | "care" | "users";
  group: OfferingGroup;
  pillar?: OfferingPillar;
};

function link(name: string, fallback: string) {
  const value = process.env[name];
  return value && value.trim().length ? value : fallback;
}

const placeholderNote = "Placeholder URL highlighted in yellow. Replace this when the final destination or subdomain is ready.";

export const featuredOfferings: FeaturedOffering[] = [
  {
    key: "resiliency_lesson_plans",
    title: "Resiliency Lesson Plans",
    description: "Three years of ready-to-link lesson plans for advisory, character, and resilience routines. This is the strongest lesson-plan destination to make nearly live first.",
    href: link("NEXT_PUBLIC_RESILIENCY_LESSON_PLANS_URL", "https://example.com/resiliency-lesson-plans"),
    cta: "Open lesson plans",
    badge: "Lesson plans",
    audience: "Teachers • Advisors • School leaders",
    note: placeholderNote,
    iconKey: "shield",
    group: "LESSON_PLAN",
    pillar: "SEL"
  },
  {
    key: "interactive_prompt_walkthrough",
    title: "Interactive Prompt Walkthrough",
    description: "A guided lesson-plan style walkthrough that teaches students how to build and improve prompts interactively with Gemini.",
    href: "/guide-builder?experience=walkthrough",
    cta: "Open walkthrough",
    badge: "Curriculum",
    audience: "Teachers • Students • Coaches",
    note: placeholderNote,
    iconKey: "graduation",
    group: "CURRICULUM",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "ai_prompt_curriculum",
    title: "AI Prompt Craft Curriculum",
    description: "A curriculum-agnostic pathway that teaches staff and students how to build strong prompts for research, drafting, planning, and reflection.",
    href: link("NEXT_PUBLIC_AI_PROMPT_CURRICULUM_URL", "https://example.com/ai-prompt-curriculum"),
    cta: "Open curriculum",
    badge: "Curriculum",
    audience: "Teachers • Students • Coaches",
    note: "Positioned as a practical prompt-building curriculum, not a replacement for the school’s existing academic program.",
    iconKey: "graduation",
    group: "CURRICULUM",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "project_launch_lesson_samples",
    title: "Project Launch Lesson Samples",
    description: "Sample lesson-plan starters that help teachers launch project work without waiting for a full project-based learning overhaul.",
    href: link("NEXT_PUBLIC_PROJECT_LAUNCH_LESSONS_URL", "https://example.com/project-launch-lesson-samples"),
    cta: "Open samples",
    badge: "Lesson plans",
    audience: "Teachers • Coaches",
    note: placeholderNote,
    iconKey: "compass",
    group: "LESSON_PLAN",
    pillar: "PROJECTS"
  },
  {
    key: "ai_reflection_lesson_samples",
    title: "AI Reflection Lesson Samples",
    description: "Sample classroom reflection and discussion lessons that help schools introduce AI literacy in a calmer, lower-risk way.",
    href: link("NEXT_PUBLIC_AI_REFLECTION_LESSONS_URL", "https://example.com/ai-reflection-lesson-samples"),
    cta: "Open samples",
    badge: "Lesson plans",
    audience: "Teachers • Students",
    note: placeholderNote,
    iconKey: "sparkles",
    group: "LESSON_PLAN",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "leadership_governance_assistant",
    title: "Leadership Governance Assistant",
    description: "A governance and decision-support app that helps leadership teams review policy, next steps, and controlled rollouts without turning into a black-box advisor.",
    href: link("NEXT_PUBLIC_LEADERSHIP_GOVERNANCE_APP_URL", "https://example.com/leadership-governance-assistant"),
    cta: "Open app",
    badge: "App",
    audience: "Leadership • Principals • Owners",
    note: placeholderNote,
    iconKey: "shield",
    group: "APP",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "office_admin_ai",
    title: "Office Admin AI",
    description: "An office operations assistant, powered by Clawbot, designed to cut repetitive school admin work and simplify routine processes.",
    href: link("NEXT_PUBLIC_OFFICE_ADMIN_AI_URL", "https://example.com/office-admin-ai"),
    cta: "Open app",
    badge: "App",
    audience: "Admin • Office team • IT",
    note: placeholderNote,
    iconKey: "building",
    group: "APP",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "hr_resume_rapid_review",
    title: "HR Rapid Review Bot",
    description: "An HR helper that screens resumes quickly so schools can move faster on staffing decisions without building a full HR department.",
    href: link("NEXT_PUBLIC_HR_RAPID_REVIEW_URL", "https://example.com/hr-rapid-review-bot"),
    cta: "Open app",
    badge: "App",
    audience: "Leadership • HR • Admin",
    note: placeholderNote,
    iconKey: "briefcase",
    group: "APP",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "project_finder_ai",
    title: "Project Finder AI",
    description: "A lightweight app that helps teachers, mentors, and learners discover project ideas, community partners, and project directions quickly.",
    href: link("NEXT_PUBLIC_PROJECT_FINDER_AI_URL", "https://example.com/project-finder-ai"),
    cta: "Open app",
    badge: "App",
    audience: "Teachers • Students • Coaches",
    note: placeholderNote,
    iconKey: "compass",
    group: "APP",
    pillar: "PROJECTS"
  },
  {
    key: "inquiry_forge",
    title: "Inquiry Forge",
    description: "A teacher tool that generates structured AI prompts, topic lists, and project plans to help students research history and social-studies topics with Gemini.",
    href: link("NEXT_PUBLIC_INQUIRY_FORGE_URL", "https://example.com/inquiry-forge"),
    cta: "Open app",
    badge: "App",
    audience: "Teachers • Students",
    note: placeholderNote,
    iconKey: "compass",
    group: "APP",
    pillar: "PROJECTS"
  },
  {
    key: "sentinel_guide_builder",
    title: "Sentinel Guide Builder",
    description: "Prompt and lesson support for teachers and students who need better Gemini prompts, study help, and safer AI scaffolding.",
    href: "/guide-builder",
    cta: "Open app",
    badge: "App",
    audience: "Teachers • Students • Coaches",
    note: "Implemented directly inside Centum Stack as the Centum Learning Guide Builder.",
    iconKey: "sparkles",
    group: "APP",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "gemini_buddy",
    title: "Gemini Buddy",
    description: "Prompt scaffolding for staff and students so they can generate stronger outputs in Gemini with less friction and less guesswork.",
    href: "/guide-builder?persona=student",
    cta: "Open app",
    badge: "App",
    audience: "Teachers • Students",
    note: "This can point to the same underlying prompt-building app while being packaged differently for different school conversations.",
    iconKey: "bot",
    group: "APP",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "prompt_buddy",
    title: "Prompt Buddy",
    description: "A general prompt-building assistant for classroom planning, assignments, project drafts, and internal staff workflows.",
    href: "/guide-builder?persona=teacher",
    cta: "Open app",
    badge: "App",
    audience: "Teachers • Coaches • Admin",
    note: "Presented as a flexible service add-on for schools that want fast wins in AI usage without a heavy rollout.",
    iconKey: "sparkles",
    group: "APP",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "teacher_prompt_companion",
    title: "Teacher Prompt Companion",
    description: "Teacher-facing framing of the same prompt-generation layer for lesson planning, resource drafting, and assessment support.",
    href: "/guide-builder?persona=teacher",
    cta: "Open app",
    badge: "App",
    audience: "Teachers",
    note: "Useful in demos when you want to position the same underlying tool as a premium teacher-support companion.",
    iconKey: "sparkles",
    group: "APP",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "resiliency_ai_for_kids",
    title: "Resiliency AI for Kids",
    description: "A child-friendly resiliency support app that extends the lesson-plan library into a more interactive student experience.",
    href: link("NEXT_PUBLIC_RESILIENCY_AI_FOR_KIDS_URL", "https://example.com/resiliency-ai-for-kids"),
    cta: "Open app",
    badge: "App",
    audience: "Students • Families • Counselors",
    note: placeholderNote,
    iconKey: "care",
    group: "APP",
    pillar: "SEL"
  },
  {
    key: "student_experience_preview",
    title: "Student Experience Preview",
    description: "A next-phase placeholder for a separate student-facing portal. Keep this framed as its own experience rather than part of the current leadership console.",
    href: link("NEXT_PUBLIC_STUDENT_PORTAL_PREVIEW_URL", "https://example.com/student-experience-preview"),
    cta: "Open preview",
    badge: "Next phase",
    audience: "Students • Families",
    note: "Separate student-facing portal planned as a standalone experience. Use this placeholder link while the student product is being built.",
    iconKey: "users",
    group: "APP",
    pillar: "INDIVIDUALIZED_LEARNING"
  },
  {
    key: "google_email_foundation",
    title: "Google Email & Identity",
    description: "Foundational Google email, account, and identity packaging for schools that need a clear baseline before broader digital rollout.",
    href: link("NEXT_PUBLIC_GOOGLE_EMAIL_FOUNDATION_URL", "https://example.com/google-email-foundation"),
    cta: "Open service",
    badge: "Service",
    audience: "Leadership • IT",
    note: "Can be sold or described as a clean foundational service even when it overlaps with broader Google Workspace setup.",
    iconKey: "mail",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "gemini_access",
    title: "Gemini Access",
    description: "Structured access to Gemini with training, policy, and staged enablement wrapped around it so leaders can approve it safely.",
    href: link("NEXT_PUBLIC_GEMINI_ACCESS_URL", "https://example.com/gemini-access"),
    cta: "Open service",
    badge: "Service",
    audience: "Leadership • Teachers • Students",
    note: "Best positioned as governed access rather than unrestricted AI use.",
    iconKey: "bot",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "centum_learning_guide_builder",
    title: "Centum Learning Guide Builder",
    description: "A built-in deterministic prompt-builder for teachers and students that creates Gemini-ready prompts, study supports, lesson scaffolds, and subject-chat starters.",
    href: "/guide-builder",
    cta: "Open builder",
    badge: "Built in",
    audience: "Teachers • Students • Mentors",
    note: "Implemented directly in this project with Teacher and Student modes plus a Prompt Maker alias route.",
    iconKey: "sparkles",
    group: "APP",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "leadership_desk",
    title: "Leadership Desk",
    description: "Leadership command surface for approvals, priorities, and coordinated next actions across the school transformation.",
    href: "/services/leadership-desk",
    cta: "Open details",
    badge: "Leadership module",
    audience: "Owners • Principals • Leadership",
    note: "Packaged from the Empathy leadership platform concept; useful as a leadership-first service layer.",
    iconKey: "shield",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "parent_communication_desk",
    title: "Parent Communication Desk",
    description: "Guides calm, transparent family communication with drafting support, protocol reminders, and reusable response structures.",
    href: "/services/parent-communication-desk",
    cta: "Open details",
    badge: "Leadership module",
    audience: "Leadership • Admin • Parent liaison",
    note: "Positioned as a family-trust and communication workflow module.",
    iconKey: "mail",
    group: "SERVICE",
    pillar: "SEL"
  },
  {
    key: "incident_escalation_hub",
    title: "Incident & Escalation Hub",
    description: "A coordination surface for documenting incidents, following escalation SOPs, and keeping leadership responses structured.",
    href: "/services/incident-escalation-hub",
    cta: "Open details",
    badge: "Leadership module",
    audience: "Leadership • Safeguarding • Admin",
    note: "Useful as a structured leadership workflow, not as an autonomous discipline system.",
    iconKey: "shield",
    group: "SERVICE",
    pillar: "SEL"
  },
  {
    key: "enrollment_retention_command",
    title: "Enrollment & Retention Command",
    description: "Tracks admissions follow-up, retention risks, and leadership interventions in one school-facing command view.",
    href: "/services/enrollment-retention-command",
    cta: "Open details",
    badge: "Leadership module",
    audience: "Leadership • Admissions • Growth",
    note: "Useful as a school growth and retention workflow without turning Centum into a CRM.",
    iconKey: "users",
    group: "SERVICE",
    pillar: "INDIVIDUALIZED_LEARNING"
  },
  {
    key: "staffing_coverage_planner",
    title: "Staffing & Coverage Planner",
    description: "Supports substitute planning, internal coverage, role handoff, and staffing continuity during operational changes.",
    href: "/services/staffing-coverage-planner",
    cta: "Open details",
    badge: "Leadership module",
    audience: "Leadership • HR • Admin",
    note: "Operational support module for schools that need continuity without a full ERP.",
    iconKey: "briefcase",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "leadership_meeting_os",
    title: "Leadership Meeting OS",
    description: "A reusable operating system for weekly leadership meetings, priorities, accountability, and follow-up.",
    href: "/services/leadership-meeting-os",
    cta: "Open details",
    badge: "Leadership module",
    audience: "Leadership • Owners",
    note: "Part of the Empathy-style leadership platform layer for consistent execution rhythm.",
    iconKey: "building",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "attendance_student_support_radar",
    title: "Attendance & Student Support Radar",
    description: "Helps track attendance concerns, support flags, and next-step ownership without replacing the school’s SIS.",
    href: "/services/attendance-student-support-radar",
    cta: "Open details",
    badge: "Leadership module",
    audience: "Leadership • Counselors • Support staff",
    note: "Useful for schools that need a support-facing operating layer rather than deep student analytics.",
    iconKey: "care",
    group: "SERVICE",
    pillar: "SEL"
  },
  {
    key: "owner_board_cockpit",
    title: "Owner / Board Cockpit",
    description: "Board-ready summaries for readiness, governance, blockers, adoption progress, and school transformation posture.",
    href: "/services/owner-board-cockpit",
    cta: "Open details",
    badge: "Leadership module",
    audience: "Owners • Board • Leadership",
    note: "Helps explain School 2.0 progress at the executive and investor level.",
    iconKey: "building",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "empathy_leadership_platform",
    title: "Empathy Leadership Platform",
    description: "A packaged leadership platform concept with shared SOP retrieval, shared dashboarding, and eight operational leadership modules.",
    href: "/services/empathy-leadership-platform",
    cta: "Open details",
    badge: "Platform package",
    audience: "Leadership • Principals • Owners",
    note: "Positioned as useful without AI first, then prompt-pack mode, then direct API mode later.",
    iconKey: "building",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "hr_dashboard_suite",
    title: "HR Dashboard Suite",
    description: "A packaged school HR toolkit covering recruiting, onboarding, records, retention, policy support, staffing, transitions, renewals, and analytics.",
    href: "/services/hr-dashboard-suite",
    cta: "Open details",
    badge: "Operations suite",
    audience: "Leadership • HR • Admin",
    note: "Represented in Centum Stack as a structured offering even when deployed separately later.",
    iconKey: "briefcase",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "resume_review_workspace",
    title: "Resume Review Workspace",
    description: "Role-based resume review and screening prompts for faster candidate triage.",
    href: "/services/resume-review-workspace",
    cta: "Open details",
    badge: "HR workspace",
    audience: "HR • Leadership",
    note: "One workspace inside the broader HR Dashboard Suite.",
    iconKey: "briefcase",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "hiring_onboarding_workspace",
    title: "Hiring & Onboarding Workspace",
    description: "Supports credentials, onboarding sequences, interview coordination, and hiring communications.",
    href: "/services/hiring-onboarding-workspace",
    cta: "Open details",
    badge: "HR workspace",
    audience: "HR • Leadership • Admin",
    note: "One workspace inside the broader HR Dashboard Suite.",
    iconKey: "briefcase",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "cases_performance_workspace",
    title: "Cases & Performance Workspace",
    description: "Structures case notes, candidate communication, references, and performance conversations.",
    href: "/services/cases-performance-workspace",
    cta: "Open details",
    badge: "HR workspace",
    audience: "HR • Leadership",
    note: "One workspace inside the broader HR Dashboard Suite.",
    iconKey: "briefcase",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "retention_policy_leave_workspace",
    title: "Retention, Policy & Leave Workspace",
    description: "Supports retention insights, internal mobility, policy support, and leave-case timelines.",
    href: "/services/retention-policy-leave-workspace",
    cta: "Open details",
    badge: "HR workspace",
    audience: "HR • Leadership",
    note: "One workspace inside the broader HR Dashboard Suite.",
    iconKey: "briefcase",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "offers_staffing_transition_workspace",
    title: "Offers, Staffing & Transition Workspace",
    description: "Handles offers, vacancy planning, training/compliance coordination, and offboarding support.",
    href: "/services/offers-staffing-transition-workspace",
    cta: "Open details",
    badge: "HR workspace",
    audience: "HR • Leadership • Admin",
    note: "One workspace inside the broader HR Dashboard Suite.",
    iconKey: "briefcase",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
  {
    key: "planning_renewal_analytics_workspace",
    title: "Planning, Renewals & Analytics Workspace",
    description: "Supports contract decisions, workforce scenarios, renewals, and recruiting analytics views.",
    href: "/services/planning-renewal-analytics-workspace",
    cta: "Open details",
    badge: "HR workspace",
    audience: "HR • Leadership • Board",
    note: "One workspace inside the broader HR Dashboard Suite.",
    iconKey: "briefcase",
    group: "SERVICE",
    pillar: "AI_ENABLEMENT"
  },
];

export function getFeaturedOfferings(filter?: { groups?: OfferingGroup[]; pillar?: OfferingPillar }) {
  return featuredOfferings.filter((offering) => {
    if (filter?.groups?.length && !filter.groups.includes(offering.group)) return false;
    if (filter?.pillar && offering.pillar !== filter.pillar) return false;
    return true;
  });
}

export function getAllOfferings(filter?: { groups?: OfferingGroup[]; pillar?: OfferingPillar }) {
  return featuredOfferings.filter((offering) => {
    if (filter?.groups?.length && !filter.groups.includes(offering.group)) return false;
    if (filter?.pillar && offering.pillar !== filter.pillar) return false;
    return true;
  });
}

export function getOfferingByKey(key: string) {
  return featuredOfferings.find((offering) => offering.key === key) ?? null;
}
