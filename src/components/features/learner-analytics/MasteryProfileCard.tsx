"use client";

import Link from "next/link";
import { ChartColumnIncreasing } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STUDENT_PROFILE_PATH } from "@/lib/auth-routes";
import { countStudentTopicBands } from "@/lib/educator/bkt";
import { getCurriculumTitle } from "@/lib/curriculum/topics";
import type { StudentProfileResponse } from "@/types";

interface MasteryProfileCardProps {
  profile?: StudentProfileResponse | null;
}

export function MasteryProfileCard({ profile }: MasteryProfileCardProps) {
  const topicIds = (profile?.bkt_parameters ?? []).map((row) => row.topic_id);
  const row = Object.fromEntries(
    (profile?.bkt_parameters ?? []).map((entry) => [entry.topic_id, entry.p_l])
  );
  const bands = countStudentTopicBands(row, topicIds);
  const covered = profile?.topics_covered_count ?? topicIds.length;
  const focusCount = profile?.focus_areas_count ?? profile?.focus_areas?.length ?? 0;
  const topFocus = profile?.focus_areas?.[0];
  const overall =
    topicIds.length > 0
      ? Math.round(
          ((bands.mastered * 1 + bands.learning * 0.65) / topicIds.length) * 100
        )
      : null;

  return (
    <article className="group relative flex min-h-[20rem] flex-col overflow-hidden rounded-3xl border border-brand-secondary/25 bg-gradient-to-br from-white to-brand-secondary/10 p-7 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div
        className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full bg-brand-secondary/25 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-bold uppercase tracking-wider text-brand-secondary">
          Mastery Profile
        </p>
        <span className="flex size-12 items-center justify-center rounded-2xl bg-brand-secondary text-brand-text shadow-md shadow-brand-secondary/25">
          <ChartColumnIncreasing className="size-6" aria-hidden />
        </span>
      </div>
      <h2 className="relative mt-3 text-lg font-semibold text-brand-text">
        My Learner Profile
      </h2>
      <p className="relative mt-2 text-base leading-snug text-brand-text/65">
        Track mastery and skills that need practice.
      </p>
      <ul className="relative mt-4 space-y-2 rounded-2xl border border-brand-secondary/20 bg-white/75 px-3.5 py-3 text-sm text-brand-text/80">
        <li className="flex justify-between gap-2">
          <span>Skills with evidence</span>
          <span className="font-semibold text-brand-text">{covered}</span>
        </li>
        <li className="flex justify-between gap-2">
          <span>Mastered skills</span>
          <span className="font-semibold text-brand-text">
            {bands.mastered}
            {topicIds.length ? ` / ${topicIds.length}` : ""}
          </span>
        </li>
        {overall !== null ? (
          <li className="flex justify-between gap-2">
            <span>Progress mix</span>
            <span className="font-semibold text-brand-text">{overall}%</span>
          </li>
        ) : null}
        <li className="border-t border-brand-surface pt-2 font-medium text-brand-accent">
          {focusCount > 0 && topFocus
            ? `Focus: ${getCurriculumTitle(topFocus.topic_id)}`
            : "No at-risk focus skills right now"}
        </li>
      </ul>
      <Button
        asChild
        className="relative mt-auto h-11 w-full rounded-2xl bg-brand-secondary text-base text-brand-text shadow-md shadow-brand-secondary/20 hover:bg-brand-secondary/90"
      >
        <Link href={STUDENT_PROFILE_PATH}>
          View full profile
          <ChartColumnIncreasing className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}
