"use client";

import { Sparkles, Zap } from "lucide-react";

import { StudentAvatar } from "@/components/common/StudentAvatar";
import { useUserStore } from "@/store/useUserStore";
import type { TeacherClass } from "@/types";

import "./welcome-banner.css";

export function WelcomeBanner({
  enrolledClass,
}: {
  enrolledClass?: TeacherClass | null;
}) {
  const user = useUserStore((s) => s.user);
  const firstName = (user?.name || "Alex").split(" ")[0];
  const grade = user?.grade || "Grade 7";

  return (
    <section className="welcome-banner">
      <div className="welcome-banner__inner px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="welcome-banner__speed-line" aria-hidden />
        <div
          className="welcome-banner__speed-line welcome-banner__speed-line--delay"
          aria-hidden
        />
        <div className="welcome-banner__orb welcome-banner__orb--cyan" aria-hidden />
        <div className="welcome-banner__orb welcome-banner__orb--purple" aria-hidden />
        <div className="welcome-banner__orb welcome-banner__orb--pink" aria-hidden />
        <span className="welcome-banner__star welcome-banner__star--1" aria-hidden />
        <span className="welcome-banner__star welcome-banner__star--2" aria-hidden />
        <span className="welcome-banner__star welcome-banner__star--3" aria-hidden />
        <span className="welcome-banner__star welcome-banner__star--4" aria-hidden />
        <span className="welcome-banner__spark welcome-banner__spark--1" aria-hidden />
        <span className="welcome-banner__spark welcome-banner__spark--2" aria-hidden />

        <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 text-center sm:gap-6">
          <div className="welcome-rise-1 welcome-banner__avatar-wrap">
            <div className="welcome-banner__halo" aria-hidden />
            <StudentAvatar
              size="hero"
              className="relative z-10 ring-4 ring-white/80 shadow-2xl shadow-black/20"
            />
          </div>

          <div className="space-y-3">
            <p className="welcome-rise-2 welcome-banner__badge inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold uppercase tracking-wide backdrop-blur-md">
              <Sparkles className="size-4 shrink-0 text-white" aria-hidden />
              {grade}
              {enrolledClass ? (
                <>
                  <span className="font-semibold normal-case tracking-normal">
                    · {enrolledClass.class_name}
                  </span>
                  <span className="welcome-banner__code rounded-full px-2 py-0.5 font-mono text-[11px] font-bold normal-case tracking-wide">
                    {enrolledClass.class_code}
                  </span>
                </>
              ) : (
                " · Grades 6–9 Science"
              )}
            </p>

            <h1 className="welcome-rise-3 welcome-banner__title text-3xl font-black tracking-tight drop-shadow-sm sm:text-4xl lg:text-[2.85rem]">
              Welcome back, {firstName}!
            </h1>

            <p className="welcome-rise-4 mx-auto flex max-w-lg items-start justify-center gap-2 text-base leading-relaxed text-white/95 sm:text-lg">
              <Zap
                className="mt-1 size-5 shrink-0 text-[#ccefff] drop-shadow"
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
      </div>
    </section>
  );
}
