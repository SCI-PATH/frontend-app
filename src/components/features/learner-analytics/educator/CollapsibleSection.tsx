"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { SectionInfoHint } from "@/components/features/learner-analytics/educator/SectionInfoHint";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type SectionAccent = "primary" | "special" | "danger" | "neutral";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  /** Show the description in a hover info icon beside the title. */
  descriptionAsHint?: boolean;
  badge?: string | number;
  defaultOpen?: boolean;
  accent?: SectionAccent;
  children: ReactNode;
}

const accentStyles: Record<
  SectionAccent,
  { border: string; header: string; badge: string }
> = {
  primary: {
    border: "border-brand-primary/20",
    header: "bg-brand-primary/5",
    badge: "bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10",
  },
  special: {
    border: "border-brand-special/25",
    header: "bg-brand-special/5",
    badge: "bg-brand-special/10 text-brand-special hover:bg-brand-special/10",
  },
  danger: {
    border: "border-red-200",
    header: "bg-red-50/80",
    badge: "bg-red-100 text-red-700 hover:bg-red-100",
  },
  neutral: {
    border: "border-brand-surface",
    header: "bg-brand-background/60",
    badge: "bg-brand-surface text-brand-text/70 hover:bg-brand-surface",
  },
};

export function CollapsibleSection({
  title,
  description,
  descriptionAsHint = false,
  badge,
  defaultOpen = true,
  accent = "neutral",
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const styles = accentStyles[accent];
  const toggle = () => setOpen((value) => !value);

  const chevron = open ? (
    <ChevronUp className="mt-0.5 size-5 shrink-0 text-brand-text/45" />
  ) : (
    <ChevronDown className="mt-0.5 size-5 shrink-0 text-brand-text/45" />
  );

  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-white shadow-sm",
        styles.border
      )}
    >
      {descriptionAsHint ? (
        <div
          className={cn(
            "relative flex w-full items-center gap-2 px-5 py-4 transition-colors hover:bg-brand-background/40 sm:px-6 sm:py-5",
            styles.header
          )}
        >
          <button
            type="button"
            className="absolute inset-0"
            onClick={toggle}
            aria-expanded={open}
            aria-label={`${open ? "Collapse" : "Expand"} ${title}`}
          />
          <h2 className="pointer-events-none text-lg font-semibold text-brand-text sm:text-xl">
            {title}
          </h2>
          {description ? (
            <span className="relative z-10">
              <SectionInfoHint text={description} />
            </span>
          ) : null}
          {badge !== undefined ? (
            <Badge className={cn("pointer-events-none", styles.badge)}>
              {badge}
            </Badge>
          ) : null}
          <span className="pointer-events-none ml-auto">{chevron}</span>
        </div>
      ) : (
        <button
          type="button"
          className={cn(
            "flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-brand-background/40 sm:px-6 sm:py-5",
            styles.header
          )}
          onClick={toggle}
          aria-expanded={open}
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-brand-text sm:text-xl">
                {title}
              </h2>
              {badge !== undefined ? (
                <Badge className={styles.badge}>{badge}</Badge>
              ) : null}
            </div>
            {description ? (
              <p className="max-w-3xl text-sm text-brand-text/65">{description}</p>
            ) : null}
          </div>
          {chevron}
        </button>
      )}

      {open ? (
        <div className="border-t border-brand-surface/80 px-5 py-5 sm:px-6 sm:py-6">
          {children}
        </div>
      ) : null}
    </section>
  );
}
