"use client";

import { Flag, Flame, Sparkles } from "lucide-react";

import { StudentAvatar } from "@/components/common/StudentAvatar";
import { Button } from "@/components/ui/button";
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
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-primary via-brand-special to-brand-accent px-6 py-7 text-white shadow-lg shadow-brand-primary/20 sm:px-8 sm:py-8">
      <div
        className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-white/20 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-1/4 size-44 rounded-full bg-brand-secondary/35 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/3 top-1/2 size-24 rounded-full bg-white/10 blur-xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5 sm:gap-7">
          <StudentAvatar size="hero" className="ring-2 ring-white/70 shadow-lg" />
          <div className="space-y-2">
            <p className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold uppercase tracking-wide backdrop-blur-sm">
              <Sparkles className="size-4 shrink-0" aria-hidden />
              {grade}
              {enrolledClass ? (
                <>
                  <span className="font-semibold normal-case tracking-normal">
                    · {enrolledClass.class_name}
                  </span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[11px] font-bold normal-case tracking-wide">
                    {enrolledClass.class_code}
                  </span>
                </>
              ) : (
                " · Grades 6–9 Science"
              )}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="max-w-xl text-base leading-snug text-white/90 sm:text-lg">
              {enrolledClass
                ? `You're enrolled in ${enrolledClass.class_name}. Pick up where you left off or explore a new skill.`
                : "Join your teacher's class with a class code, then dive into lessons and quizzes."}
            </p>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              <Flame className="size-4 text-brand-secondary" aria-hidden />
              <span>Streak &amp; next topic</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Soon
              </span>
            </p>
          </div>
        </div>
        <Button
          size="lg"
          className="h-12 shrink-0 rounded-2xl bg-white px-6 text-base font-semibold text-brand-primary shadow-md hover:bg-brand-background"
        >
          Resume Last Topic
          <Flag className="size-5" aria-hidden />
        </Button>
      </div>
    </section>
  );
}
