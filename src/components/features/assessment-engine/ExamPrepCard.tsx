"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ExamPrepCard() {
  const [bktUpdate, setBktUpdate] = useState(false);

  return (
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-accent/25 bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-accent">
        Exam Preparation
      </p>
      <h2 className="text-lg font-semibold text-brand-text">Generate a Quiz</h2>
      <p className="text-base leading-snug text-brand-text/65">
        Custom test from chapters you choose.
      </p>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-brand-accent/15 px-2.5 py-0.5 text-sm font-semibold text-brand-accent">
          G7 Optics
        </span>
        <span className="rounded-full bg-brand-accent/15 px-2.5 py-0.5 text-sm font-semibold text-brand-accent">
          G7 Acids
        </span>
      </div>
      <label className="flex items-center gap-2 text-sm text-brand-text/70">
        <input
          type="checkbox"
          checked={bktUpdate}
          onChange={(event) => setBktUpdate(event.target.checked)}
          className="size-3.5 accent-brand-accent"
        />
        Instant BKT Mastery update
      </label>
      <Button
        asChild
        className="mt-auto w-full bg-brand-accent text-base text-white hover:bg-brand-accent/90"
      >
        <Link href="/assessment/custom-quiz">
          Configure &amp; Start
          <Flag className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}
