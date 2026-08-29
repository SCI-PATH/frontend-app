"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChartColumnIncreasing, Loader2 } from "lucide-react";

import { LearningHubCardShell } from "@/components/common/student-home/LearningHubCardShell";
import { Button } from "@/components/ui/button";
import { STUDENT_PROFILE_PATH } from "@/lib/auth-routes";
import { fetchStudentProfile } from "@/lib/api/educator";
import {
  buildStudentProfileMetrics,
  type StudentProfileMetrics,
} from "@/lib/student/profileMetrics";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

function MetricPill({
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
        "rounded-lg border bg-white/90 px-1.5 py-1.5 text-center",
        tone === "ok" && "border-brand-secondary/30",
        tone === "alert" && "border-brand-accent/30",
        tone === "default" && "border-brand-surface"
      )}
    >
      <p className="text-[9px] font-bold uppercase tracking-wide text-brand-text/50">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-base font-bold leading-none",
          tone === "ok" && "text-brand-secondary",
          tone === "alert" && "text-brand-accent",
          tone === "default" && "text-brand-text"
        )}
      >
        {value}
      </p>
    </div>
  );
}

/** Home hub card — keeps learner-analytics MasteryProfileCard untouched. */
export function HomeMasteryProfileCard() {
  const userId = useUserStore((s) => s.userId);
  const [metrics, setMetrics] = useState<StudentProfileMetrics | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    if (!userId) {
      setMetrics(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void fetchStudentProfile(userId)
      .then((profile) => {
        if (!cancelled) setMetrics(buildStudentProfileMetrics(profile));
      })
      .catch(() => {
        if (!cancelled) setMetrics(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const percent = metrics?.overallMastery ?? 0;

  return (
    <LearningHubCardShell
      tone="secondary"
      eyebrow="Mastery profile"
      title="Your science skills"
      description="Quiz mastery synced with your learner profile."
      icon={ChartColumnIncreasing}
      footer={
        <Button
          asChild
          className="h-11 w-full rounded-2xl bg-brand-secondary text-base font-semibold text-brand-text shadow-md shadow-brand-secondary/25 hover:bg-brand-secondary/90"
        >
          <Link href={STUDENT_PROFILE_PATH}>
            View full profile
            <ChartColumnIncreasing className="size-4" aria-hidden />
          </Link>
        </Button>
      }
    >
      <div className="flex h-full flex-col justify-center gap-2.5 rounded-2xl border border-brand-secondary/20 bg-white/85 p-3.5 backdrop-blur-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-brand-text/50">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading mastery…
          </div>
        ) : metrics ? (
          <>
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-brand-text/50">
                  Overall mastery
                </p>
                <p className="text-2xl font-black leading-none text-brand-text">
                  {metrics.overallMastery != null ? `${percent}%` : "—"}
                </p>
              </div>
              <p className="text-right text-[11px] leading-tight text-brand-text/55">
                {metrics.skillsPractised} skill
                {metrics.skillsPractised === 1 ? "" : "s"}
                <br />
                {metrics.quizAttempts} quiz
                {metrics.quizAttempts === 1 ? "" : "zes"}
              </p>
            </div>
            {metrics.overallMastery != null ? (
              <div
                className="h-2 w-full overflow-hidden rounded-full bg-brand-surface"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Overall mastery"
              >
                <div
                  className="h-full rounded-full bg-brand-secondary transition-[width] duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                />
              </div>
            ) : null}
            <div className="grid grid-cols-3 gap-1.5">
              <MetricPill
                label="Mastered"
                value={String(metrics.mastered)}
                tone="ok"
              />
              <MetricPill label="Learning" value={String(metrics.learning)} />
              <MetricPill
                label="Needs help"
                value={String(metrics.atRisk)}
                tone={metrics.atRisk > 0 ? "alert" : "default"}
              />
            </div>
          </>
        ) : (
          <p className="text-sm text-brand-text/55">
            {userId
              ? "Mastery data unavailable right now."
              : "Sign in to see your mastery profile."}
          </p>
        )}
      </div>
    </LearningHubCardShell>
  );
}
