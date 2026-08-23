"use client";

import { Rocket, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";

import { buildGamingServiceLaunchUrl } from "./buildGamingServiceLaunchUrl";

export function GameArenaCard() {
  const userId = useUserStore((state) => state.userId);
  const fullName = useUserStore((state) => state.fullName);
  const grade = useUserStore((state) => state.grade);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);

  const handleLaunch = () => {
    if (!userId || !fullName) return;
    const url = buildGamingServiceLaunchUrl({
      studentId: userId,
      displayName: fullName,
      grade,
    });
    window.location.assign(url);
  };

  return (
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-special/20 bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
        Gamified Arena
      </p>
      <h2 className="text-lg font-semibold text-brand-text">SCI_PATH Farm</h2>
      <p className="text-base leading-snug text-brand-text/65">
        Adaptive farm game with science quizzes, shop, and frustration-aware
        support.
      </p>
      <p className="flex items-center gap-2 rounded-xl bg-brand-special/10 px-3 py-2 text-sm font-medium text-brand-special">
        <Trophy className="size-4 shrink-0" aria-hidden />
        Farm &amp; Unlock
        <span className="ml-auto text-sm font-semibold">Play</span>
      </p>
      <Button
        type="button"
        className="mt-auto w-full bg-brand-special text-base text-white hover:bg-brand-special/90"
        disabled={!isAuthenticated || !userId || !fullName}
        onClick={handleLaunch}
      >
        Launch Game Arena
        <Rocket className="size-4" aria-hidden />
      </Button>
      {!isAuthenticated ? (
        <p className="text-xs text-brand-text/55">Sign in to launch the farm.</p>
      ) : null}
    </article>
  );
}
