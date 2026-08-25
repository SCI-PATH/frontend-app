"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Aptitude / Amplitude placement — slot 1 until initial-category exists. */
export function AmplitudePlacementCard() {
  return (
    <article className="group relative flex min-h-[20rem] flex-col overflow-hidden rounded-3xl border border-brand-special/20 bg-gradient-to-br from-white to-brand-special/10 p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div
        className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-brand-special/20 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
          Placement
        </p>
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-special text-white shadow-md shadow-brand-special/25">
          <Sparkles className="size-6" aria-hidden />
        </span>
      </div>
      <h2 className="relative mt-3 text-lg font-semibold text-brand-text">
        Start aptitude test
      </h2>
      <p className="relative mt-2 flex-1 text-base leading-snug text-brand-text/65">
        A short survey and quiz so we can place you at the right starting level
        before you begin lessons.
      </p>
      <Button
        asChild
        className="relative mt-auto h-11 w-full rounded-2xl bg-brand-special text-base text-white shadow-md shadow-brand-special/20 hover:bg-brand-special/90"
      >
        <Link href="/assessment/amplitude">
          Begin aptitude test
          <Sparkles className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}
