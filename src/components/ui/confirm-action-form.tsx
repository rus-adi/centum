"use client";

import * as React from "react";

export function ConfirmActionForm({
  action,
  confirmMessage,
  className,
  children
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      className={className}
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
