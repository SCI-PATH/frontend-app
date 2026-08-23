"use client";

import Image from "next/image";
import { Flag, Flame, Sparkles } from "lucide-react";

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
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-primary via-brand-special to-brand-accent px-6 py-6 text-white sm:px-8 sm:py-7">
      <div
        className="pointer-events-none absolute -right-12 -top-16 size-52 rounded-full bg-white/15 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 size-40 rounded-full bg-brand-secondary/30 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <Image
            src="/brand/sci-path-mascot.png"
            alt="SCI-PATH mascot"
            width={96}
            height={96}
            className="size-20 shrink-0 rounded-full object-cover ring-4 ring-white/40 sm:size-24"
            priority
          />
          <div className="space-y-1.5">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold uppercase tracking-wide">
              <Sparkles className="size-4" aria-hidden />
              {grade}
              {enrolledClass ? ` · ${enrolledClass.class_name}` : " · Grades 6–9 Science"}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, Explorer {firstName}!
            </h1>
            <p className="max-w-xl text-base leading-snug text-white/90 sm:text-lg">
              {enrolledClass
                ? `You're enrolled in ${enrolledClass.class_name}. Jump back into your science skills or check your learner profile.`
                : "Join your teacher's class with a class code, then jump into lessons and quizzes."}
            </p>
            <p className="inline-flex items-center gap-2 text-base font-medium">
              <Flame className="size-5 text-brand-secondary" aria-hidden />
              4-Day Streak · Next: Master Static Charges
            </p>
          </div>
        </div>
        <Button
          size="lg"
          className="h-12 shrink-0 rounded-2xl bg-white px-6 text-base text-brand-primary hover:bg-brand-background"
        >
          Resume Last Topic
          <Flag className="size-5" aria-hidden />
        </Button>
      </div>
    </section>
  );
}
