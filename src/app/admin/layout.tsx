import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/onest";
import "../globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Atoll Yönetim", robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-dvh bg-stone antialiased">{children}</body>
    </html>
  );
}
