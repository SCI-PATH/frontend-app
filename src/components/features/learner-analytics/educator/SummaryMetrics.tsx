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
  studentCount: number;
  topicCount: number;
  bands: MatrixBandCounts;
}

function pct(count: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((count / total) * 100)}%`;
}

export function SummaryMetrics({
  studentCount,
  topicCount,
  bands,
}: SummaryMetricsProps) {
  const cards = [
    {
      title: "Total Coverage",
      value: `${studentCount} Students × ${topicCount} Skills`,
      description: "Live learners and topics loaded from the analytics data store.",
      className: "border-brand-surface bg-white",
      valueClassName: "text-brand-primary",
    },
    {
      title: "Mastered Cells",
      value: `${bands.mastered.toLocaleString()} · ${pct(bands.mastered, bands.total)}`,
      description: "P(L) ≥ 80% across the mastery matrix.",
      className: "border-brand-secondary/35 bg-brand-secondary/10",
      valueClassName: "text-brand-secondary",
    },
    {
      title: "Learning Cells",
      value: `${bands.learning.toLocaleString()} · ${pct(bands.learning, bands.total)}`,
      description: "50% ≤ P(L) < 80% — learners still progressing.",
      className: "border-brand-primary/30 bg-brand-primary/10",
      valueClassName: "text-brand-primary",
    },
    {
      title: "At-Risk Cells",
      value: `${bands.atRisk.toLocaleString()} · ${pct(bands.atRisk, bands.total)}`,
      description: "P(L) < 50% — priority intervention candidates.",
      className: `${EDUCATOR_AT_RISK.metricBorder} ${EDUCATOR_AT_RISK.metricBg}`,
      valueClassName: EDUCATOR_AT_RISK.textStrong,
    },
  ] as const;

  return (
    <section
      aria-label="Summary metrics"
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
    >
      {cards.map((card) => (
        <Card key={card.title} className={card.className}>
          <CardHeader className="pb-2">
            <CardDescription className="text-brand-text/70">
              {card.title}
            </CardDescription>
            <CardTitle
              className={`text-xl font-bold tracking-tight ${card.valueClassName}`}
            >
              {card.value}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-brand-text/65">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
