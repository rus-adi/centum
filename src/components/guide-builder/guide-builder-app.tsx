"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Copy, Download, RefreshCcw } from "lucide-react";
import { GUIDE_OUTPUTS, GUIDE_PRESETS, GUIDE_SUBJECTS } from "@/lib/guide-builder-catalog";
import { buildGuidePrompt, geminiUrl, makePromptFilename } from "@/lib/guide-builder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

type Role = "TEACHER" | "STUDENT";
type Experience = "ONE_OFF" | "SUBJECT_CHAT_STARTER" | "WALKTHROUGH";

export function GuideBuilderApp() {
  const search = useSearchParams();
  const searchPersona = search.get("persona")?.toUpperCase();
  const searchExperience = search.get("experience")?.toUpperCase();

  const [role, setRole] = useState<Role>(searchPersona === "STUDENT" ? "STUDENT" : "TEACHER");
  const [experience, setExperience] = useState<Experience>(
    searchExperience === "WALKTHROUGH" ? "WALKTHROUGH" : searchExperience === "SUBJECT_CHAT_STARTER" ? "SUBJECT_CHAT_STARTER" : "ONE_OFF"
  );
  const [subject, setSubject] = useState<string>("General Study Support");
  const [output, setOutput] = useState<string>("Study support");
  const [topic, setTopic] = useState<string>("");
  const [ageBand, setAgeBand] = useState<string>("13-18");
  const [contextNotes, setContextNotes] = useState<string>("");
  const [askForHints, setAskForHints] = useState<boolean>(true);
  const [askForStepByStep, setAskForStepByStep] = useState<boolean>(true);
  const [protectAcademicIntegrity, setProtectAcademicIntegrity] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const prompt = useMemo(
    () =>
      buildGuidePrompt({
        role,
        experience,
        subject,
        output,
        topic,
        ageBand,
        contextNotes,
        askForHints,
        askForStepByStep,
        protectAcademicIntegrity
      }),
    [role, experience, subject, output, topic, ageBand, contextNotes, askForHints, askForStepByStep, protectAcademicIntegrity]
  );

  async function copyPrompt() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  function downloadPrompt() {
    const blob = new Blob([prompt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = makePromptFilename({ role, experience, subject, output, topic, ageBand, contextNotes, askForHints, askForStepByStep, protectAcademicIntegrity });
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr,0.95fr]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Centum Learning Guide Builder</CardTitle>
              <Badge variant="info">Built in</Badge>
              <Badge variant="success">Teacher + Student modes</Badge>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              This is a deterministic prompt-generation layer, not a separate AI backend. It helps teachers and students create stronger Gemini-ready prompts, subject-chat starters, walkthrough prompts, and study supports.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Mode</label>
                <div className="flex gap-2">
                  <Button type="button" variant={role === "TEACHER" ? "primary" : "secondary"} onClick={() => setRole("TEACHER")}>Teacher</Button>
                  <Button type="button" variant={role === "STUDENT" ? "primary" : "secondary"} onClick={() => setRole("STUDENT")}>Student</Button>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Prompt experience</label>
                <Select value={experience} onChange={(e) => setExperience(e.target.value as Experience)}>
                  <option value="ONE_OFF">One-off prompt</option>
                  <option value="SUBJECT_CHAT_STARTER">Subject chat starter</option>
                  <option value="WALKTHROUGH">Interactive walkthrough</option>
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Subject</label>
                <Select value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {GUIDE_SUBJECTS.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Output goal</label>
                <Select value={output} onChange={(e) => setOutput(e.target.value)}>
                  {GUIDE_OUTPUTS.map((item) => <option key={item} value={item}>{item}</option>)}
                </Select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Age band</label>
                <Input value={ageBand} onChange={(e) => setAgeBand(e.target.value)} placeholder="13-18" />
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                {role === "TEACHER"
                  ? "Teacher mode emphasizes classroom-ready outputs like micro-lessons, examples, checkpoints, discussion guides, and presentation scaffolds."
                  : "Student mode emphasizes hints, coaching, get-unstuck support, reasoning checks, and safer study support without replacing real thinking."}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Topic / task / need</label>
              <Textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Describe the topic, need, or prompt goal here" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Extra context</label>
              <Textarea value={contextNotes} onChange={(e) => setContextNotes(e.target.value)} placeholder="Class context, constraints, tone, assessment notes, or special instructions" />
            </div>

            <div className="grid gap-2 md:grid-cols-3 text-sm text-gray-700">
              <label className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2"><input type="checkbox" checked={askForHints} onChange={(e) => setAskForHints(e.target.checked)} /> Prefer hints & coaching</label>
              <label className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2"><input type="checkbox" checked={askForStepByStep} onChange={(e) => setAskForStepByStep(e.target.checked)} /> Step-by-step structure</label>
              <label className="flex items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2"><input type="checkbox" checked={protectAcademicIntegrity} onChange={(e) => setProtectAcademicIntegrity(e.target.checked)} /> Protect integrity</label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick presets</CardTitle>
            <p className="mt-2 text-sm text-gray-600">Use these to demonstrate teacher and student workflows quickly during onboarding or investor walkthroughs.</p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {GUIDE_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.key}
                className="rounded-lg border border-[var(--border)] p-4 text-left hover:bg-gray-50"
                onClick={() => {
                  setRole(preset.role);
                  setExperience(preset.experience);
                  setSubject(preset.subject);
                  setTopic(preset.topic);
                  setOutput(preset.output);
                  setAgeBand(preset.ageBand);
                }}
              >
                <div className="font-medium text-gray-900">{preset.title}</div>
                <div className="mt-1 text-sm text-gray-600">{preset.subject} • {preset.role === "TEACHER" ? "Teacher" : "Student"}</div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>Generated Gemini-ready prompt</CardTitle>
            <Badge variant="warning">Deterministic</Badge>
          </div>
          <p className="mt-2 text-sm text-gray-600">Copy the prompt directly, open Gemini in a new tab, or download it as a text file for handoff or reuse.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-[var(--border)] bg-slate-50 p-4 text-sm leading-7 text-gray-800 whitespace-pre-wrap">{prompt || "Start filling the form to generate a prompt."}</div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" onClick={copyPrompt}>{copied ? "Copied" : "Copy prompt"}<Copy className="ml-2 h-4 w-4" /></Button>
            <Button type="button" variant="secondary" onClick={() => { copyPrompt(); window.open(geminiUrl(), "_blank", "noopener,noreferrer"); }}>Copy & open Gemini<ArrowUpRight className="ml-2 h-4 w-4" /></Button>
            <Button type="button" variant="secondary" onClick={downloadPrompt}>Download .txt<Download className="ml-2 h-4 w-4" /></Button>
            <Button type="button" variant="ghost" onClick={() => { setTopic(""); setContextNotes(""); setSubject("General Study Support"); setOutput("Study support"); setRole("TEACHER"); setExperience("ONE_OFF"); setAgeBand("13-18"); setAskForHints(true); setAskForStepByStep(true); setProtectAcademicIntegrity(true) }}>Reset<RefreshCcw className="ml-2 h-4 w-4" /></Button>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            Designed for users age 13+. The builder intentionally helps the user work with Gemini more effectively rather than acting as a direct-answer engine on its own.
          </div>
          <div className="rounded-lg border border-[var(--border)] p-4 text-sm text-gray-700">
            <div className="font-medium text-gray-900">What this demonstrates</div>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Teacher mode for lesson and classroom support</li>
              <li>Student mode for get-unstuck help and safer study support</li>
              <li>One-off prompts plus persistent subject-chat starters</li>
              <li>Walkthrough mode for interactive prompt teaching</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
