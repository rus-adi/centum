import clsx from "clsx";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "h-11 w-full rounded-xl border border-[var(--border)] bg-white/95 px-3.5 text-sm text-gray-900 shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-[0_12px_24px_rgba(37,99,235,0.08)] focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-gray-400",
        className
      )}
      {...props}
    />
  );
}
