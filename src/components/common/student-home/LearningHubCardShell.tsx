import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type HubCardTone =
  | "primary"
  | "special"
  | "accent"
  | "secondary"
  | "gold";

const toneStyles: Record<
  HubCardTone,
  {
    border: string;
    gradient: string;
    glow: string;
    label: string;
    iconBg: string;
    iconShadow: string;
    dot: string;
  }
> = {
  primary: {
    border: "border-brand-primary/25",
    gradient:
      "bg-gradient-to-br from-brand-primary/14 via-white to-brand-primary/6",
    glow: "bg-brand-primary/20",
    label: "text-brand-primary",
    iconBg: "bg-gradient-to-br from-brand-primary to-brand-primary/80",
    iconShadow: "shadow-brand-primary/30",
    dot: "bg-brand-primary/25",
  },
  special: {
    border: "border-brand-special/25",
    gradient:
      "bg-gradient-to-br from-brand-special/14 via-white to-brand-special/6",
    glow: "bg-brand-special/20",
    label: "text-brand-special",
    iconBg: "bg-gradient-to-br from-brand-special to-brand-special/80",
    iconShadow: "shadow-brand-special/30",
    dot: "bg-brand-special/25",
  },
  accent: {
    border: "border-brand-accent/25",
    gradient:
      "bg-gradient-to-br from-brand-accent/14 via-white to-brand-accent/6",
    glow: "bg-brand-accent/20",
    label: "text-brand-accent",
    iconBg: "bg-gradient-to-br from-brand-accent to-brand-accent/80",
    iconShadow: "shadow-brand-accent/30",
    dot: "bg-brand-accent/25",
  },
  secondary: {
    border: "border-brand-secondary/30",
    gradient:
      "bg-gradient-to-br from-brand-secondary/18 via-white to-brand-secondary/8",
    glow: "bg-brand-secondary/25",
    label: "text-brand-text",
    iconBg: "bg-gradient-to-br from-brand-secondary to-brand-secondary/85",
    iconShadow: "shadow-brand-secondary/30",
    dot: "bg-brand-secondary/30",
  },
  gold: {
    border: "border-brand-gold/30",
    gradient:
      "bg-gradient-to-br from-brand-gold/20 via-white to-brand-gold/8",
    glow: "bg-brand-gold/25",
    label: "text-brand-gold",
    iconBg: "bg-gradient-to-br from-brand-gold to-brand-gold/80",
    iconShadow: "shadow-brand-gold/35",
    dot: "bg-brand-gold/30",
  },
};

type LearningHubCardShellProps = {
  tone: HubCardTone;
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
};

export function LearningHubCardShell({
  tone,
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
  footer,
  className,
}: LearningHubCardShellProps) {
  const styles = toneStyles[tone];

  return (
    <article
      className={cn(
        "group relative flex h-full min-h-[22rem] flex-col overflow-hidden rounded-[1.75rem] border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6",
        styles.border,
        styles.gradient,
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-12 size-32 rounded-full blur-2xl",
          styles.glow
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-6 size-20 rounded-full bg-white/50 blur-xl"
        aria-hidden
      />

      <div className="relative flex shrink-0 items-start justify-between gap-3">
        <p
          className={cn(
            "text-[11px] font-bold uppercase tracking-[0.14em]",
            styles.label
          )}
        >
          {eyebrow}
        </p>
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg",
            styles.iconBg,
            styles.iconShadow
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
      </div>

      <h2 className="relative mt-2 shrink-0 text-lg font-bold tracking-tight text-brand-text sm:text-xl">
        {title}
      </h2>
      <p className="relative mt-1 line-clamp-2 min-h-[2.5rem] shrink-0 text-sm leading-snug text-brand-text/65">
        {description}
      </p>

      <div className="relative mt-3 min-h-[7.25rem] flex-1">{children}</div>
      <div className="relative mt-3 shrink-0">{footer}</div>
    </article>
  );
}
