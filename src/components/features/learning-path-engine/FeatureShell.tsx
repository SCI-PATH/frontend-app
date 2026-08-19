"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import ClientShell from "./components/ClientShell.jsx";
import "./styles/lpe-globals.css";

/**
 * Feature shell: brand canvas + LPE client error boundary.
 * Route layouts stay light; domain chrome lives here.
 */
export default function FeatureShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "lpe-app min-h-full bg-brand-background text-brand-text",
        className,
      )}
    >
      <ClientShell>{children}</ClientShell>
    </div>
  );
}
