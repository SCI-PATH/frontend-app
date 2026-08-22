"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EDUCATOR_AT_RISK } from "@/lib/educator/theme";
import type { MatrixBandCounts } from "@/types/educator";

interface SummaryMetricsProps {
  bands: MatrixBandCounts;
}

function shareLabel(count: number, total: number) {
  if (total <= 0) return "No learner–skill data yet";
  const pct = Math.round((count / total) * 100);
  return `${pct}% of all learner–skill combinations in the grid`;
}

export function SummaryMetrics({ bands }: SummaryMetricsProps) {
  const cards = [
    {
      title: "Mastered",
      count: bands.mastered.toLocaleString(),
      share: shareLabel(bands.mastered, bands.total),
      description: "Estimated mastery at 80% or higher — ready to extend or review lightly.",
      className: "border-brand-secondary/35 bg-brand-secondary/10",
      countClassName: "text-brand-secondary",
    },
    {
      title: "Still learning",
      count: bands.learning.toLocaleString(),
      share: shareLabel(bands.learning, bands.total),
      description: "Estimated mastery between 50% and 79% — learners are progressing.",
      className: "border-brand-primary/30 bg-brand-primary/10",
      countClassName: "text-brand-primary",
    },
    {
      title: "Needs support",
      count: bands.atRisk.toLocaleString(),
      share: shareLabel(bands.atRisk, bands.total),
      description: "Estimated mastery below 50% — consider intervention for these combinations.",
      className: `${EDUCATOR_AT_RISK.metricBorder} ${EDUCATOR_AT_RISK.metricBg}`,
      countClassName: EDUCATOR_AT_RISK.textStrong,
    },
  ] as const;

  return (
    <section
      aria-label="Summary metrics"
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {cards.map((card) => (
        <Card key={card.title} className={card.className}>
          <CardHeader className="pb-2">
            <CardDescription className="text-brand-text/70">
              {card.title}
            </CardDescription>
            <CardTitle
              className={`text-3xl font-bold tracking-tight ${card.countClassName}`}
            >
              {card.count}
            </CardTitle>
            <p className="text-sm font-medium text-brand-text/60">{card.share}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-brand-text/65">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
