export type GuideRole = "TEACHER" | "STUDENT";
export type GuideExperience = "ONE_OFF" | "SUBJECT_CHAT_STARTER" | "WALKTHROUGH";

export const GUIDE_SUBJECTS = [
  "General Study Support",
  "English",
  "History",
  "Social Studies",
  "Science",
  "Math",
  "Project Work",
  "SEL / Reflection"
] as const;

export const GUIDE_OUTPUTS = [
  "Micro-lesson",
  "Worked example",
  "Guided practice",
  "Checkpoint questions",
  "Discussion guide",
  "Presentation scaffold",
  "Research prompt",
  "Reflection prompt",
  "Study support"
] as const;

export const GUIDE_PRESETS = [
  {
    key: "history_presentation",
    title: "History presentation scaffold",
    subject: "History",
    role: "TEACHER" as const,
    topic: "Create a student presentation scaffold with inquiry questions, evidence prompts, and a speaking structure.",
    output: "Presentation scaffold",
    experience: "ONE_OFF" as const,
    ageBand: "13-16"
  },
  {
    key: "student_unstuck_math",
    title: "Student get-unstuck math prompt",
    subject: "Math",
    role: "STUDENT" as const,
    topic: "Help me get unstuck on a concept without giving me the full answer.",
    output: "Study support",
    experience: "SUBJECT_CHAT_STARTER" as const,
    ageBand: "13-18"
  },
  {
    key: "sel_reflection_teacher",
    title: "Teacher SEL reflection starter",
    subject: "SEL / Reflection",
    role: "TEACHER" as const,
    topic: "Create a structured reflection discussion on resilience, setbacks, and next actions.",
    output: "Reflection prompt",
    experience: "ONE_OFF" as const,
    ageBand: "10-18"
  },
  {
    key: "interactive_walkthrough",
    title: "Interactive prompt walkthrough",
    subject: "General Study Support",
    role: "STUDENT" as const,
    topic: "Walk me through building a better prompt step by step and ask me for missing details.",
    output: "Study support",
    experience: "WALKTHROUGH" as const,
    ageBand: "13-18"
  }
];
