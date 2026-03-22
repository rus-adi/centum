import clsx from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "secondary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const base =
    "inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium leading-5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<Variant, string> = {
    primary: "bg-blue-600 text-white shadow-card hover:bg-blue-700 hover:shadow-[0_10px_24px_rgba(29,78,216,0.18)]",
    secondary: "border border-[var(--border)] bg-white text-gray-900 shadow-card hover:border-[var(--border-strong)] hover:bg-gray-50",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    danger: "bg-red-600 text-white shadow-card hover:bg-red-700 hover:shadow-[0_10px_24px_rgba(220,38,38,0.16)]"
  };
  return <button className={clsx(base, variants[variant], className)} {...props} />;
}
