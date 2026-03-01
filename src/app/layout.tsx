import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centum Partner Portal",
  description: "Centum Partner Portal"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
