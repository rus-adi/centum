"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";

export function QueryToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(true);

  const data = useMemo(() => {
    const success = params.get("success");
    const error = params.get("error");
    const info = params.get("info");
    return { success, error, info };
  }, [params]);

  const msg = data.error || data.success || data.info;
  const kind = data.error ? "error" : data.success ? "success" : data.info ? "info" : null;

  useEffect(() => {
    setOpen(true);
  }, [msg]);

  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setOpen(false), 5000);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg || !open || !kind) return null;

  const color =
    kind === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : kind === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-blue-200 bg-blue-50 text-blue-800";

  return (
    <div className={clsx("mb-4 rounded-lg border px-4 py-3 text-sm", color)}>
      <div className="flex items-start justify-between gap-4">
        <div className="whitespace-pre-wrap">{msg}</div>
        <button
          className="text-xs font-semibold opacity-70 hover:opacity-100"
          onClick={() => {
            setOpen(false);
            // Remove toast params from URL for cleanliness
            const url = new URL(window.location.href);
            url.searchParams.delete("success");
            url.searchParams.delete("error");
            url.searchParams.delete("info");
            router.replace(pathname + (url.search ? url.search : ""));
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}
