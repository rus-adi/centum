import clsx from "clsx";

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "min-h-[132px] w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-3 text-sm leading-6 text-gray-900 shadow-sm transition focus:border-blue-300 focus:outline-none focus:ring-4 focus:ring-blue-100 placeholder:text-gray-400",
        className
      )}
      {...props}
    />
  );
}
