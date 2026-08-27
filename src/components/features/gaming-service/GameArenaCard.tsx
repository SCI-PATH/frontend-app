"use client";

import { useEffect, useState } from "react";
import { Rocket, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";

import { buildGamingServiceLaunchUrl } from "./buildGamingServiceLaunchUrl";
import {
  fetchFarmProgress,
  type FarmProgressSnapshot,
} from "./fetchFarmProgress";
import { readGamingLaunchParams } from "./getGamingLaunchContext";

export function GameArenaCard() {
  const userId = useUserStore((state) => state.userId);
  const fullName = useUserStore((state) => state.fullName);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const [progress, setProgress] = useState<FarmProgressSnapshot | null>(null);

  useEffect(() => {
    if (!userId) {
      setProgress(null);
      return undefined;
    }
    let cancelled = false;
    void fetchFarmProgress(userId).then((snapshot) => {
      if (!cancelled) setProgress(snapshot);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const currentLevel = Math.max(1, Number(progress?.currentLevel) || 1);
  const isReturning = Boolean(progress?.isReturning);
  const canLaunch = Boolean(isAuthenticated && userId && fullName);

  const handleLaunch = () => {
    const params = readGamingLaunchParams();
    if (!params) return;
    window.location.assign(
      buildGamingServiceLaunchUrl({
        ...params,
        startLevel: currentLevel,
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
        Adaptive farm adventure with science quizzes, shop, and frustration-aware
        support.
      </p>
      <p className="relative mt-4 flex items-center gap-2 rounded-2xl border border-brand-special/15 bg-white/80 px-3.5 py-2.5 text-sm font-medium text-brand-special">
        <Trophy className="size-4 shrink-0" aria-hidden />
        {isReturning
          ? `Continue Level ${currentLevel}`
          : "Start at Level 1"}
        <span className="ml-auto rounded-full bg-brand-special/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
          {isReturning && progress?.highestCompletedLevel
            ? `L${progress.highestCompletedLevel} done`
            : "Play"}
        </span>
      </p>
      <Button
        type="button"
        className="relative mt-auto h-11 w-full rounded-2xl bg-brand-special text-base text-white shadow-md shadow-brand-special/20 hover:bg-brand-special/90"
        disabled={!canLaunch}
        onClick={handleLaunch}
      >
        {isReturning ? "Continue Game Arena" : "Launch Game Arena"}
        <Rocket className="size-4" aria-hidden />
      </Button>
      {!isAuthenticated ? (
        <p className="relative text-xs text-brand-text/55">
          Sign in to launch the farm.
        </p>
      ) : null}
    </article>
  );
}
