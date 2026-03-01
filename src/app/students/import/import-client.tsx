"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { parseCSV } from "@/lib/csv";
import { importStudentsCSV } from "@/app/actions/students";

const EXPECTED_HEADERS = ["studentCode", "name", "grade", "status", "coachName"];

export function ImportStudentsClient() {
  const [preview, setPreview] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);


  const headerOk = useMemo(() => {
    if (!preview) return true;
    const lower = preview.headers.map((h) => h.trim());
    return EXPECTED_HEADERS.some((h) => lower.includes(h));
  }, [preview]);

  return (
    <div className="space-y-4">
      <form action={importStudentsCSV} encType="multipart/form-data" className="space-y-4">
        <div>
          <input
            type="file"
            name="file"
            accept=".csv,text/csv"
            required
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const parsed = parseCSV(text);
              setPreview({ headers: parsed.headers, rows: parsed.rows.slice(0, 20) });

              const errs: string[] = [];
              parsed.rows.slice(0, 50).forEach((r, idx) => {
                const rowNum = idx + 2;
                const name = (r.name ?? "").trim();
                const grade = parseInt((r.grade ?? "").trim(), 10);
                if (!name) errs.push(`Row ${rowNum}: missing name`);
                if (!Number.isFinite(grade)) errs.push(`Row ${rowNum}: missing/invalid grade`);
              });
              setErrors(errs);
            }}
          />
          <div className="mt-2 text-xs text-gray-500">
            Tip: include <span className="font-mono">studentCode</span> for duplicate detection.
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Link href="/students">
            <Button type="button">Cancel</Button>
          </Link>
          <Button variant="primary" type="submit">
            Import to database
          </Button>
        </div>
      </form>

      {preview && (
        <div className="space-y-3">
          <div className="rounded-lg border border-[var(--border)] bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <div className="font-medium">Preview (first 20 rows)</div>
            <div className="mt-1 text-xs text-gray-600">
              Headers: <span className="font-mono">{preview.headers.join(", ") || "—"}</span>
            </div>
            {!headerOk && (
              <div className="mt-2 text-xs text-amber-700">
                Warning: CSV headers do not match expected format. Import may still work if your column names are compatible.
              </div>
            )}
            {errors.length > 0 && (
              <div className="mt-2 text-xs text-red-700">
                {errors.length} potential issue(s) detected in first 50 rows. The importer will skip invalid rows.
              </div>
            )}
          </div>

          <div className="overflow-auto rounded-lg border border-[var(--border)]">
            <table className="w-full text-sm">
              <thead className="bg-white">
                <tr className="text-gray-600">
                  {preview.headers.map((h) => (
                    <th key={h} className="border-b border-[var(--border)] px-3 py-2 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r, idx) => (
                  <tr key={idx}>
                    {preview.headers.map((h) => (
                      <td key={h} className="border-b border-[var(--border)] px-3 py-2 text-gray-700">
                        {(r[h] ?? "").toString()}
                      </td>
                    ))}
                  </tr>
                ))}
                {preview.rows.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-gray-500" colSpan={preview.headers.length || 1}>
                      No rows detected.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}