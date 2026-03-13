export function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function toPlainArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  return [];
}

export function splitIntoChunks(input: string, options?: { maxLength?: number; overlap?: number }) {
  const maxLength = options?.maxLength ?? 520;
  const overlap = options?.overlap ?? 80;
  const text = normalizeText(input);
  if (!text) return [] as string[];

  const paragraphs = text
    .split(/\n{2,}|(?<=\.)\s+(?=[A-Z0-9])/)
    .map((part) => normalizeText(part))
    .filter(Boolean);

  const chunks: string[] = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    if ((buffer + " " + paragraph).trim().length <= maxLength) {
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

export function keywordScore(haystack: string, needle: string) {
  const source = normalizeText(haystack).toLowerCase();
  const terms = normalizeText(needle)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 2);

  if (!terms.length) return 0;

  let score = 0;
  for (const term of terms) {
    if (source.includes(term)) score += 8;
  }

  const ordered = terms.join(" ");
  if (ordered && source.includes(ordered)) score += 12;

  if (source.includes("suspend") && needle.toLowerCase().includes("suspend")) score += 4;
  if (source.includes("parent") && needle.toLowerCase().includes("parent")) score += 4;
  if (source.includes("incident") && needle.toLowerCase().includes("incident")) score += 4;
  return score;
}

export function percent(part: number, whole: number) {
  if (!whole) return 0;
  return Math.max(0, Math.min(100, Math.round((part / whole) * 100)));
}

export function safeJson<T>(value: unknown, fallback: T): T {
  return value == null ? fallback : (value as T);
}

export function uniqueStrings(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((item) => (item ?? "").trim()).filter(Boolean)));
}

export function stageWeight(stage?: string | null) {
  switch (stage) {
    case "SCALE":
      return 90;
    case "PILOT":
      return 70;
    case "FOUNDATION":
      return 50;
    default:
      return 25;
  }
}
