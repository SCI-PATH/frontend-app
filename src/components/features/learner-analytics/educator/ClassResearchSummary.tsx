"use client";

import { isMisconceptionPhrase } from "@/lib/educator/misconceptions";
import type { ClassSummaryResponse } from "@/types/educator";

interface ClassResearchSummaryProps {
  summary: ClassSummaryResponse | null;
  isLoading: boolean;
  error: string | null;
}

export function ClassResearchSummary({
  summary,
  isLoading,
  error,
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
        aria-label="Classroom misconceptions"
        className="rounded-lg border border-brand-surface bg-white px-3 py-2 text-xs text-brand-text/60"
      >
        Loading class misconceptions…
      </section>
    );
  }

  if (!summary) return null;

  const distractors = (summary.top_distractors ?? [])
    .filter((row) => isMisconceptionPhrase(row.tag))
    .slice(0, 6);
  const maxDistractorCount = Math.max(...distractors.map((row) => row.count), 1);

  if (distractors.length === 0) return null;

  return (
    <section
      aria-label="Classroom misconceptions"
      className="rounded-2xl border border-brand-surface bg-white px-4 py-4 shadow-sm ring-1 ring-brand-surface/80"
    >
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold text-brand-text">
          Common class misconceptions
        </h2>
        <p className="text-xs text-brand-text/45">
          {distractors.length} pattern{distractors.length === 1 ? "" : "s"}
        </p>
      </div>
      <ol className="space-y-3">
        {distractors.map((row, index) => {
          const width = Math.max(8, Math.round((row.count / maxDistractorCount) * 100));
          return (
            <li
              key={row.tag}
              className="grid grid-cols-[1.25rem_minmax(0,1fr)_3.25rem] items-center gap-3"
            >
              <span className="text-xs font-bold tabular-nums text-brand-text/35">
                {index + 1}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-text" title={row.tag}>
                  {row.tag}
                </p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-brand-accent/10">
                  <div
                    className="h-full rounded-full bg-brand-accent"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums text-brand-accent">
                  {row.count}
                </p>
                {row.learner_count ? (
                  <p className="text-[10px] text-brand-text/45">
                    {row.learner_count} learner
                    {row.learner_count === 1 ? "" : "s"}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
