"use client";

import { Atom, CalendarClock, Lightbulb, Sparkles } from "lucide-react";

export function DailyFactCard() {
  return (
    <article className="relative overflow-hidden rounded-[2rem] border-2 border-brand-accent/35 bg-gradient-to-br from-brand-accent/15 via-white to-brand-special/15 px-6 py-9 shadow-[0_20px_50px_-24px_rgba(255,107,53,0.55)] sm:px-10 sm:py-10">
      <div
        className="pointer-events-none absolute -right-10 -top-12 size-48 rounded-full bg-brand-accent/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-14 left-0 size-44 rounded-full bg-brand-special/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/3 top-1/3 size-28 rounded-full bg-brand-primary/15 blur-2xl"
        aria-hidden
      />

      {/* Floating Coming soon callout */}
      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <div className="relative">
          <span
            className="absolute inset-0 animate-ping rounded-full bg-brand-accent/40"
            aria-hidden
          />
          <span className="relative inline-flex items-center gap-1.5 rounded-full bg-brand-accent px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-brand-accent/40 sm:text-sm">
            <Sparkles className="size-3.5 animate-pulse" aria-hidden />
            Coming soon
          </span>
        </div>
      </div>

      <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:gap-8 sm:pr-36 sm:text-left">
        <div className="relative flex size-24 shrink-0 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-brand-accent via-[#FF8A5B] to-brand-special text-white shadow-xl shadow-brand-accent/40 ring-4 ring-white/80">
          <Lightbulb className="size-11" aria-hidden />
          <span className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full bg-white text-brand-accent shadow-md ring-2 ring-brand-accent/20">
            <Atom className="size-4" aria-hidden />
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-accent">
            Daily science fact
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
            A new curiosity drop every day
          </h2>
          <p className="mx-auto max-w-xl text-base leading-relaxed text-brand-text/70 sm:mx-0">
            We&apos;re building bite-sized science facts matched to your grade
            and current chapters. This strip will light up with a fresh fact —
            until then, this space is reserved for wonder.
          </p>
          <p className="inline-flex items-center justify-center gap-2 rounded-full border border-brand-accent/25 bg-white/80 px-4 py-2 text-sm font-semibold text-brand-accent shadow-sm sm:justify-start">
            <CalendarClock className="size-4" aria-hidden />
            Feature in progress · not live yet
          </p>
        </div>
      </div>

      <div className="relative mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { label: "Grade-aligned", hint: "Matched to 6–9 science" },
          { label: "Topic-aware", hint: "Follows your pathway" },
          { label: "One tap deeper", hint: "Jump into related skills" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-brand-accent/15 bg-white/85 px-4 py-3.5 text-left shadow-sm backdrop-blur-sm"
          >
            <p className="text-sm font-semibold text-brand-text">{item.label}</p>
            <p className="mt-0.5 text-xs text-brand-text/55">{item.hint}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
