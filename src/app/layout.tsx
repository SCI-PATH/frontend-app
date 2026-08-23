import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SessionBootstrap } from "@/components/common/auth/SessionBootstrap";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SCI-PATH | Adaptive Science Learning for Grades 6–9",
  description:
    "SCI-PATH connects Socratic tutoring, Farm & Unlock gamification, adaptive learning paths, dynamic assessments, and BKT analytics for middle-school science.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="min-h-full flex flex-col font-sans"
        suppressHydrationWarning
      >
        <SessionBootstrap />
        {children}
      </body>
    </html>
  );
}
