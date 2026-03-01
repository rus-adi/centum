import clsx from "clsx";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "h-10 w-full rounded-md border border-[var(--border)] bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200",
        className
      )}
      {...props}
    />
  );
}
