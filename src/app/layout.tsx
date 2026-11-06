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
        <Suspense fallback={null}>{children}</Suspense><Toaster richColors /><footer style={{ textAlign: "center", padding: 12, color: "#667085" }}><a href="https://songhaifan.github.io/frankie-goal/" aria-label="About Frankie goal" style={{ display: "inline-flex", alignItems: "center", padding: "6px", color: "inherit",  }}><span aria-hidden="true" style={{ display: "block", width: 76, height: 26, backgroundColor: "currentColor", mask: "url(/frankie-signature.svg) center / contain no-repeat", WebkitMask: "url(/frankie-signature.svg) center / contain no-repeat" }} /></a></footer>
      </body>
    </html>
  );
}
