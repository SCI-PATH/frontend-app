"use client";

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
  recentQuizStatus,
  recommendedAction,
} from "@/lib/educator/risk";
import { EDUCATOR_AT_RISK, EDUCATOR_PURPLE } from "@/lib/educator/theme";
import { masteryPercent } from "@/lib/educator/bkt";
import { cn } from "@/lib/utils";
import type {
  AtRiskStudentAlert,
  ClassroomStudentMeta,
  ClassroomTopicMeta,
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
  const tier = getRiskTier(alert.risk_score);
  const masteryPct = masteryPercent(alert.mastery_probability) ?? 0;

  return (
    <article
      className={cn(
        "flex min-h-[240px] flex-col rounded-2xl border border-brand-surface bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md",
        "border-l-[6px]",
        tier.borderClass
      )}
    >
      <div className="space-y-3">
        <div>
          <p className="text-lg font-extrabold text-brand-text">{studentName}</p>
          <p className="font-mono text-xs text-brand-text/45">{alert.student_id}</p>
        </div>

        <div
          className={cn(
            "rounded-xl border-2 px-3.5 py-3",
            EDUCATOR_AT_RISK.borderSoft,
            EDUCATOR_AT_RISK.bgSoft
          )}
        >
          <p
            className={cn(
              "text-[0.65rem] font-bold uppercase tracking-[0.14em]",
              EDUCATOR_AT_RISK.text
            )}
          >
            Skill / Chapter ID
          </p>
          <p
            className={cn(
              "mt-1 break-all font-mono text-xl font-extrabold leading-tight tracking-tight sm:text-2xl",
              EDUCATOR_AT_RISK.textStrong
            )}
          >
            {alert.topic_id}
          </p>
          <p
            className={cn(
              "mt-2 text-sm font-medium leading-snug",
              EDUCATOR_PURPLE.text
            )}
          >
            {topicTitle}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge className={tier.pillClass}>{tier.label}</Badge>
        <span className={cn("text-sm font-bold", EDUCATOR_AT_RISK.text)}>
          Risk score: {alert.risk_score}%
        </span>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-brand-text">
        <span className="font-semibold">Why flagged:</span> {alert.reason}
      </p>

      <div className="mt-auto space-y-1.5 pt-4 text-sm text-brand-text/75">
        <p>
          Current BKT mastery:{" "}
          <span className={cn("font-semibold", EDUCATOR_AT_RISK.textStrong)}>
            {masteryPct}%
          </span>
        </p>
        <p>
          Recent quiz status:{" "}
          <span className="font-semibold text-brand-text">
            {recentQuizStatus(alert.recent_performance_avg)}
          </span>
        </p>
        <p>
          Recommended action:{" "}
          <span className={cn("font-semibold", EDUCATOR_PURPLE.text)}>
            {recommendedAction(alert.risk_score)}
          </span>
        </p>
      </div>
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
  const titleByTopicId = new Map(
    topicCatalog.map((topic) => [topic.topicId, topic.curriculumTitle])
  );
  const resolveTitle = (topicId: string) =>
    titleByTopicId.get(topicId) ?? getCurriculumTitle(topicId);
  const resolveStudentName = (studentId: string) =>
    getStudentDisplayName(studentId, students);

  return (
    <div aria-label="Priority at-risk intervention feed" className="space-y-5">
      {showHeader ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-brand-text">
              Priority At-Risk Intervention Feed
            </h2>
            <p className="text-sm text-brand-text/65">
              Alerts grouped by severity tier with pedagogical next steps.
            </p>
          </div>
          <p className={cn("text-sm font-semibold", EDUCATOR_AT_RISK.text)}>
            {alerts.length} learner-topic flag{alerts.length === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}

      {alerts.length === 0 ? (
        <Card className="border-brand-surface bg-brand-background/40">
          <CardHeader>
            <CardTitle className="text-brand-secondary">
              No at-risk students detected
            </CardTitle>
            <CardDescription>
              The classroom has no at-risk flags for the current live slice.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(({ tier, alerts: tierAlerts }) =>
            tierAlerts.length > 0 ? (
              <div key={tier.id} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={tier.pillClass}>{tier.label}</Badge>
                  <span className="text-sm text-brand-text/60">
                    {tierAlerts.length} alert{tierAlerts.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                  {tierAlerts.map((alert) => (
                    <AlertCard
                      key={`${alert.student_id}-${alert.topic_id}`}
                      alert={alert}
                      studentName={resolveStudentName(alert.student_id)}
                      topicTitle={resolveTitle(alert.topic_id)}
                    />
                  ))}
                </div>
              </div>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
