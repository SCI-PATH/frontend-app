"use client";

import { Beaker, Clock, Flame, Sparkles, Target } from "lucide-react";

import { cn } from "@/lib/utils";

const MISSIONS = [
  {
    icon: Target,
    title: "Continue your pathway",
    meta: "Lessons & progress from learning path",
    accent: "primary" as const,
  },
  {
    icon: Beaker,
    title: "Practice with a quiz",
    meta: "Adaptive checks from assessment",
    accent: "accent" as const,
  },
  {
    icon: Flame,
    title: "Keep your streak",
    meta: "Daily activity tracking",
    accent: "special" as const,
  },
];

const accentStyles = {
  primary: {
    tone: "bg-brand-primary",
    border: "border-brand-primary/15",
    card: "bg-gradient-to-br from-white to-brand-primary/8",
    glow: "bg-brand-primary/15",
  },
  accent: {
    tone: "bg-brand-accent",
    border: "border-brand-accent/15",
    card: "bg-gradient-to-br from-white to-brand-accent/8",
    glow: "bg-brand-accent/15",
  },
  special: {
    tone: "bg-brand-special",
    border: "border-brand-special/15",
    card: "bg-gradient-to-br from-white to-brand-special/8",
    glow: "bg-brand-special/15",
  },
} as const;

/** Placeholder missions until gaming / path engines expose real daily tasks. */
export function TodayMissions() {
  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5">
      {MISSIONS.map((mission) => {
        const Icon = mission.icon;
        const styles = accentStyles[mission.accent];
        return (
          <div
            key={mission.title}
            className={cn(
              "relative flex items-center gap-4 overflow-hidden rounded-3xl border px-5 py-5 shadow-sm",
              styles.border,
              styles.card
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute -right-6 -top-8 size-20 rounded-full blur-2xl",
                styles.glow
              )}
              aria-hidden
            />
            <span
              className={cn(
                "relative flex size-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md",
                styles.tone
              )}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="relative min-w-0 flex-1">
              <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-brand-surface/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-text/55">
                <Sparkles className="size-3" aria-hidden />
                Coming soon
              </span>
              <span className="block truncate text-base font-semibold text-brand-text">
                {mission.title}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-sm text-brand-text/55">
                <Clock className="size-3.5" aria-hidden />
                {mission.meta}
              </span>
            </span>
          </div>
        );
      })}
    </section>
  );
}
