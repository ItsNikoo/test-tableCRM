import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Table CRM",
  description: "Next.js project with Tailwind CSS and shadcn/ui",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
