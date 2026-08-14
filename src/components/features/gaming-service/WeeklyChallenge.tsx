"use client";

import Link from "next/link";
import { CalendarDays, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

export function WeeklyChallenge() {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-brand-special/20 bg-gradient-to-r from-brand-special/10 via-white to-brand-primary/10 px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-special/15 text-brand-special">
          <Zap className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
            Weekly challenge
          </p>
          <h2 className="text-lg font-semibold text-brand-text">
            Circuit Quest — 80% on 3 electricity items
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-brand-text/60">
            <CalendarDays className="size-4" aria-hidden />
            Ends Sunday · +200 XP
          </p>
        </div>
      </div>
      <Button
        asChild
        className="h-11 shrink-0 bg-brand-special text-base text-white hover:bg-brand-special/90"
      >
        <Link href="/assessment/session">Join challenge</Link>
      </Button>
    </section>
  );
}
