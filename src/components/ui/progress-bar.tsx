import clsx from "clsx";

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      {label ? <div className="mb-2 text-sm text-gray-600">{label}</div> : null}
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={clsx(
            "h-full rounded-full transition-all",
            safe >= 75 ? "bg-emerald-500" : safe >= 50 ? "bg-blue-500" : safe >= 30 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${safe}%` }}
        />
      </div>
      <div className="mt-2 text-sm font-medium text-gray-700">{safe}%</div>
    </div>
  );
}
