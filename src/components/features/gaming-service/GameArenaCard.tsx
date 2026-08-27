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
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-special/20 bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
        Gamified Arena
      </p>
      <h2 className="text-lg font-semibold text-brand-text">Discovery Grove</h2>
      <p className="text-base leading-snug text-brand-text/65">
        Adaptive farm adventure with science quizzes, shop, and frustration-aware
        support.
      </p>
      <p className="flex items-center gap-2 rounded-xl bg-brand-special/10 px-3 py-2 text-sm font-medium text-brand-special">
        <Trophy className="size-4 shrink-0" aria-hidden />
        {isReturning
          ? `Continue Level ${currentLevel}`
          : "Start at Level 1"}
        <span className="ml-auto text-sm font-semibold">
          {isReturning && progress?.highestCompletedLevel
            ? `L${progress.highestCompletedLevel} done`
            : "Play"}
        </span>
      </p>
      <Button
        type="button"
        className="mt-auto w-full bg-brand-special text-base text-white hover:bg-brand-special/90"
        disabled={!canLaunch}
        onClick={handleLaunch}
      >
        {isReturning ? "Continue Game Arena" : "Launch Game Arena"}
        <Rocket className="size-4" aria-hidden />
      </Button>
      {!isAuthenticated ? (
        <p className="text-xs text-brand-text/55">Sign in to launch the farm.</p>
      ) : null}
    </article>
  );
}
