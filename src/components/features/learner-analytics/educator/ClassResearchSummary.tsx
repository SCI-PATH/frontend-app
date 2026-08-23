"use client";

import { Activity, AlertTriangle, Flame, Lightbulb } from "lucide-react";

import { getCurriculumTitle } from "@/lib/curriculum/topics";
import { getStudentDisplayName } from "@/lib/educator/students";
import { EDUCATOR_AT_RISK, EDUCATOR_PURPLE } from "@/lib/educator/theme";
import { compactTopicLabel } from "@/lib/educator/topicGrade";
import { cn } from "@/lib/utils";
import type {
  ClassSummaryResponse,
  ClassroomStudentMeta,
} from "@/types/educator";

interface ClassResearchSummaryProps {
  summary: ClassSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
  students: readonly ClassroomStudentMeta[];
  onSelectStudent?: (studentId: string) => void;
}

function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "N/A";
  return `${Math.round(value * 100)}%`;
}

export function ClassResearchSummary({
  summary,
  isLoading,
  error,
  students,
  onSelectStudent,
}: ClassResearchSummaryProps) {
  if (error && !summary) {
    return (
      <p className="text-xs text-brand-text/50">
        Class overview unavailable: {error}
      </p>
    );
  }

  if (isLoading && !summary) {
    return (
      <section
        aria-label="Classroom research summary"
        className="rounded-lg border border-brand-surface bg-white px-2.5 py-1.5 text-xs text-brand-text/60"
      >
        Loading class overview…
      </section>
    );
  }

  if (!summary) return null;

  const gapCount = summary.engagement_mastery_gap?.count ?? 0;
  const gapLearners = summary.engagement_mastery_gap?.learners ?? [];
  const frustrationAvg = summary.frustration?.class_average ?? null;
  const elevatedCount = summary.frustration?.elevated_count ?? 0;
  const hardest = summary.hardest_skills?.[0];
  const distractors = summary.top_distractors ?? [];
  const maxDistractorCount = Math.max(...distractors.map((row) => row.count), 1);

  const cards = [
    {
      title: "Participating but struggling",
      count: gapCount.toLocaleString(),
      meta:
        gapCount === 0
          ? "None right now"
          : `${gapCount} learner${gapCount === 1 ? "" : "s"} · chat high, quiz low`,
      accent: "border-l-brand-accent bg-brand-accent/[0.06]",
      countClass: "text-brand-accent",
      ring: "ring-brand-accent/20",
      icon: Activity,
    },
    {
      title: "Elevated frustration",
      count: elevatedCount.toLocaleString(),
      meta:
        elevatedCount === 0
          ? "None above alert level"
          : `${elevatedCount} learner${elevatedCount === 1 ? "" : "s"} seeming stuck`,
      accent: `border-l-red-500 ${EDUCATOR_AT_RISK.metricBg}`,
      countClass: EDUCATOR_AT_RISK.textStrong,
      ring: "ring-red-200",
      icon: Flame,
    },
    {
      title: "Class frustration",
      count: frustrationAvg === null ? "N/A" : frustrationAvg.toFixed(2),
      meta: summary.frustration?.samples
        ? `${summary.frustration.samples} check-in${summary.frustration.samples === 1 ? "" : "s"} · avg 0–1`
        : "No check-ins yet",
      accent: `border-l-brand-special ${EDUCATOR_PURPLE.bgSoft}`,
      countClass: EDUCATOR_PURPLE.text,
      ring: "ring-brand-special/20",
      icon: AlertTriangle,
    },
    {
      title: "Hardest skill",
      count: hardest ? compactTopicLabel(hardest.topic_id) : "—",
      meta: hardest
        ? `${pct(hardest.at_risk_share)} weak · ${getCurriculumTitle(hardest.topic_id)}`
        : "Not enough data yet",
      accent: "border-l-brand-primary bg-brand-primary/[0.06]",
      countClass: "max-w-[7rem] truncate text-xs font-bold text-brand-primary",
      ring: "ring-brand-primary/20",
      icon: Lightbulb,
    },
  ] as const;

  return (
    <section aria-label="Classroom research summary" className="space-y-2">
      <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          const showGapLearners =
            card.title === "Participating but struggling" && gapLearners.length > 0;

          return (
            <div
              key={card.title}
              className={cn(
                "rounded-lg border border-brand-surface border-l-[3px] ring-1",
                card.accent,
                card.ring
              )}
            >
              <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 truncate text-[11px] font-semibold uppercase tracking-wide text-brand-text/60">
                    <Icon className="size-3 shrink-0 opacity-80" />
                    <span className="truncate">{card.title}</span>
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-brand-text/45">
                    {card.meta}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-right leading-none",
                    card.title === "Hardest skill"
                      ? card.countClass
                      : cn("text-base font-bold tabular-nums", card.countClass)
                  )}
                >
                  {card.count}
                </p>
              </div>

              {showGapLearners ? (
                <div className="flex flex-wrap gap-1 border-t border-brand-accent/15 px-2 py-1">
                  {gapLearners.slice(0, 5).map((learner) => (
                    <button
                      key={learner.student_id}
                      type="button"
                      onClick={() => onSelectStudent?.(learner.student_id)}
                      className="rounded-full border border-brand-accent/25 bg-white/90 px-1.5 py-0.5 text-[9px] font-medium text-brand-accent hover:bg-white"
                      title="Open learner diagnostics"
                    >
                      {getStudentDisplayName(learner.student_id, students)}
                      {learner.mastery_average != null
                        ? ` · ${Math.round(learner.mastery_average * 100)}%`
                        : ""}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {distractors.length > 0 ? (
        <div className="rounded-lg border border-brand-surface bg-white px-2.5 py-2 ring-1 ring-brand-surface/80">
          <div className="mb-1.5">
            <p className="text-sm font-semibold text-brand-text">
              Common Class Misconceptions
            </p>
            <p className="text-[10px] text-brand-text/50">
              Wrong-answer patterns the class keeps choosing — useful for what to re-teach next.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {distractors.map((row) => {
              const intensity = Math.max(0.35, row.count / maxDistractorCount);
              return (
                <div
                  key={row.tag}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-brand-accent/20 bg-brand-accent/5 px-2 py-0.5"
                  style={{ opacity: 0.55 + intensity * 0.45 }}
                >
                  <span className="min-w-0 truncate text-[11px] font-medium text-brand-text">
                    {row.tag}
                  </span>
                  <span className="shrink-0 rounded-full bg-brand-accent px-1.5 py-0.5 text-[9px] font-bold text-white">
                    {row.count}×
                  </span>
                  {row.learner_count ? (
                    <span className="shrink-0 text-[9px] text-brand-text/50">
                      {row.learner_count} learner
                      {row.learner_count === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </section>
  );
}
