"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurriculumTitle } from "@/lib/curriculum/topics";
import { getStudentDisplayName } from "@/lib/educator/students";
import {
  getRiskTier,
  groupAlertsByTier,
  parseRiskReasons,
  recentQuizStatus,
  recommendedAction,
  RISK_REASON_POINTS,
  RISK_TIERS,
} from "@/lib/educator/risk";
import { EDUCATOR_AT_RISK, EDUCATOR_PURPLE } from "@/lib/educator/theme";
import { masteryPercent } from "@/lib/educator/bkt";
import { cn } from "@/lib/utils";
import type {
  AtRiskStudentAlert,
  ClassroomStudentMeta,
  ClassroomTopicMeta,
  RiskTierId,
} from "@/types/educator";

interface AtRiskFeedProps {
  alerts: AtRiskStudentAlert[];
  students?: readonly ClassroomStudentMeta[];
  topicCatalog?: readonly ClassroomTopicMeta[];
  showHeader?: boolean;
}

function AlertCard({
  alert,
  studentName,
  topicTitle,
}: {
  alert: AtRiskStudentAlert;
  studentName: string;
  topicTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const tier = getRiskTier(alert.risk_score);
  const masteryPct = masteryPercent(alert.mastery_probability) ?? 0;
  const reasons = parseRiskReasons(alert.reason);

  return (
    <article
      className={cn(
        "overflow-hidden rounded-xl border border-brand-surface bg-white shadow-sm",
        "border-l-4",
        tier.borderClass
      )}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 p-3 text-left transition hover:bg-brand-background/40"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1 space-y-2">
          <Badge className={cn("text-[0.65rem]", tier.pillClass)}>
            {tier.label} · Risk {alert.risk_score}%
          </Badge>

          <div>
            <p className="text-sm font-bold text-brand-text">{studentName}</p>
            <p className="font-mono text-[0.62rem] text-brand-text/45">
              {alert.student_id}
            </p>
          </div>

          <div
            className={cn(
              "rounded-lg border px-2.5 py-2",
              EDUCATOR_AT_RISK.borderSoft,
              EDUCATOR_AT_RISK.bgSoft
            )}
          >
            <p
              className={cn(
                "text-[0.6rem] font-bold uppercase tracking-wide",
                EDUCATOR_AT_RISK.text
              )}
            >
              Skill needing help
            </p>
            <p className={cn("mt-1 text-xs leading-snug", EDUCATOR_PURPLE.text)}>
              {topicTitle}
            </p>
            <p
              className={cn(
                "mt-0.5 font-mono text-[0.62rem] leading-snug",
                EDUCATOR_AT_RISK.textStrong
              )}
            >
              {alert.topic_id}
            </p>
          </div>

          {!open ? (
            <p className="line-clamp-1 text-xs text-brand-text/65">
              <span className="font-semibold">Why flagged:</span> {alert.reason}
            </p>
          ) : null}
        </div>

        {open ? (
          <ChevronUp className="mt-1 size-4 shrink-0 text-brand-text/45" />
        ) : (
          <ChevronDown className="mt-1 size-4 shrink-0 text-brand-text/45" />
        )}
      </button>

      {open ? (
        <div className="space-y-3 border-t border-brand-surface px-3 pb-3 pt-2 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-brand-text/50">
              Why this learner was flagged
            </p>
            <ul className="mt-1.5 space-y-1">
              {reasons.map((reason) => (
                <li
                  key={reason}
                  className="flex items-center justify-between gap-2 text-xs text-brand-text/80"
                >
                  <span>{reason}</span>
                  {RISK_REASON_POINTS[reason] ? (
                    <span className="font-mono text-brand-text/50">
                      +{RISK_REASON_POINTS[reason]}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-brand-text/80">
            <span className="font-semibold">Current mastery:</span>{" "}
            <span className={cn("font-semibold", EDUCATOR_AT_RISK.textStrong)}>
              {masteryPct}%
            </span>
          </p>
          <p className="text-brand-text/80">
            <span className="font-semibold">Recent quizzes:</span>{" "}
            {recentQuizStatus(alert.recent_performance_avg)}
          </p>
          <p className="text-brand-text/80">
            <span className="font-semibold">Suggested next step:</span>{" "}
            <span className={cn("font-medium", EDUCATOR_PURPLE.text)}>
              {recommendedAction(alert.risk_score)}
            </span>
          </p>
        </div>
      ) : null}
    </article>
  );
}

export function AtRiskFeed({
  alerts,
  students = [],
  topicCatalog = [],
  showHeader = true,
}: AtRiskFeedProps) {
  const grouped = groupAlertsByTier(alerts);
  const defaultTier = useMemo<RiskTierId>(() => {
    const firstWithAlerts = groupAlertsByTier(alerts).find(
      (group) => group.alerts.length > 0
    );
    return firstWithAlerts?.tier.id ?? "immediate";
  }, [alerts]);
  const [selectedTierId, setSelectedTierId] = useState<RiskTierId | null>(null);
  const activeTierId = selectedTierId ?? defaultTier;
  const selectedGroup =
    grouped.find((group) => group.tier.id === activeTierId) ?? grouped[0];
  const visibleAlerts = selectedGroup?.alerts ?? [];
  const selectedTier =
    RISK_TIERS.find((tier) => tier.id === activeTierId) ?? RISK_TIERS[0];

  const titleByTopicId = new Map(
    topicCatalog.map((topic) => [topic.topicId, topic.curriculumTitle])
  );
  const resolveTitle = (topicId: string) =>
    titleByTopicId.get(topicId) ?? getCurriculumTitle(topicId);
  const resolveStudentName = (studentId: string) =>
    getStudentDisplayName(studentId, students);

  const tierCounts = grouped.map(({ tier, alerts: tierAlerts }) => ({
    tier,
    count: tierAlerts.length,
  }));

  return (
    <div aria-label="Priority at-risk intervention feed" className="space-y-4">
      {showHeader ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-brand-text">
              Priority At-Risk Intervention Feed
            </h2>
            <p className="text-sm text-brand-text/65">
              Learners who need follow-up soon. Open a card for details and a suggested next step.
            </p>
          </div>
          <p className={cn("text-sm font-semibold", EDUCATOR_AT_RISK.text)}>
            {alerts.length} alert{alerts.length === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}

      <p className="rounded-lg border border-brand-surface bg-brand-background/70 px-3 py-2 text-xs leading-relaxed text-brand-text/65">
        One alert per learner (their most urgent skill). Tap a risk tier to
        filter the cards below. Use{" "}
        <span className="font-medium text-brand-text">Learner diagnostics</span>{" "}
        for a full picture of that student.
      </p>

      {alerts.length > 0 ? (
        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-4"
          role="tablist"
          aria-label="Filter alerts by risk tier"
        >
          {tierCounts.map(({ tier, count }) => {
            const selected = tier.id === activeTierId;
            return (
              <button
                key={tier.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setSelectedTierId(tier.id)}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left transition-colors",
                  selected ? tier.filterSelectedClass : tier.filterIdleClass
                )}
              >
                <p
                  className={cn(
                    "text-[0.62rem] font-semibold uppercase tracking-wide",
                    selected ? "text-white/80" : "opacity-70"
                  )}
                >
                  {tier.label}
                </p>
                <p className="text-lg font-bold">{count}</p>
                <p
                  className={cn(
                    "text-[0.65rem]",
                    selected ? "text-white/70" : "opacity-60"
                  )}
                >
                  Score {tier.scoreRange}
                </p>
              </button>
            );
          })}
        </div>
      ) : null}

      {alerts.length === 0 ? (
        <Card className="border-brand-surface bg-brand-background/40">
          <CardHeader>
            <CardTitle className="text-brand-secondary">
              No at-risk students detected
            </CardTitle>
            <CardDescription>
              Nobody in this class currently meets the follow-up criteria.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : visibleAlerts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-brand-surface bg-brand-background px-4 py-8 text-center text-sm text-brand-text/65">
          No learners currently in {selectedTier.label.toLowerCase()}.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
          {visibleAlerts.map((alert) => (
            <AlertCard
              key={`${alert.student_id}-${alert.topic_id}`}
              alert={alert}
              studentName={resolveStudentName(alert.student_id)}
              topicTitle={resolveTitle(alert.topic_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
