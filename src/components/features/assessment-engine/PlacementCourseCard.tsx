"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  getCurriculum,
  getProgress,
} from "@/components/features/learning-path-engine/api/client.js";
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

type PathwayStats = {
  label: string;
  detail: string;
  percent: number;
};

function TakeCourseCard() {
  const userId = useUserStore((s) => s.userId);
  const grade = useUserStore((s) => s.grade) ?? 7;
  const [stats, setStats] = useState<PathwayStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setStats(null);
      setLoadingStats(false);
      return;
    }

    let cancelled = false;
    setLoadingStats(true);

    Promise.all([getCurriculum(grade), getProgress(userId)])
      .then(([curriculum, progress]) => {
        if (cancelled) return;
        const lessons = Array.isArray(curriculum?.lessons) ? curriculum.lessons : [];
        const total = lessons.length;
        const completedIds = new Set(
          Array.isArray(progress?.completed_lesson_ids)
            ? progress.completed_lesson_ids.map(String)
            : []
        );
        const completedInGrade = lessons.filter(
          (lesson: { lesson_id?: string }) =>
            completedIds.has(String(lesson.lesson_id || ""))
        ).length;
        const percent =
          total > 0 ? Math.round((completedInGrade / total) * 100) : 0;

        const currentId = progress?.current_lesson_id
          ? String(progress.current_lesson_id)
          : "";
        const currentLesson = lessons.find(
          (lesson: {
            lesson_id?: string;
            display_title?: string;
            title?: string;
          }) => String(lesson.lesson_id || "") === currentId
        );
        const currentTitle =
          currentLesson?.display_title || currentLesson?.title || null;

        setStats({
          label:
            percent >= 100
              ? `Grade ${grade} complete`
              : currentTitle || `Grade ${grade} pathway`,
          detail:
            total > 0
              ? `${completedInGrade} of ${total} lessons done`
              : "No chapters loaded yet",
          percent,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setStats({
            label: `Grade ${grade} pathway`,
            detail: "Progress unavailable right now",
            percent: 0,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingStats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [grade, userId]);

  const percent = stats?.percent ?? 0;

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
      <div className="relative mt-4 space-y-2 rounded-2xl border border-brand-primary/10 bg-white/70 px-3.5 py-3.5">
        {loadingStats ? (
          <div className="space-y-2">
            <div className="h-4 w-2/3 animate-pulse rounded bg-brand-surface" />
            <div className="h-3 animate-pulse rounded-full bg-brand-surface" />
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 text-sm font-medium text-brand-text/70">
              <span className="min-w-0 flex-1 whitespace-normal break-words leading-snug">
                {stats?.label || `Grade ${grade} pathway`}
              </span>
              <span className="shrink-0 pt-0.5 font-semibold text-brand-primary">
                {percent}%
              </span>
            </div>
            <div
              className="h-3 w-full overflow-hidden rounded-full bg-brand-surface"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Lesson completion"
            >
              <div
                className="h-full rounded-full bg-brand-secondary transition-[width] duration-300"
                style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
              />
            </div>
            <p className="text-xs text-brand-text/50">
              {stats?.detail || "Open pathways to start learning"}
            </p>
          </>
        )}
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
