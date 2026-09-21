"use client";

import Link from "next/link";
import { Sparkles, UserRound, Zap } from "lucide-react";

import { TeacherAvatar } from "@/components/common/TeacherAvatar";
import { WelcomeBannerShell } from "@/components/common/WelcomeBannerShell";
import { Button } from "@/components/ui/button";
import { EDUCATOR_PROFILE_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";

export function EducatorWelcomeBanner() {
  const user = useUserStore((state) => state.user);
  const firstName = (user?.name || "Teacher").split(" ")[0];
  const section = user?.sectionName;
  const grades = user?.gradesTaught ?? [];
  const gradeLabel =
    grades.length > 0
      ? grades.map((grade) => `Grade ${grade}`).join(" · ")
      : "Grades 6–9 Science";

  return (
    <WelcomeBannerShell>
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
        <div className="welcome-rise-1 welcome-banner__avatar-wrap shrink-0">
          <div className="welcome-banner__halo" aria-hidden />
          <TeacherAvatar
            size="lg"
            className="relative z-10 ring-2 ring-white/80 shadow-lg shadow-black/20"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="welcome-rise-2 welcome-banner__badge inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-md sm:justify-start">
            <Sparkles className="size-3.5 shrink-0 text-white" aria-hidden />
            Educator
            {section ? (
              <span className="font-semibold normal-case tracking-normal">
                · {section}
              </span>
            ) : null}
            <span className="welcome-banner__code rounded-full px-2 py-0.5 font-mono text-[10px] font-bold normal-case tracking-wide">
              {gradeLabel}
            </span>
          </p>

          <h1 className="welcome-rise-3 welcome-banner__title text-xl font-black tracking-tight drop-shadow-sm sm:text-2xl">
            Welcome back, {firstName}!
          </h1>

          <p className="welcome-rise-4 flex items-start justify-center gap-1.5 text-sm leading-snug text-white/95 sm:justify-start sm:text-[0.95rem]">
            <Zap
              className="mt-0.5 size-4 shrink-0 text-[#ccefff] drop-shadow"
              aria-hidden
            />
            <span>
              Guide your science classes, review mastery, and generate learning
              materials from one place.
            </span>
          </p>
        </div>

        <Button
          asChild
          size="sm"
          className="welcome-rise-2 h-9 shrink-0 rounded-full bg-white/95 px-4 text-brand-special shadow-sm hover:bg-white"
        >
          <Link href={EDUCATOR_PROFILE_PATH}>
            <UserRound className="size-4" aria-hidden />
            Edit profile
          </Link>
        </Button>
      </div>
    </WelcomeBannerShell>
  );
}
