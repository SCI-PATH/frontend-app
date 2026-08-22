"use client";

import Link from "next/link";
import { ChartColumnIncreasing } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MasteryProfileCard() {
  return (
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-secondary/30 bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-secondary">
        Mastery Profile
      </p>
      <h2 className="text-lg font-semibold text-brand-text">My Learner Profile</h2>
      <p className="text-base leading-snug text-brand-text/65">
        Track mastery and revision gaps.
      </p>
      <ul className="space-y-1 text-base text-brand-text/80">
        <li className="flex justify-between">
          <span>Overall Mastery</span>
          <span className="font-semibold">74%</span>
        </li>
        <li className="flex justify-between">
          <span>Mastered Topics</span>
          <span className="font-semibold">18 / 24</span>
        </li>
        <li className="font-medium text-brand-accent">Need Practice: Light &amp; Heat</li>
      </ul>
      <Button
        asChild
        className="mt-auto w-full bg-brand-secondary text-base text-brand-text hover:bg-brand-secondary/90"
      >
        <Link href="/dashboard">
          View Full Analytics
          <ChartColumnIncreasing className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}
