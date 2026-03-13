import { prisma } from "@/lib/prisma";
import { generateGovernanceAnswer } from "@/lib/school2/llm";
import { keywordScore, normalizeText, splitIntoChunks } from "@/lib/school2/helpers";

const db = prisma as any;

export const GOVERNANCE_CATEGORY_LABELS: Record<string, string> = {
  BEHAVIOR_POLICY: "Behavior policy",
  SAFEGUARDING: "Safeguarding",
  ACADEMIC_POLICY: "Academic policy",
  SCHOOL_PHILOSOPHY: "School philosophy",
  PARENT_COMMUNICATION: "Parent communication policy",
  INCIDENT_ESCALATION: "Incident escalation SOP",
  AI_USAGE_POLICY: "AI usage policy",
  CLASSROOM_OPERATIONS: "Classroom routines & operations",
  TRANSFORMATION_NOTES: "Transformation notes",
  OTHER: "Other"
};

export async function createGovernanceDocument(input: {
  schoolId: string;
  createdById?: string | null;
  title: string;
  category: string;
  summary?: string | null;
  description?: string | null;
  body: string;
  originalFilename?: string | null;
  mimeType?: string | null;
  storagePath?: string | null;
  notes?: string | null;
}) {
  const document = await db.governanceDocument.create({
    data: {
      schoolId: input.schoolId,
      title: input.title,
      category: input.category,
      summary: input.summary ?? null,
      description: input.description ?? null,
      createdById: input.createdById ?? null,
      pinned: false,
      status: "ACTIVE"
    }
  });

  const version = await createGovernanceVersion({
    documentId: document.id,
    uploadedById: input.createdById ?? null,
    body: input.body,
    originalFilename: input.originalFilename ?? null,
    mimeType: input.mimeType ?? null,
    storagePath: input.storagePath ?? null,
    notes: input.notes ?? null
  });

  return { document, version };
}

export async function createGovernanceVersion(input: {
  documentId: string;
  uploadedById?: string | null;
  body: string;
  originalFilename?: string | null;
  mimeType?: string | null;
  storagePath?: string | null;
  notes?: string | null;
}) {
  const latest = await db.governanceDocumentVersion.findFirst({
    where: { documentId: input.documentId },
    orderBy: { version: "desc" }
  });
  const versionNumber = (latest?.version ?? 0) + 1;

  const version = await db.governanceDocumentVersion.create({
    data: {
      documentId: input.documentId,
      version: versionNumber,
      uploadedById: input.uploadedById ?? null,
      body: input.body,
      originalFilename: input.originalFilename ?? null,
      mimeType: input.mimeType ?? null,
      storagePath: input.storagePath ?? null,
      notes: input.notes ?? null
    }
  });

  const chunks = splitIntoChunks(input.body);
  if (chunks.length) {
    await db.governanceChunk.createMany({
      data: chunks.map((content, index) => ({
        versionId: version.id,
        ordinal: index,
        content,
        keywordText: normalizeText(content).toLowerCase()
      }))
    });
  }

  return { ...version, chunkCount: chunks.length };
}

export async function retrieveGovernanceEvidence(input: {
  schoolId: string;
  question: string;
  limit?: number;
}) {
  const chunks = await db.governanceChunk.findMany({
    where: {
      version: {
        is: {
          document: {
            is: {
              schoolId: input.schoolId,
              status: { not: "ARCHIVED" }
            }
          }
        }
      }
    },
    include: {
      version: {
        include: {
          document: true
        }
      }
    },
    take: 500
  });

  const ranked = chunks
    .map((chunk: any) => ({
      chunk,
      score: keywordScore(`${chunk.content} ${chunk.version.document.title} ${chunk.version.document.summary ?? ""}`, input.question)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, input.limit ?? 5)
    .map((item) => item.chunk);

  return ranked;
}

export async function answerGovernanceQuestion(input: {
  schoolId: string;
  userId?: string | null;
  question: string;
}) {
  const evidence = await retrieveGovernanceEvidence({
    schoolId: input.schoolId,
    question: input.question,
    limit: 4
  });

  const sources = evidence.map((chunk: any) => ({
    title: chunk.version.document.title,
    quote: chunk.content
  }));

  const generated = await generateGovernanceAnswer(input.question, sources);
  const confidence = evidence.length === 0 ? 20 : evidence.length === 1 ? 55 : Math.min(92, 55 + evidence.length * 10);
  const lowConfidence = confidence < 60;

  const query = await db.governanceQuery.create({
    data: {
      schoolId: input.schoolId,
      userId: input.userId ?? null,
      question: input.question,
      answer: generated.answer,
      confidence,
      usedFallback: generated.usedFallback,
      lowConfidence,
      escalationRecommended: lowConfidence || /incident|harm|safeguard|violence|abuse/i.test(input.question)
    }
  });

  for (const chunk of evidence) {
    await db.governanceQuerySource.create({
      data: {
        queryId: query.id,
        documentId: chunk.version.document.id,
        versionId: chunk.version.id,
        chunkId: chunk.id,
        quote: chunk.content,
        relevance: 1
      }
    });
  }

  return {
    query,
    sources: evidence.map((chunk: any) => ({
      documentId: chunk.version.document.id,
      documentTitle: chunk.version.document.title,
      versionId: chunk.version.id,
      chunkId: chunk.id,
      quote: chunk.content,
      fileHref: `/api/governance-files/${chunk.version.id}`
    }))
  };
}
