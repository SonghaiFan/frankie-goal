import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { Suspense } from "react";



export const metadata: Metadata = {
  title: "franklin-goal",
  description: "Break goals into actions and make time for them.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <Suspense fallback={null}>{children}</Suspense><Toaster richColors />
      </body>
    </html>
  );
}
