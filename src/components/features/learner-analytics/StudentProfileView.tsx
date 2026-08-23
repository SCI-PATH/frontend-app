"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, BookOpen, Loader2, Target } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";
import { fetchStudentProfile } from "@/lib/api/educator";
import { getCurriculumTitle } from "@/lib/curriculum/topics";
import { countStudentTopicBands, masteryPercent } from "@/lib/educator/bkt";
import { getRiskTier } from "@/lib/educator/risk";
import { EDUCATOR_AT_RISK } from "@/lib/educator/theme";
import { studentFocusAction, studentFocusReason } from "@/lib/student/focusAreas";
import { fetchEnrolledClasses } from "@/lib/user-management";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import type { StudentProfileResponse, TeacherClass } from "@/types";

export function StudentProfileView() {
  const user = useUserStore((state) => state.user);
  const userId = useUserStore((state) => state.userId);
  const token = useUserStore((state) => state.token);
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);
  const [enrolledClasses, setEnrolledClasses] = useState<TeacherClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setError("Sign in to view your learner profile.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [nextProfile, classes] = await Promise.all([
        fetchStudentProfile(userId),
        token ? fetchEnrolledClasses(token).catch(() => []) : Promise.resolve([]),
      ]);
      setProfile(nextProfile);
      setEnrolledClasses(classes);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load your profile."
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const bands = useMemo(() => {
    const topicIds = (profile?.bkt_parameters ?? []).map((row) => row.topic_id);
    const row = Object.fromEntries(
      (profile?.bkt_parameters ?? []).map((entry) => [entry.topic_id, entry.p_l])
    );
    return countStudentTopicBands(row, topicIds);
  }, [profile]);

  const focusAreas = profile?.focus_areas ?? [];
  const enrolled = enrolledClasses[0] ?? null;
  const distractors =
    profile?.assessment_insights?.most_frequent_distractor_tags ?? [];
  const recentAttempts = profile?.recent_attempts ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-3 py-6 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-brand-secondary">
            Learner profile
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
            {user?.name || "Your profile"}
          </h1>
          <p className="mt-1 text-sm text-brand-text/65">
            {user?.grade ?? "Grade"}
            {enrolled ? ` · ${enrolled.class_name}` : ""}
            {enrolled ? (
              <span className="ml-1 font-mono text-brand-primary">
                {enrolled.class_code}
              </span>
            ) : (
              " · Not enrolled in a class yet"
            )}
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-brand-surface bg-white text-brand-text hover:bg-brand-background"
        >
          <Link href={STUDENT_HOME_PATH}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-brand-surface bg-white py-16 text-brand-text/70">
          <Loader2 className="size-5 animate-spin text-brand-primary" />
          Loading your mastery profile…
        </div>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <StatCard
              label="Skills practised"
              value={String(profile?.topics_covered_count ?? 0)}
            />
            <StatCard label="Mastered" value={String(bands.mastered)} tone="ok" />
            <StatCard
              label="Focus skills"
              value={String(profile?.focus_areas_count ?? focusAreas.length)}
              tone={focusAreas.length > 0 ? "alert" : "default"}
            />
          </section>

          {enrolled ? (
            <section className="flex items-start gap-3 rounded-2xl border border-brand-primary/20 bg-white px-5 py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <BookOpen className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Enrolled class
                </p>
                <h2 className="text-lg font-semibold text-brand-text">
                  {enrolled.class_name}
                </h2>
                <p className="text-sm text-brand-text/60">
                  Grade {enrolled.grade_level}
                  {enrolled.subject ? ` · ${enrolled.subject}` : ""} ·{" "}
                  <span className="font-mono text-brand-primary">
                    {enrolled.class_code}
                  </span>
                </p>
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-red-200 bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Target className="size-5 text-red-600" aria-hidden />
              <div>
                <h2 className="text-lg font-semibold text-brand-text">
                  Skills to practise
                </h2>
                <p className="text-sm text-brand-text/60">
                  These are your at-risk / focus areas from live BKT mastery.
                </p>
              </div>
              <Badge className={`ml-auto ${EDUCATOR_AT_RISK.badge}`}>
                {focusAreas.length}
              </Badge>
            </div>
            {focusAreas.length === 0 ? (
              <p className="rounded-xl border border-dashed border-brand-surface bg-brand-background px-4 py-6 text-sm text-brand-text/65">
                No skill currently meets the at-risk rule. Keep practising — this list
                updates after quizzes and tutor attempts.
              </p>
            ) : (
              <ul className="space-y-3">
                {focusAreas.map((area) => {
                  const tier = getRiskTier(area.risk_score);
                  const pct = masteryPercent(area.mastery_probability);
                  return (
                    <li
                      key={`${area.topic_id}-${area.risk_score}`}
                      className={cn(
                        "rounded-xl border border-l-4 bg-brand-background/60 px-4 py-3",
                        tier.borderClass
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-brand-text">
                            {getCurriculumTitle(area.topic_id)}
                          </p>
                          <p className="font-mono text-xs text-brand-text/45">
                            {area.topic_id}
                          </p>
                        </div>
                        <Badge className={tier.pillClass}>{tier.label}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-brand-text/70">
                        {pct !== null ? `Estimated mastery ${pct}%. ` : ""}
                        {studentFocusReason(area.reason)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-brand-primary">
                        {studentFocusAction(area.risk_score)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-brand-surface bg-white p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-brand-text">Skill mastery</h2>
            <p className="mb-4 text-sm text-brand-text/60">
              Current P(L) for skills you have practised.
            </p>
            {(profile?.bkt_parameters ?? []).length === 0 ? (
              <p className="text-sm text-brand-text/65">
                No quiz or tutor evidence yet. Complete a lesson quiz to see mastery
                here.
              </p>
            ) : (
              <ul className="divide-y divide-brand-surface">
                {(profile?.bkt_parameters ?? []).map((row) => {
                  const pct = masteryPercent(row.p_l);
                  return (
                    <li
                      key={row.topic_id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-brand-text">
                          {getCurriculumTitle(row.topic_id)}
                        </p>
                        <p className="font-mono text-xs text-brand-text/45">
                          {row.topic_id}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-text">
                          {pct !== null ? `${pct}%` : "—"}
                        </span>
                        <Badge
                          className={
                            row.mastery_category === "advanced"
                              ? "bg-brand-secondary/20 text-brand-text"
                              : row.mastery_category === "basic"
                                ? EDUCATOR_AT_RISK.badge
                                : "bg-brand-primary/15 text-brand-primary"
                          }
                        >
                          {row.mastery_category ?? "—"}
                        </Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-brand-surface bg-white p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-brand-text">
                Recent quiz attempts
              </h2>
              {recentAttempts.length === 0 ? (
                <p className="mt-3 text-sm text-brand-text/65">
                  No scored questions yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {recentAttempts.slice(-8).reverse().map((attempt, index) => (
                    <li
                      key={`${attempt.topic_id}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-brand-background px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate text-brand-text">
                        {getCurriculumTitle(attempt.topic_id)}
                      </span>
                      <span
                        className={
                          attempt.is_correct
                            ? "font-semibold text-brand-secondary"
                            : EDUCATOR_AT_RISK.text
                        }
                      >
                        {attempt.is_correct ? "Correct" : "Incorrect"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-brand-surface bg-white p-5 sm:p-6">
              <div className="mb-3 flex items-center gap-2">
                <AlertTriangle className="size-4 text-brand-accent" aria-hidden />
                <h2 className="text-lg font-semibold text-brand-text">
                  Common mistakes
                </h2>
              </div>
              {distractors.length === 0 ? (
                <p className="text-sm text-brand-text/65">
                  No misconception labels yet. Wrong MCQ answers from the question
                  engine appear here.
                </p>
              ) : (
                <ul className="space-y-2">
                  {distractors.slice(0, 8).map((item) => (
                    <li
                      key={item.tag}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="text-brand-text">{item.tag}</span>
                      <span className="font-semibold text-brand-text/70">
                        ×{item.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "alert";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white px-4 py-4",
        tone === "ok" && "border-brand-secondary/35",
        tone === "alert" && "border-red-200",
        tone === "default" && "border-brand-surface"
      )}
    >
      <p className="text-xs font-semibold tracking-wide text-brand-text/55 uppercase">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold",
          tone === "ok" && "text-brand-secondary",
          tone === "alert" && EDUCATOR_AT_RISK.textStrong,
          tone === "default" && "text-brand-text"
        )}
      >
        {value}
      </p>
    </div>
  );
}
