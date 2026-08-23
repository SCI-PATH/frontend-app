"use client";

import { EDUCATOR_AT_RISK } from "@/lib/educator/theme";
import { cn } from "@/lib/utils";
import type { MatrixBandCounts } from "@/types/educator";

interface SummaryMetricsProps {
  bands: MatrixBandCounts;
}

function shareLabel(count: number, total: number) {
  if (total <= 0) return "No data yet";
  const pct = Math.round((count / total) * 100);
  return `${pct}% of skill cells`;
}

export function SummaryMetrics({ bands }: SummaryMetricsProps) {
  const cards = [
    {
      title: "Mastered",
      count: bands.mastered.toLocaleString(),
      meta: `${shareLabel(bands.mastered, bands.total)} · ≥ 80%`,
      accent: "border-l-brand-secondary bg-brand-secondary/[0.06]",
      countClass: "text-brand-secondary",
      ring: "ring-brand-secondary/20",
    },
    {
      title: "Still learning",
      count: bands.learning.toLocaleString(),
      meta: `${shareLabel(bands.learning, bands.total)} · 50–79%`,
      accent: "border-l-brand-primary bg-brand-primary/[0.06]",
      countClass: "text-brand-primary",
      ring: "ring-brand-primary/20",
    },
    {
      title: "Needs support",
      count: bands.atRisk.toLocaleString(),
      meta: `${shareLabel(bands.atRisk, bands.total)} · < 50%`,
      accent: `border-l-red-500 ${EDUCATOR_AT_RISK.metricBg}`,
      countClass: EDUCATOR_AT_RISK.textStrong,
      ring: "ring-red-200",
    },
  ] as const;

  return (
    <section
      aria-label="Summary metrics"
      className="grid gap-1.5 sm:grid-cols-3"
    >
      {cards.map((card) => (
        <div
          key={card.title}
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg border border-brand-surface border-l-[3px] px-2.5 py-1.5 ring-1",
            card.accent,
            card.ring
          )}
        >
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-brand-text/60">
              {card.title}
            </p>
            <p className="truncate text-[10px] text-brand-text/45">{card.meta}</p>
          </div>
          <p
            className={cn(
              "shrink-0 text-base font-bold tabular-nums leading-none",
              card.countClass
            )}
          >
            {card.count}
          </p>
        </div>
      ))}
    </section>
  );
}
