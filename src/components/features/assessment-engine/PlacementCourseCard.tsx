"use client";

import Link from "next/link";
import { Compass, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { usePlacementStatus } from "./store/usePlacementStatus";
import { useAssessmentUser } from "./store/useAssessmentUser";

function CardSkeleton() {
  return (
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-primary/20 bg-white p-7">
      <div className="h-4 w-28 animate-pulse rounded bg-brand-surface" />
      <div className="h-6 w-40 animate-pulse rounded bg-brand-surface" />
      <div className="h-12 w-full animate-pulse rounded bg-brand-surface" />
      <div className="mt-auto flex h-10 items-center justify-center gap-2 text-sm text-brand-text/50">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Checking placement…
      </div>
    </article>
  );
}

function AmplitudePlacementCard() {
  return (
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-special/25 bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
        Placement
      </p>
      <h2 className="text-lg font-semibold text-brand-text">
        Start Amplitude test
      </h2>
      <p className="text-base leading-snug text-brand-text/65">
        A short survey and quiz so we can place you at the right starting level
        before you begin lessons.
      </p>
      <Button
        asChild
        className="mt-auto w-full bg-brand-special text-base text-white hover:bg-brand-special/90"
      >
        <Link href="/assessment/amplitude">
          Begin placement
          <Sparkles className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}

function TakeCourseCard() {
  return (
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-primary/20 bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-primary">
        Core Curriculum
      </p>
      <h2 className="text-lg font-semibold text-brand-text">Take a Course</h2>
      <p className="text-base leading-snug text-brand-text/65">
        Guided lessons across Grades 6–9.
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm font-medium text-brand-text/70">
          <span>Plant Diversity</span>
          <span>68%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-brand-surface">
          <div className="h-full w-[68%] rounded-full bg-brand-secondary" />
        </div>
      </div>
      <Button
        asChild
        className="mt-auto w-full bg-brand-primary text-base text-white hover:bg-brand-primary/90"
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
 * Student home course slot: Amplitude placement until initial-category exists,
 * then the standard Take a Course card.
 */
export function PlacementCourseCard() {
  const { role } = useAssessmentUser();
  const placement = usePlacementStatus();

  if (role !== "student") {
    return null;
  }

  if (placement.status === "idle" || placement.status === "loading") {
    return <CardSkeleton />;
  }

  if (placement.needsAmplitude) {
    return <AmplitudePlacementCard />;
  }

  return <TakeCourseCard />;
}
