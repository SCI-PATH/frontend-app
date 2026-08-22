import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";

import { cn } from "@/lib/utils";

interface AssessmentShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
  className?: string;
  maxWidth?: "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
}

const maxWidthClass = {
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
} as const;

export function AssessmentShell({
  title,
  subtitle,
  children,
  backHref = "/assessment-engine-dev-hub",
  backLabel = "Assessment Engine Dev Hub",
  actions,
  className,
  maxWidth = "4xl",
}: AssessmentShellProps) {
  return (
    <div
      className={cn(
        "relative min-h-full flex-1 overflow-hidden bg-brand-background",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E820,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#70E00018,_transparent_40%),radial-gradient(ellipse_at_top_right,_#FF6B3514,_transparent_35%)]"
      />

      <div
        className={cn(
          "relative z-10 mx-auto w-full px-4 py-8 sm:px-6 sm:py-10",
          maxWidthClass[maxWidth]
        )}
      >
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            {backHref ? (
              <Link
                href={backHref}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-primary transition-colors hover:text-brand-special"
              >
                <ArrowLeft className="size-4" aria-hidden />
                {backLabel}
              </Link>
            ) : null}
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-primary/10 text-brand-primary">
                <FlaskConical className="size-5" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-brand-text sm:text-3xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-0.5 text-sm text-brand-text/65">{subtitle}</p>
                ) : null}
              </div>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
