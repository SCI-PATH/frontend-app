"use client";

import { useState } from "react";
import { Compass, Lightbulb, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

const FACTS = [
  {
    title: "Lightning bolts are 5x hotter than the sun's surface!",
    related: "Static Electricity · Grade 7",
  },
  {
    title: "Your stomach lining renews itself every few days.",
    related: "Digestive System · Grade 8",
  },
  {
    title: "Plants exchange gases through tiny pores called stomata.",
    related: "Plant Diversity · Grade 7",
  },
];

export function DailyFactCard() {
  const [index, setIndex] = useState(0);
  const fact = FACTS[index];

  return (
    <article className="flex flex-col gap-3 overflow-hidden rounded-2xl border border-brand-accent/25 bg-gradient-to-r from-brand-accent/12 to-white px-7 py-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-brand-accent">
          <Lightbulb className="size-4" aria-hidden />
          Daily science fact
        </p>
        <h2 className="flex items-start gap-2 text-lg font-bold leading-snug text-brand-text">
          <Zap className="mt-0.5 size-5 shrink-0 text-brand-primary" aria-hidden />
          {fact.title}
        </h2>
        <p className="mt-1 text-sm text-brand-text/55">{fact.related}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 border-brand-accent/40 bg-white text-base text-brand-accent hover:bg-brand-accent/10"
          onClick={() => setIndex((i) => (i + 1) % FACTS.length)}
        >
          New fact
        </Button>
        <Button className="h-10 bg-brand-primary text-base text-white hover:bg-brand-primary/90">
          Explore
          <Compass className="size-4" aria-hidden />
        </Button>
      </div>
    </article>
  );
}
