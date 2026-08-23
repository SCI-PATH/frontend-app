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
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-secondary/30 bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-secondary">
        Mastery Profile
      </p>
      <h2 className="text-lg font-semibold text-brand-text">My Learner Profile</h2>
      <p className="text-base leading-snug text-brand-text/65">
        Track mastery and skills that need practice.
      </p>
      <ul className="space-y-1 text-base text-brand-text/80">
        <li className="flex justify-between">
          <span>Skills with evidence</span>
          <span className="font-semibold">{covered}</span>
        </li>
        <li className="flex justify-between">
          <span>Mastered skills</span>
          <span className="font-semibold">
            {bands.mastered}
            {topicIds.length ? ` / ${topicIds.length}` : ""}
          </span>
        </li>
        {overall !== null ? (
          <li className="flex justify-between">
            <span>Progress mix</span>
            <span className="font-semibold">{overall}%</span>
          </li>
        ) : null}
        <li className="font-medium text-brand-accent">
          {focusCount > 0 && topFocus
            ? `Focus: ${getCurriculumTitle(topFocus.topic_id)}`
            : "No at-risk focus skills right now"}
        </li>
      </ul>
      <Button
        asChild
        className="mt-auto w-full bg-brand-secondary text-base text-brand-text hover:bg-brand-secondary/90"
      >
        <Link href={STUDENT_PROFILE_PATH}>
          View full profile
          <ChartColumnIncreasing className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}
