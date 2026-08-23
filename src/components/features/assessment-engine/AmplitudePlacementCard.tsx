"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Aptitude / Amplitude placement — slot 1 until initial-category exists. */
export function AmplitudePlacementCard() {
  return (
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-primary/20 bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-primary">
        Placement
      </p>
      <h2 className="text-lg font-semibold text-brand-text">
        Start aptitude test
      </h2>
      <p className="text-base leading-snug text-brand-text/65">
        A short survey and quiz so we can place you at the right starting level
        before you begin lessons.
      </p>
      <Button
        asChild
        className="mt-auto w-full bg-brand-primary text-base text-white hover:bg-brand-primary/90"
      >
        <Link href="/assessment/amplitude">
          Begin aptitude test
          <Sparkles className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}
