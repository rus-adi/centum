import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium leading-5 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<Variant, string> = {
    primary: "bg-[linear-gradient(135deg,#2563eb_0%,#3b82f6_52%,#7c3aed_100%)] text-white shadow-[0_12px_30px_rgba(37,99,235,0.24)] hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(37,99,235,0.28)] active:translate-y-0",
    secondary: "border border-[var(--border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] text-gray-900 shadow-[0_8px_20px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:bg-[linear-gradient(180deg,#ffffff_0%,#eef4ff_100%)] hover:shadow-[0_14px_30px_rgba(37,99,235,0.12)] active:translate-y-0",
    ghost: "bg-transparent text-gray-700 hover:bg-blue-50 hover:text-blue-700",
    danger: "bg-[linear-gradient(135deg,#dc2626_0%,#ef4444_100%)] text-white shadow-[0_12px_26px_rgba(220,38,38,0.2)] hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(220,38,38,0.24)] active:translate-y-0"
  };
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
