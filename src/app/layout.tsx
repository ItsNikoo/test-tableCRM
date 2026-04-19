import type {Metadata} from "next";
import "./globals.css";
import {Toaster} from "sonner";

export const metadata: Metadata = {
  title: "test-TableCRM",
  description: "Тестовое задание для tableCRM",
};

export default function RootLayout({children}: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html>
    <body>
    {children}
    <Toaster position="top-center" richColors/>
    </body>
    </html>
  )
}
