"use client";

import { GraduationCap, Sparkles } from "lucide-react";

import { AppLogo } from "@/components/common/AppLogo";

import { useUserStore } from "@/store/useUserStore";

export function EducatorWelcomeBanner() {
  const user = useUserStore((state) => state.user);
  const firstName = (user?.name || "Teacher").split(" ")[0];
  const section = user?.sectionName;

  return (
    <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-special via-brand-primary to-brand-accent px-6 py-6 text-white sm:px-8 sm:py-7">
      <div
        className="pointer-events-none absolute -right-12 -top-16 size-52 rounded-full bg-white/15 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 size-40 rounded-full bg-brand-secondary/25 blur-3xl"
        aria-hidden
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="rounded-full bg-white p-1.5 ring-4 ring-white/40">
            <AppLogo size="xl" className="size-20 sm:size-24" priority />
          </div>
          <div className="space-y-1.5">
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
            {section ? (
              <p className="inline-flex items-center gap-2 text-base font-medium">
                <GraduationCap className="size-5" aria-hidden />
                {section}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
