import clsx from "clsx";

type Variant = "success" | "warning" | "danger" | "info" | "neutral";

const styles: Record<Variant, string> = {
  success: "border-emerald-200 bg-emerald-50/90 text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  warning: "border-amber-200 bg-amber-50/90 text-amber-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  danger: "border-red-200 bg-red-50/90 text-red-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  info: "border-blue-200 bg-blue-50/90 text-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]",
  neutral: "border-slate-200 bg-slate-50/90 text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]"
};

export function Badge({ variant = "neutral", children }: { variant?: Variant; children: React.ReactNode }) {
  return (
    <span
      className={clsx(
        "inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-4 tracking-[0.01em]",
        styles[variant]
      )}
    >
      {children}
    </span>
  );
}
