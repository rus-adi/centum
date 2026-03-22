import clsx from "clsx";

export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-white">
      <table className={clsx("min-w-full text-sm text-gray-700", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={clsx("bg-[var(--soft)] text-gray-600", className)} {...props} />;
}

export function TH({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        "whitespace-nowrap px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.14em] text-gray-500",
        className
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={clsx("border-t border-[var(--border)] px-4 py-3.5 align-top leading-6", className)} {...props} />;
}
