"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gamepad2, Rocket, Sprout, Trophy } from "lucide-react";

import { LearningHubCardShell } from "@/components/common/student-home/LearningHubCardShell";
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
            : null
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
      })
    );
  };

  return (
    <LearningHubCardShell
      tone="special"
      eyebrow="Gamified arena"
      title="Discovery Grove"
      description="Unlock a farm per chapter. Beat it to advance."
      icon={Trophy}
      footer={
        gameAvailable ? (
          <Button
            type="button"
            className="h-11 w-full rounded-2xl bg-brand-special text-base font-semibold text-white shadow-md shadow-brand-special/25 hover:bg-brand-special/90"
            disabled={!canLaunch}
            onClick={handleLaunch}
          >
            Play level {pending?.levelId}
            <Rocket className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button
            asChild
            className="h-11 w-full rounded-2xl bg-brand-special text-base font-semibold text-white shadow-md shadow-brand-special/25 hover:bg-brand-special/90"
          >
            <Link href={STUDENT_LEARNING_PATH}>
              Open learning path
              <Rocket className="size-4" aria-hidden />
            </Link>
          </Button>
        )
      }
    >
      <div className="flex h-full items-center rounded-2xl border border-brand-special/15 bg-white/85 p-3.5 backdrop-blur-sm">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-special/10 text-brand-special">
            {gameAvailable ? (
              <Gamepad2 className="size-5" aria-hidden />
            ) : (
              <Sprout className="size-5" aria-hidden />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 text-sm font-semibold text-brand-text">
              {gameAvailable
                ? `Level ${pending?.levelId} · ${pending?.title}`
                : pathReady
                  ? "Next farm locked"
                  : "Checking path…"}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-brand-text/55">
              {gameAvailable
                ? pending?.rewardLabel
                  ? `Reward: ${pending.rewardLabel}`
                  : "Your chapter farm is ready."
                : pathReady
                  ? "Complete the next lesson to unlock its farm."
                  : !isAuthenticated
                    ? "Sign in to launch the farm."
                    : "Loading your progress…"}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-brand-special/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-special">
            {gameAvailable
              ? `L${pending?.levelId}`
              : progress?.highestCompletedLevel
                ? `L${progress.highestCompletedLevel}`
                : "—"}
          </span>
        </div>
      </div>
    </LearningHubCardShell>
  );
}
