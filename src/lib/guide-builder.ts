import { GUIDE_OUTPUTS, GUIDE_SUBJECTS, type GuideExperience, type GuideRole } from "@/lib/guide-builder-catalog";

export type GuideBuilderInput = {
  role: GuideRole;
  experience: GuideExperience;
  subject: string;
  topic: string;
  output: string;
  ageBand: string;
  contextNotes?: string;
  askForHints?: boolean;
  askForStepByStep?: boolean;
  protectAcademicIntegrity?: boolean;
};

function clean(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function isValidSubject(value: string) {
  return GUIDE_SUBJECTS.includes(value as (typeof GUIDE_SUBJECTS)[number]);
}

export function isValidOutput(value: string) {
  return GUIDE_OUTPUTS.includes(value as (typeof GUIDE_OUTPUTS)[number]);
}

export function buildGuidePrompt(input: GuideBuilderInput) {
  const roleLead =
    input.role === "TEACHER"
      ? "You are helping a teacher prepare useful, age-appropriate learning support."
      : "You are helping a student use Gemini for learning support without bypassing real thinking.";

  const modeLead =
    input.experience === "SUBJECT_CHAT_STARTER"
      ? "Create a subject-chat starter the user can paste into Gemini to begin an ongoing conversation."
      : input.experience === "WALKTHROUGH"
        ? "Create an interactive walkthrough prompt that asks follow-up questions and helps the user improve their own prompting step by step."
        : "Create a one-off structured prompt the user can paste into Gemini immediately.";

  const outputLead = input.role === "TEACHER"
    ? `The output should help produce a ${input.output.toLowerCase()} for ${input.subject}.`
    : `The output should help the student with ${input.subject.toLowerCase()} while staying focused on ${input.output.toLowerCase()}.`;

  const safety = [
    input.protectAcademicIntegrity ? "Do not produce dishonest work, hidden plagiarism, or teacher-deception tactics." : null,
    input.askForHints ? "Prefer hints, checkpoints, and coaching over full answers where appropriate." : null,
    input.askForStepByStep ? "Use step-by-step structure and ask clarifying questions before jumping to an answer." : null
  ].filter(Boolean);

  const notes = clean(input.contextNotes || "");

  return [
    roleLead,
    modeLead,
    outputLead,
    `Subject: ${input.subject}`,
    `Age band: ${input.ageBand}`,
    `Topic or need: ${clean(input.topic)}`,
    notes ? `Extra context: ${notes}` : null,
    safety.length ? `Safety and quality rules: ${safety.join(" ")}` : null,
    input.role === "TEACHER"
      ? "Return something clear, classroom-ready, and easy to adapt."
      : "Return something supportive, motivating, and designed to help the student think rather than outsource the work."
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function makePromptFilename(input: GuideBuilderInput) {
  const base = `${input.subject}-${input.output}-${input.role}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base || "centum-guide-prompt"}.txt`;
}

export function geminiUrl() {
  return "https://gemini.google.com/app";
}
