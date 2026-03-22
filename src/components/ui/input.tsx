import clsx from "clsx";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3.5 text-sm text-gray-900 shadow-sm transition focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-gray-400",
        className
      )}
      {...props}
    />
  );
}
