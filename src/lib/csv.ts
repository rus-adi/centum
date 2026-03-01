export type CSVRow = Record<string, string>;

function parseLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"' ) {
      // handle escaped quotes
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }

    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseCSV(text: string): { headers: string[]; rows: CSVRow[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = parseLine(lines[0]).map((h) => h.replace(/^"|"$/g, "").trim());

  const rows = lines.slice(1).map((line) => {
    const cells = parseLine(line).map((c) => c.replace(/^"|"$/g, ""));
    const row: CSVRow = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });

  return { headers, rows };
}
