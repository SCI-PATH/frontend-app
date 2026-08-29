"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gamepad2, Rocket, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STUDENT_LEARNING_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";
import {
  getCurriculum,
  getProgress,
} from "@/components/features/learning-path-engine/api/client.js";

import { buildGamingServiceLaunchUrl } from "./buildGamingServiceLaunchUrl";
import {
  fetchFarmProgress,
  type FarmProgressSnapshot,
} from "./fetchFarmProgress";
import {
  buildChapterGameLaunchParams,
  readGamingLaunchParams,
} from "./getGamingLaunchContext";
import {
  findPendingChapterGame,
  type CurriculumLessonLike,
  type QuizByLesson,
} from "./chapterGameProgress";

export function GameArenaCard() {
  const userId = useUserStore((state) => state.userId);
  const fullName = useUserStore((state) => state.fullName);
  const grade = useUserStore((state) => state.grade);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [progress, setProgress] = useState<FarmProgressSnapshot | null>(null);
  const [pending, setPending] = useState<{
    title: string;
    levelId: number;
    lesson: CurriculumLessonLike;
    rewardLabel: string;
    lessons: CurriculumLessonLike[];
  } | null>(null);
  const [pathReady, setPathReady] = useState(false);

  useEffect(() => {
    if (!userId) {
      setProgress(null);
      setPending(null);
      setPathReady(false);
      return undefined;
    }
    let cancelled = false;
    void fetchFarmProgress(userId).then((snapshot) => {
      if (!cancelled) setProgress(snapshot);
    });
    Promise.all([getCurriculum(grade ?? 7), getProgress(userId)])
      .then(([curriculum, lpe]) => {
        if (cancelled) return;
        const lessons = (curriculum?.lessons || []) as CurriculumLessonLike[];
        const done = Array.isArray(lpe?.completed_lesson_ids)
          ? lpe.completed_lesson_ids.map(String)
          : [];
        const quizzes = (lpe?.quiz_by_lesson || {}) as QuizByLesson;
        const next = findPendingChapterGame(lessons, done, quizzes);
        setPending(
          next
            ? {
                title: next.title,
                levelId: next.levelId,
                lesson: next.lesson,
                rewardLabel: next.rewardLabel,
                lessons,
              }
            : null,
        );
        setPathReady(true);
      })
      .catch(() => {
        if (!cancelled) setPathReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, grade]);

  const canLaunch = Boolean(isAuthenticated && userId && fullName);
  const gameAvailable = Boolean(pending);

  const handleLaunch = () => {
    if (!pending) return;
    const params = buildChapterGameLaunchParams({
      lesson: pending.lesson,
      gradeLessons: pending.lessons,
      cash: progress?.cash ?? null,
    });
    if (params) {
      window.location.assign(buildGamingServiceLaunchUrl(params));
      return;
    }
    const fallback = readGamingLaunchParams();
    if (!fallback) return;
    window.location.assign(
      buildGamingServiceLaunchUrl({
        ...fallback,
        startLevel: pending.levelId,
        cash: progress?.cash ?? null,
      }),
    );
  };

  return (
    <article className="group relative flex min-h-[20rem] flex-col overflow-hidden rounded-3xl border border-brand-special/15 bg-gradient-to-br from-white to-brand-special/8 p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div
        className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-brand-special/15 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
          Gamified Arena
        </p>
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-special text-white shadow-md shadow-brand-special/25">
          <Trophy className="size-6" aria-hidden />
        </span>
      </div>
      <h2 className="relative mt-3 text-lg font-semibold text-brand-text">
        Discovery Grove
      </h2>
      <p className="relative mt-2 text-base leading-snug text-brand-text/65">
        Each chapter farm unlocks after you learn that chapter. Finish the farm
        to open the next chapter on your learning path.
      </p>
      <p className="relative mt-4 flex items-center gap-2 rounded-2xl border border-brand-special/15 bg-white/80 px-3.5 py-2.5 text-sm font-medium text-brand-special">
        {gameAvailable ? (
          <Gamepad2 className="size-4 shrink-0" aria-hidden />
        ) : (
          <Trophy className="size-4 shrink-0" aria-hidden />
        )}
        {gameAvailable
          ? `Level ${pending?.levelId} · ${pending?.title}`
          : pathReady
            ? "Learn the next chapter first"
            : "Checking your path…"}
        <span className="ml-auto rounded-full bg-brand-special/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
          {gameAvailable
            ? `L${pending?.levelId}`
            : progress?.highestCompletedLevel
              ? `L${progress.highestCompletedLevel} done`
              : "Path"}
        </span>
      </p>
      {gameAvailable && pending?.rewardLabel ? (
        <p className="relative mt-2 text-xs text-brand-text/55">
          Unlocked on this farm: {pending.rewardLabel}
        </p>
      ) : null}
      {gameAvailable ? (
        <Button
          type="button"
          className="relative mt-auto h-11 w-full rounded-2xl bg-brand-special text-base text-white shadow-md shadow-brand-special/20 hover:bg-brand-special/90"
          disabled={!canLaunch}
          onClick={handleLaunch}
        >
          Play Game Level {pending?.levelId}
          <Rocket className="size-4" aria-hidden />
        </Button>
      ) : (
        <Button
          asChild
          className="relative mt-auto h-11 w-full rounded-2xl bg-brand-special text-base text-white shadow-md shadow-brand-special/20 hover:bg-brand-special/90"
        >
          <Link href={STUDENT_LEARNING_PATH}>
            Open Learning Path
            <Rocket className="size-4" aria-hidden />
          </Link>
        </Button>
      )}
      {!isAuthenticated ? (
        <p className="relative text-xs text-brand-text/55">
          Sign in to launch the farm.
        </p>
      ) : !gameAvailable && pathReady ? (
        <p className="relative text-xs text-brand-text/55">
          Complete a chapter lesson, then return here for that chapter&apos;s
          farm.
        </p>
      ) : null}
    </article>
  );
}
