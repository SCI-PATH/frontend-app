"use client";

import { useMemo } from "react";
import {
  Atom,
  CalendarDays,
  FlaskConical,
  Lightbulb,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

import {
  formatFactDateLabel,
  pickDailyFact,
} from "@/data/dailyFacts";
import { useUserStore } from "@/store/useUserStore";

import "./daily-fact.css";

export function DailyFactCard() {
  const userId = useUserStore((state) => state.userId);
  const grade = useUserStore((state) => state.grade) ?? 7;

  const today = useMemo(() => new Date(), []);
  const fact = useMemo(
    () => pickDailyFact({ userId, grade, date: today }),
    [grade, today, userId]
  );
  const dateLabel = useMemo(() => formatFactDateLabel(today), [today]);

  return (
    <section className="daily-fact-section space-y-5 sm:space-y-6">
      <div className="daily-fact-section__header mx-auto max-w-2xl text-center">
        <p className="daily-fact-section__eyebrow inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em]">
          <Sparkles className="size-4" aria-hidden />
          Brain snack
          <Sparkles className="size-4" aria-hidden />
        </p>
        <h2 className="daily-fact-section__title mt-2 text-2xl font-black tracking-tight sm:text-3xl">
          Did you know?
        </h2>
        <p className="mt-2 text-sm text-brand-text/55 sm:text-base">
          One weird, wonderful science fact — fresh every day.
        </p>
      </div>

      <article className="daily-fact-card overflow-hidden">
        <div className="daily-fact-card__inner px-6 py-8 sm:px-10 sm:py-10">
          <div className="daily-fact-card__wash" aria-hidden />
          <span className="daily-fact-card__confetti daily-fact-card__confetti--1" aria-hidden />
          <span className="daily-fact-card__confetti daily-fact-card__confetti--2" aria-hidden />
          <span className="daily-fact-card__confetti daily-fact-card__confetti--3" aria-hidden />
          <span className="daily-fact-card__confetti daily-fact-card__confetti--4" aria-hidden />
          <span className="daily-fact-card__confetti daily-fact-card__confetti--5" aria-hidden />
          <span className="daily-fact-card__star daily-fact-card__star--1" aria-hidden />
          <span className="daily-fact-card__star daily-fact-card__star--2" aria-hidden />
          <span className="daily-fact-card__star daily-fact-card__star--3" aria-hidden />
          <span className="daily-fact-card__star daily-fact-card__star--4" aria-hidden />
          <span className="daily-fact-card__sparkle daily-fact-card__sparkle--a" aria-hidden />
          <span className="daily-fact-card__sparkle daily-fact-card__sparkle--b" aria-hidden />
          <span className="daily-fact-card__sparkle daily-fact-card__sparkle--c" aria-hidden />
          <span className="daily-fact-card__speed-line daily-fact-card__speed-line--1" aria-hidden />
          <span className="daily-fact-card__speed-line daily-fact-card__speed-line--2" aria-hidden />

          <div
            className="pointer-events-none absolute -right-10 -top-14 size-52 rounded-full bg-brand-primary/22 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-14 left-0 size-48 rounded-full bg-brand-special/20 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute right-1/4 top-1/3 size-36 rounded-full bg-brand-secondary/18 blur-2xl"
            aria-hidden
          />

          <div className="daily-fact-float-icon daily-fact-float-icon--zap absolute left-[6%] top-[18%] hidden sm:flex">
            <Zap className="size-5" aria-hidden />
          </div>
          <div className="daily-fact-float-icon daily-fact-float-icon--flask absolute right-[7%] top-[22%] hidden sm:flex">
            <FlaskConical className="size-5" aria-hidden />
          </div>
          <div className="daily-fact-float-icon daily-fact-float-icon--star absolute bottom-[20%] right-[9%] hidden sm:flex">
            <Star className="size-5" aria-hidden />
          </div>

          <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
            <div className="daily-fact-rise-1 daily-fact-card__icon-wrap relative size-28">
              <span className="daily-fact-card__burst" aria-hidden />
              <div className="daily-fact-card__orbit" aria-hidden>
                <span className="daily-fact-card__orbit-dot flex size-7 items-center justify-center rounded-full bg-white text-brand-special shadow-md ring-2 ring-brand-special/20">
                  <Atom className="size-3.5" aria-hidden />
                </span>
              </div>

              <div className="daily-fact-card__icon relative mx-auto flex size-[5.25rem] items-center justify-center rounded-[1.75rem] text-white ring-4 ring-white/90">
                <Lightbulb className="size-10 drop-shadow-sm" aria-hidden />
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="daily-fact-rise-2 flex flex-wrap items-center justify-center gap-2">
                <p className="daily-fact-badge-label inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.12em]">
                  <Sparkles className="size-3.5 animate-pulse" aria-hidden />
                  Today&apos;s fact
                </p>
                <span className="daily-fact-badge-topic rounded-full px-3.5 py-1.5 text-xs font-bold">
                  Grade {fact.grade} · {fact.topic}
                </span>
              </div>

              <div className="daily-fact-rise-3 relative px-2">
                <span className="daily-fact-card__wow" aria-hidden>
                  wow!
                </span>
                <h3 className="daily-fact-card__headline text-2xl font-black tracking-tight sm:text-[1.75rem] sm:leading-tight">
                  {fact.headline}
                </h3>
              </div>

              <div className="daily-fact-rise-4 daily-fact-card__bubble mx-auto max-w-2xl">
                <p className="text-base leading-relaxed text-brand-text/80 sm:text-lg">
                  {fact.body}
                </p>
              </div>

              <p className="daily-fact-rise-5 inline-flex items-center justify-center gap-2 rounded-full border-2 border-dashed border-brand-primary/25 bg-white/95 px-4 py-2 text-sm font-semibold text-brand-text/60 shadow-sm">
                <CalendarDays
                  className="size-4 shrink-0 text-brand-accent"
                  aria-hidden
                />
                {dateLabel} · New fact tomorrow
              </p>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
