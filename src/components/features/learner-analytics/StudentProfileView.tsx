"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";

import { StudentAvatarPicker } from "@/components/features/learner-analytics/StudentAvatarPicker";
import { StudentProfileDetailsForm } from "@/components/features/learner-analytics/StudentProfileDetailsForm";
import { ProfileRecentQuizAttempts } from "@/components/features/assessment-engine/components/ProfileRecentQuizAttempts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";
import { fetchStudentProfile } from "@/lib/api/educator";
import { getCurriculumTitle } from "@/lib/curriculum/topics";
import { countStudentTopicBands, masteryPercent } from "@/lib/educator/bkt";
import { isMisconceptionPhrase } from "@/lib/educator/misconceptions";
import { getRiskTier } from "@/lib/educator/risk";
import { EDUCATOR_AT_RISK } from "@/lib/educator/theme";
import { studentFocusAction, studentFocusReason } from "@/lib/student/focusAreas";
import {
  fetchCurrentUser,
  fetchEnrolledClasses,
} from "@/lib/user-management";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import type { BktParameterRow, StudentProfileResponse, TeacherClass } from "@/types";

function isUserLevelTopic(topicId: string | null | undefined): boolean {
  return String(topicId || "").trim().toUpperCase() === "USER";
}

/** Skills with quiz evidence only — Socrates chat does not update BKT. */
function quizMasteryRows(
  profile: StudentProfileResponse | null
): BktParameterRow[] {
  const rows = (profile?.bkt_parameters ?? []).filter(
    (row) => row.topic_id && !isUserLevelTopic(row.topic_id)
  );
  const quizIds = new Set<string>();
  for (const attempt of profile?.recent_attempts ?? []) {
    if (attempt.topic_id && !isUserLevelTopic(attempt.topic_id)) {
      quizIds.add(attempt.topic_id);
    }
  }
  for (const point of profile?.mastery_timeline_last_10_attempts ?? []) {
    if (point.topic_id && !isUserLevelTopic(point.topic_id)) {
      quizIds.add(point.topic_id);
    }
  }
  const chatIds = new Set<string>();
  for (const turn of profile?.chat_history_last_5 ?? []) {
    if (turn.topic_id && !isUserLevelTopic(turn.topic_id)) {
      chatIds.add(turn.topic_id);
    }
  }
  for (const turn of profile?.engagement_timeline_last_10_turns ?? []) {
    if (turn.topic_id && !isUserLevelTopic(turn.topic_id)) {
      chatIds.add(turn.topic_id);
    }
  }
  if (quizIds.size === 0 && chatIds.size === 0) return rows;
  return rows.filter(
    (row) => quizIds.has(row.topic_id) || !chatIds.has(row.topic_id)
  );
}

function ProfileLoadingOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="relative overflow-hidden rounded-[1.75rem] border border-brand-primary/20 bg-white px-5 py-12 shadow-sm sm:px-8 sm:py-16"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 -top-20 size-52 rounded-full bg-brand-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-12 size-56 rounded-full bg-brand-special/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-8 size-32 -translate-x-1/2 rounded-full bg-brand-accent/10 blur-2xl"
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center text-center">
        <div className="relative mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary/15 to-brand-special/20 shadow-inner">
          <Loader2
            className="size-8 animate-spin text-brand-primary"
            aria-hidden
          />
          <Sparkles
            className="absolute -right-1 -top-1 size-4 text-brand-accent"
            aria-hidden
          />
        </div>
        <p className="text-lg font-semibold text-brand-text">
          Loading your mastery profile
        </p>
        <p className="mt-2 text-sm leading-relaxed text-brand-text/60">
          Pulling quiz mastery, class details, and skills to practise…
        </p>
        <div className="mt-6 flex w-full max-w-xs gap-1.5">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="h-1.5 flex-1 animate-pulse rounded-full bg-brand-primary/30"
              style={{ animationDelay: `${index * 180}ms` }}
            />
          ))}
        </div>
      </div>
      <div className="relative mx-auto mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-2xl border border-brand-surface bg-brand-background/80"
            style={{ animationDelay: `${index * 90}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">Loading your learner profile</span>
    </div>
  );
}

export function StudentProfileView() {
  const user = useUserStore((state) => state.user);
  const userId = useUserStore((state) => state.userId);
  const token = useUserStore((state) => state.token);
  const setSession = useUserStore((state) => state.setSession);
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
      const [nextProfile, classes, account] = await Promise.all([
        fetchStudentProfile(userId),
        token ? fetchEnrolledClasses(token).catch(() => []) : Promise.resolve([]),
        token ? fetchCurrentUser(token).catch(() => null) : Promise.resolve(null),
      ]);
      setProfile(nextProfile);
      setEnrolledClasses(classes);
      if (account) setSession({ user: account });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not load your profile."
      );
    } finally {
      setIsLoading(false);
    }
  }, [setSession, token, userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const quizSkills = useMemo(() => quizMasteryRows(profile), [profile]);

  const bands = useMemo(() => {
    const topicIds = quizSkills.map((row) => row.topic_id);
    const row = Object.fromEntries(
      quizSkills.map((entry) => [entry.topic_id, entry.p_l])
    );
    return countStudentTopicBands(row, topicIds);
  }, [quizSkills]);

  const overallMastery = useMemo(() => {
    const values = quizSkills
      .map((row) => row.p_l)
      .filter((value): value is number => typeof value === "number");
    if (values.length === 0) return null;
    return Math.round(
      (values.reduce((sum, value) => sum + value, 0) / values.length) * 100
    );
  }, [quizSkills]);

  const focusAreas = profile?.focus_areas ?? [];
  const enrolled = enrolledClasses[0] ?? null;
  const distractors = (
    profile?.assessment_insights?.most_frequent_distractor_tags ?? []
  ).filter((item) => isMisconceptionPhrase(item.tag));
  const recentAttempts = profile?.recent_attempts ?? [];
  const quizAttempts = profile?.assessment_insights?.attempts_count ?? recentAttempts.length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-3 py-6 sm:px-5">
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-primary via-brand-special to-brand-accent px-5 py-6 text-white sm:px-8 sm:py-8">
        <div
          className="pointer-events-none absolute -right-12 -top-16 size-52 rounded-full bg-white/15 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/3 size-40 rounded-full bg-brand-secondary/30 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 space-y-3">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold uppercase tracking-wide">
              <Sparkles className="size-4" aria-hidden />
              Learner profile
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {user?.name || "Your profile"}
            </h1>
            <p className="max-w-xl text-base text-white/90">
              {user?.grade ?? "Grade"}
              {enrolled ? ` · ${enrolled.class_name}` : " · Choose an avatar and keep your details up to date"}
            </p>
            {enrolled ? (
              <p className="font-mono text-sm text-white/80">{enrolled.class_code}</p>
            ) : null}
            <Button
              asChild
              variant="outline"
              className="border-white/50 bg-white/10 text-white hover:bg-white hover:text-brand-primary"
            >
              <Link href={STUDENT_HOME_PATH}>
                <ArrowLeft className="size-4" aria-hidden />
                Back to home
              </Link>
            </Button>
          </div>
          <StudentAvatarPicker />
        </div>
      </section>

      {isLoading ? (
        <ProfileLoadingOverlay />
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : (
        <>
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <StudentProfileDetailsForm />
            <section className="grid gap-3 sm:grid-cols-2">
              <StatCard
                label="Overall mastery"
                value={overallMastery != null ? `${overallMastery}%` : "—"}
                hint="Average P(L) from lesson quizzes"
              />
              <StatCard
                label="Skills practised"
                value={String(quizSkills.length)}
              />
              <StatCard
                label="Mastered"
                value={String(bands.mastered)}
                tone="ok"
              />
              <StatCard
                label="Still learning"
                value={String(bands.learning)}
              />
              <StatCard
                label="Needs support"
                value={String(bands.atRisk)}
                tone={bands.atRisk > 0 ? "alert" : "default"}
              />
              <StatCard
                label="Quiz attempts"
                value={String(quizAttempts)}
              />
            </section>
          </div>

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

          <section className="rounded-2xl border border-brand-accent/25 bg-white p-5 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <Target className="size-5 text-brand-accent" aria-hidden />
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
              Current P(L) for skills scored on lesson quizzes. Socrates chat does
              not change these values.
            </p>
            {quizSkills.length === 0 ? (
              <p className="text-sm text-brand-text/65">
                No quiz evidence yet. Complete a lesson quiz to see mastery here.
              </p>
            ) : (
              <ul className="divide-y divide-brand-surface">
                {quizSkills.map((row) => {
                  const pct = masteryPercent(row.p_l);
                  return (
                    <li
                      key={row.topic_id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-brand-text">
                          {getCurriculumTitle(row.topic_id)}
                        </p>
                        <p className="font-mono text-xs text-brand-text/45">
                          {row.topic_id}
                        </p>
                        {pct !== null ? (
                          <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-brand-surface">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                row.mastery_category === "advanced" ||
                                  row.mastery_category === "mastered"
                                  ? "bg-brand-secondary"
                                  : row.mastery_category === "basic" ||
                                      row.mastery_category === "at_risk"
                                    ? "bg-brand-accent"
                                    : "bg-brand-primary"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-brand-text">
                          {pct !== null ? `${pct}%` : "—"}
                        </span>
                        <Badge
                          className={
                            row.mastery_category === "advanced" ||
                            row.mastery_category === "mastered"
                              ? "bg-brand-secondary/20 text-brand-text"
                              : row.mastery_category === "basic" ||
                                  row.mastery_category === "at_risk"
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
              <div className="mb-3 flex items-center gap-2">
                <ClipboardList
                  className="size-4 text-brand-primary"
                  aria-hidden
                />
                <h2 className="text-lg font-semibold text-brand-text">
                  Recent quiz attempts
                </h2>
              </div>
              <ProfileRecentQuizAttempts />
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
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "ok" | "alert";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border bg-white px-4 py-4",
        tone === "ok" && "border-brand-secondary/35",
        tone === "alert" && "border-brand-accent/35",
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
          tone === "alert" && "text-brand-accent",
          tone === "default" && "text-brand-text"
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-brand-text/50">{hint}</p> : null}
    </div>
  );
}
