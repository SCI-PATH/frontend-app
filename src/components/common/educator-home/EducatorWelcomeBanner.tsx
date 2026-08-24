"use client";

import Link from "next/link";
import { GraduationCap, Sparkles, UserRound } from "lucide-react";

import { TeacherAvatar } from "@/components/common/TeacherAvatar";
import { Button } from "@/components/ui/button";
import { EDUCATOR_PROFILE_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";

export function EducatorWelcomeBanner() {
  const user = useUserStore((state) => state.user);
  const firstName = (user?.name || "Teacher").split(" ")[0];
  const section = user?.sectionName;
  const grades = user?.gradesTaught ?? [];

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-special via-brand-primary to-brand-accent px-6 py-7 text-white sm:px-8 sm:py-8">
      <div
        className="pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/20 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-10 left-1/4 size-44 rounded-full bg-brand-secondary/35 blur-3xl"
        aria-hidden
      />

      <Button
        asChild
        size="sm"
        className="absolute top-4 right-4 z-10 h-9 rounded-full bg-white/95 px-4 text-brand-special shadow-sm hover:bg-white"
      >
        <Link href={EDUCATOR_PROFILE_PATH}>
          <UserRound className="size-4" aria-hidden />
          Edit profile
        </Link>
      </Button>

      <div className="relative flex flex-col gap-6 pr-0 pt-10 sm:flex-row sm:items-center sm:gap-7 sm:pt-2 sm:pr-36">
        <TeacherAvatar size="hero" className="ring-2 ring-white/70" />
        <div className="min-w-0 space-y-2.5">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold uppercase tracking-wide">
            <Sparkles className="size-4" aria-hidden />
            Educator workspace
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome back, {firstName}
          </h1>
          <p className="max-w-xl text-base leading-snug text-white/90 sm:text-lg">
            Guide your science classes, review mastery, and generate learning
            materials from one place.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {section ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
                <GraduationCap className="size-4" aria-hidden />
                {section}
              </span>
            ) : null}
            {grades.map((grade) => (
              <span
                key={grade}
                className="rounded-full bg-brand-secondary/25 px-3 py-1 text-sm font-semibold text-white"
              >
                Grade {grade}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
