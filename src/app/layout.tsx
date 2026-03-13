import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centum Stack",
  description: "School 2.0 transition platform for leadership, governance, rollout, and measurable transformation."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
