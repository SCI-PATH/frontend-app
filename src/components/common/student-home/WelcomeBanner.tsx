"use client";

import { Sparkles, Zap } from "lucide-react";

import { StudentAvatar } from "@/components/common/StudentAvatar";
import { WelcomeBannerShell } from "@/components/common/WelcomeBannerShell";
import { useUserStore } from "@/store/useUserStore";
import type { TeacherClass } from "@/types";

export function WelcomeBanner({
  enrolledClass,
}: {
  enrolledClass?: TeacherClass | null;
}) {
  const user = useUserStore((s) => s.user);
  const firstName = (user?.name || "Alex").split(" ")[0];
  const grade = user?.grade || "Grade 7";

  return (
    <WelcomeBannerShell>
      <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
        <div className="welcome-rise-1 welcome-banner__avatar-wrap shrink-0">
          <div className="welcome-banner__halo" aria-hidden />
          <StudentAvatar
            size="lg"
            className="relative z-10 ring-2 ring-white/80 shadow-lg shadow-black/20"
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <p className="welcome-rise-2 welcome-banner__badge inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-md sm:justify-start">
            <Sparkles className="size-3.5 shrink-0 text-white" aria-hidden />
            {grade}
            {enrolledClass ? (
              <>
                <span className="font-semibold normal-case tracking-normal">
                  · {enrolledClass.class_name}
                </span>
                <span className="welcome-banner__code rounded-full px-2 py-0.5 font-mono text-[10px] font-bold normal-case tracking-wide">
                  {enrolledClass.class_code}
                </span>
              </>
            ) : (
              " · Grades 6–9 Science"
            )}
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
              {enrolledClass
                ? `You're in ${enrolledClass.class_name}. Explore lessons, games, and quizzes from your learning hub below.`
                : "Your science adventure starts here — join a class, then dive into lessons, games, and quizzes."}
            </span>
          </p>
        </div>
      </div>
    </WelcomeBannerShell>
  );
}
