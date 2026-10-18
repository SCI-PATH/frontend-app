"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  onSelectStudent?: (studentId: string) => void;
}

function AlertCard({
  alert,
  studentName,
  topicTitle,
  onSelectStudent,
}: {
  alert: AtRiskStudentAlert;
  studentName: string;
  topicTitle: string;
  onSelectStudent?: (studentId: string) => void;
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
      <div className="flex items-start gap-3 p-3">
        <button
          type="button"
          className="min-w-0 flex-1 space-y-2 text-left"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <Badge className={cn("text-[0.65rem]", tier.pillClass)}>
            {tier.label} · Risk {alert.risk_score}%
          </Badge>

          <div>
            <p className="text-sm font-bold text-brand-text">{studentName}</p>
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
        </button>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            className="rounded-md p-1 text-brand-text/45 hover:bg-brand-background"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Hide risk details" : "Show risk details"}
          >
            {open ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </button>
          {onSelectStudent ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 border-brand-surface bg-white px-2 text-xs text-brand-text hover:bg-brand-background"
              onClick={() => onSelectStudent(alert.student_id)}
            >
              View profile
            </Button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-brand-surface px-3 pb-3 pt-2 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-brand-text/50">
              Why this learner was flagged
            </p>
            <p className="mt-1 text-xs text-brand-text/55">
              These signals make up the risk score shown on the card.
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-4">
              {reasons.map((reason) => (
                <li key={reason} className="text-xs text-brand-text/80">
                  {reason}
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
  onSelectStudent,
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
                  Risk Score {tier.scoreRange}
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
              onSelectStudent={onSelectStudent}
            />
          ))}
        </div>
      )}
    </div>
  );
}
