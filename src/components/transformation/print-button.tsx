"use client";

import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button
      type="button"
      variant="primary"
      onClick={() => {
        if (typeof window !== "undefined") window.print();
      }}
    >
      Print / Save PDF
    </Button>
  );
}
