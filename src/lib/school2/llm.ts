import { normalizeText } from "@/lib/school2/helpers";

type GovernanceSource = {
  title: string;
  quote: string;
};

type CopilotInput = {
  schoolName: string;
  readinessScore: number;
  maturityScore: number;
  blockers: string[];
  nextActions: string[];
};

function openAIConfig() {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!apiKey) return null;
  return { apiKey, baseUrl, model };
}

async function callOpenAI(messages: Array<{ role: "system" | "user"; content: string }>) {
  const config = openAIConfig();
  if (!config) return null;

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages
    }),
    cache: "no-store"
  });

  if (!response.ok) return null;
  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : null;
}

export async function generateGovernanceAnswer(question: string, sources: GovernanceSource[]) {
  const quoted = sources
    .slice(0, 3)
    .map((source, index) => `${index + 1}. ${source.title}: "${source.quote}"`)
    .join("\n");

  const llm = await callOpenAI([
    {
      role: "system",
      content:
        "You are a retrieval-first school policy assistant. Only answer from the supplied excerpts. Quote carefully and say when evidence is limited."
    },
    {
      role: "user",
      content: `Question: ${question}\n\nSources:\n${quoted}\n\nWrite a short answer grounded in the sources.`
    }
  ]);

  if (llm) {
    return {
      answer: normalizeText(llm),
      usedFallback: false
    };
  }

  if (!sources.length) {
    return {
      answer:
        "I could not find a clear answer in the uploaded School 2.0 Governance & Support Center documents. Please review the relevant SOP or escalate to a school leader.",
      usedFallback: true
    };
  }

  const bullets = sources.slice(0, 2).map((source) => `• ${source.title}: “${source.quote}”`);
  return {
    answer: `Based on the uploaded documents, the strongest guidance I found is:\n${bullets.join("\n")}\n\nPlease confirm the final action with a school leader if this situation is high-risk or urgent.`,
    usedFallback: true
  };
}

export async function generateCopilotNarrative(input: CopilotInput) {
  const llm = await callOpenAI([
    {
      role: "system",
      content:
        "You are the Centum Stack Transformation Copilot. Create concise, leadership-ready summaries. Do not invent facts. Use the provided metrics only."
    },
    {
      role: "user",
      content: JSON.stringify(input)
    }
  ]);

  if (llm) return { summary: normalizeText(llm), usedFallback: false };

  return {
    summary: `${input.schoolName} currently has readiness ${input.readinessScore}/100 and maturity ${input.maturityScore}/100. The main blockers are ${input.blockers.length ? input.blockers.join(", ") : "limited evidence"}. The immediate next actions are ${input.nextActions.length ? input.nextActions.join(", ") : "to complete the next readiness gate"}.`,
    usedFallback: true
  };
}
