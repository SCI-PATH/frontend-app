"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CurriculumHubCard() {
  return (
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-primary/20 bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-primary">
        Core Curriculum
      </p>
      <h2 className="text-lg font-semibold text-brand-text">Take a Course</h2>
      <p className="text-base leading-snug text-brand-text/65">
        Guided lessons across Grades 6–9.
      </p>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm font-medium text-brand-text/70">
          <span>Plant Diversity</span>
          <span>68%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-brand-surface">
          <div className="h-full w-[68%] rounded-full bg-brand-secondary" />
        </div>
      </div>
      <Button
        asChild
        className="mt-auto w-full bg-brand-primary text-base text-white hover:bg-brand-primary/90"
      >
        <Link href="/learning-path">
          Browse Pathways
          <Compass className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}
