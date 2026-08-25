"use client";

import Link from "next/link";
import { Compass, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AmplitudePlacementCard } from "./AmplitudePlacementCard";
import { usePlacementStatus } from "./store/usePlacementStatus";
import { useAssessmentUser } from "./store/useAssessmentUser";
import { useUserStore } from "@/store/useUserStore";

function CardSkeleton() {
  return (
    <article className="relative flex min-h-[20rem] flex-col overflow-hidden rounded-3xl border border-brand-primary/15 bg-gradient-to-br from-white to-brand-primary/8 p-7 shadow-sm">
      <div className="h-4 w-28 animate-pulse rounded bg-brand-surface" />
      <div className="mt-4 h-6 w-40 animate-pulse rounded bg-brand-surface" />
      <div className="mt-3 h-12 w-full animate-pulse rounded bg-brand-surface" />
      <div className="mt-auto flex h-11 items-center justify-center gap-2 text-sm text-brand-text/50">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Checking placement…
      </div>
    </article>
  );
}

function TakeCourseCard() {
  return (
    <article className="group relative flex min-h-[20rem] flex-col overflow-hidden rounded-3xl border border-brand-primary/15 bg-gradient-to-br from-white to-brand-primary/8 p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div
        className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-brand-primary/15 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-primary">
          Core Curriculum
        </p>
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-md shadow-brand-primary/25">
          <Compass className="size-6" aria-hidden />
        </span>
      </div>
      <h2 className="relative mt-3 text-lg font-semibold text-brand-text">
        Take a Course
      </h2>
      <p className="relative mt-2 text-base leading-snug text-brand-text/65">
        Guided lessons across Grades 6–9.
      </p>
      <div className="relative mt-4 space-y-1.5 rounded-2xl border border-brand-primary/10 bg-white/70 px-3.5 py-3">
        <div className="flex items-center justify-between text-sm font-medium text-brand-text/70">
          <span>Plant Diversity</span>
          <span className="font-semibold text-brand-primary">68%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-brand-surface">
          <div className="h-full w-[68%] rounded-full bg-brand-secondary" />
        </div>
      </div>
      <Button
        asChild
        className="relative mt-auto h-11 w-full rounded-2xl bg-brand-primary text-base text-white shadow-md shadow-brand-primary/20 hover:bg-brand-primary/90"
      >
        <Link href="/learning-path">
          Browse Pathways
          <Compass className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}

/**
 * Slot 1: aptitude test until placement exists, then Browse Pathways.
 */
export function PlacementCourseCard() {
  const { role, isAuthenticated } = useAssessmentUser();
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const placement = usePlacementStatus();

  if (!hasHydrated) {
    return <CardSkeleton />;
  }

  if (!isAuthenticated || role !== "student") {
    return <TakeCourseCard />;
  }

  if (placement.status !== "ready") {
    return <CardSkeleton />;
  }

  if (placement.needsAmplitude) {
    return <AmplitudePlacementCard />;
  }

  return <TakeCourseCard />;
}
