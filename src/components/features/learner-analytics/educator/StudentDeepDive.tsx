"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, ChevronDown, Timer } from "lucide-react";

import { CollapsibleSection } from "@/components/features/learner-analytics/educator/CollapsibleSection";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurriculumTitle } from "@/lib/curriculum/topics";
import { countStudentTopicBands, masteryPercent } from "@/lib/educator/bkt";
import { formatEducatorTimestamp } from "@/lib/educator/format";
import { isMisconceptionPhrase } from "@/lib/educator/misconceptions";
import { getRiskTier, parseRiskReasons } from "@/lib/educator/risk";
import { getStudentDisplayName } from "@/lib/educator/students";
import { compactTopicLabel } from "@/lib/educator/topicGrade";
import { EDUCATOR_AT_RISK, EDUCATOR_PURPLE } from "@/lib/educator/theme";
import { cn } from "@/lib/utils";
import type {
  ChatHistoryTurn,
  ClassroomStudentMeta,
  RecentAttemptRow,
  StudentFocusArea,
  StudentProfileResponse,
  TimeOnTaskTrend,
} from "@/types/educator";

interface StudentDeepDiveProps {
  studentIds: readonly string[];
  students: readonly ClassroomStudentMeta[];
  selectedStudentId: string | null;
  topicIds: readonly string[];
  matrixRow?: Record<string, number | null>;
  attemptMatrix?: Record<string, Record<string, number>>;
  priorByTopicId?: Record<string, number>;
  profile: StudentProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  onStudentChange: (studentId: string) => void;
}

function MetricPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "danger" | "special";
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border px-2 py-2",
        tone === "danger" && "border-red-200 bg-red-50",
        tone === "special" && "border-brand-special/20 bg-brand-special/5",
        tone === "default" && "border-brand-surface bg-brand-background"
      )}
    >
      <p className="text-[10px] uppercase leading-tight tracking-wide text-brand-text/50">
        {label}
      </p>
      <p
        className={cn(
          "text-base font-bold tabular-nums text-brand-text",
          tone === "danger" && EDUCATOR_AT_RISK.textStrong,
          tone === "special" && EDUCATOR_PURPLE.text
        )}
      >
        {value}
      </p>
    </div>
  );
}

interface MisconceptionTooltipProps {
  active?: boolean;
  payload?: readonly {
    value?: number | string;
    payload?: { tag?: string };
  }[];
  coordinate?: { x: number; y: number };
  chartContainerRef: React.RefObject<HTMLDivElement | null>;
}

function MisconceptionChartTooltip({
  active,
  payload,
  coordinate,
  chartContainerRef,
}: MisconceptionTooltipProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!active || !payload?.length || !mounted) return null;

  const tag = String(payload[0]?.payload?.tag ?? "");
  const count = payload[0]?.value;
  const rect = chartContainerRef.current?.getBoundingClientRect();
  const left =
    rect && coordinate ? rect.left + coordinate.x + 12 : undefined;
  const top =
    rect && coordinate ? rect.top + coordinate.y - 36 : undefined;

  const tooltip = (
    <div
      className="pointer-events-none z-[200] max-w-[min(18rem,calc(100vw-1.5rem))] rounded-lg border border-brand-surface bg-white px-3 py-2 text-xs shadow-lg"
      style={
        left !== undefined && top !== undefined
          ? { position: "fixed", left, top }
          : undefined
      }
    >
      <p className="break-words font-semibold leading-snug text-brand-text">
        {tag}
      </p>
      <p className="mt-1 text-brand-text/65">
        Selected <span className="font-semibold tabular-nums">{count}</span>{" "}
        time{count === 1 ? "" : "s"} on incorrect attempts
      </p>
    </div>
  );

  return createPortal(tooltip, document.body);
}

function FocusAreaList({ areas }: { areas: StudentFocusArea[] }) {
  if (areas.length === 0) {
    return (
      <p className="text-sm text-brand-text/60">
        No focus topics flagged for this learner right now — they may be on track
        across attempted skills.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {areas.slice(0, 6).map((area) => {
        const tier = getRiskTier(area.risk_score);
        const masteryPct = masteryPercent(area.mastery_probability) ?? 0;
        const reasons = parseRiskReasons(area.reason);

        return (
          <li
            key={area.topic_id}
            className={cn(
              "rounded-xl border border-brand-surface bg-brand-background/40 px-3 py-2.5",
              "border-l-4",
              tier.borderClass
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cn("text-[0.62rem]", tier.pillClass)}>
                {tier.label} · Risk {area.risk_score}%
              </Badge>
              <span className="font-mono text-[0.62rem] text-brand-primary">
                {compactTopicLabel(area.topic_id)}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-brand-text">
              {getCurriculumTitle(area.topic_id)}
            </p>
            <p className="mt-1 text-xs text-brand-text/60">
              Estimated mastery {masteryPct}% ·{" "}
              {reasons.length > 0 ? reasons.join(" · ") : area.reason}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function seriesDirection(values: number[]): "up" | "down" | "flat" | null {
  if (values.length < 2) return null;
  const delta = values[values.length - 1] - values[0];
  if (delta >= 8) return "up";
  if (delta <= -8) return "down";
  return "flat";
}

function summarizeQuizVsChat(
  points: { mastery: number | null; engagement: number | null }[],
  gapFlagged: boolean
): string {
  const quiz = points
    .map((point) => point.mastery)
    .filter((value): value is number => value !== null);
  const chat = points
    .map((point) => point.engagement)
    .filter((value): value is number => value !== null);
  const quizAvg = average(quiz);
  const chatAvg = average(chat);

  if (quizAvg === null && chatAvg === null) {
    return "No quiz or tutor-chat scores yet for this learner.";
  }
  if (quizAvg === null) {
    return `Tutor chat scores average ${Math.round(chatAvg!)}% so far. Quiz mastery has not appeared on this chart yet.`;
  }
  if (chatAvg === null) {
    const direction = seriesDirection(quiz);
    if (direction === "up") {
      return `Quiz mastery is rising and currently averages ${Math.round(quizAvg)}%. No tutor chat scores yet.`;
    }
    if (direction === "down") {
      return `Quiz mastery has slipped and currently averages ${Math.round(quizAvg)}%. No tutor chat scores yet.`;
    }
    return `Quiz mastery is holding around ${Math.round(quizAvg)}%. No tutor chat scores yet.`;
  }
  if (gapFlagged) {
    return `This learner chats well with the tutor (about ${Math.round(chatAvg)}%), but quiz mastery is still low (about ${Math.round(quizAvg)}%). Check whether they can do the work without the tutor.`;
  }
  const quizDirection = seriesDirection(quiz);
  if (quizAvg >= 70 && chatAvg >= 60) {
    return `Quiz mastery (about ${Math.round(quizAvg)}%) and tutor chat scores (about ${Math.round(chatAvg)}%) both look healthy. Keep regular practice going.`;
  }
  if (quizAvg < 50 && chatAvg < 50) {
    return `Quiz mastery (about ${Math.round(quizAvg)}%) and tutor chat scores (about ${Math.round(chatAvg)}%) are both on the low side. Plan a short reteach on this skill.`;
  }
  if (quizDirection === "up") {
    return `Quiz mastery is trending up (about ${Math.round(quizAvg)}%). Tutor chat scores average about ${Math.round(chatAvg)}%. Keep checking that quiz gains hold without tutor help.`;
  }
  if (quizDirection === "down") {
    return `Quiz mastery is trending down (about ${Math.round(quizAvg)}%). Tutor chat scores average about ${Math.round(chatAvg)}%. Follow up before the drop continues.`;
  }
  return `Quiz mastery averages about ${Math.round(quizAvg)}%; tutor chat scores average about ${Math.round(chatAvg)}%. Use the chart to see whether quizzes and chat are moving together.`;
}

function clipStudentMessage(text?: string | null, maxChars = 140): string | null {
  const trimmed = (text ?? "").replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars).trimEnd()}…`;
}

/** True when the line is affect-only ("I'm stuck") and does not name a science idea. */
function isLowInsightStudentLine(text?: string | null): boolean {
  const trimmed = (text ?? "").replace(/\s+/g, " ").trim();
  if (!trimmed) return true;
  const withoutEmoji = trimmed
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
  if (withoutEmoji.length < 8) return true;
  const affectOnly =
    /^(?:i['’]?m\s+|i\s+am\s+)?(?:so\s+|really\s+|still\s+)?(?:stuck|confused|lost|frustrated)(?:\s+on this(?: step)?)?(?:\s*[.!?…]*)?$/i;
  if (affectOnly.test(withoutEmoji) && withoutEmoji.length < 80) return true;
  if (
    withoutEmoji.length < 48 &&
    /^(?:help(?: me)?|idk|i don['’]?t (?:get|understand|know)(?: this| it)?|give up)(?:\s*[.!?…]*)?$/i.test(
      withoutEmoji
    )
  ) {
    return true;
  }
  return false;
}

function extractTutorQuestion(hint?: string | null): string | null {
  const trimmed = (hint ?? "").replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  const questions = trimmed.match(/[^?]*\?/g);
  if (questions && questions.length > 0) {
    return clipStudentMessage(questions[questions.length - 1].trim(), 180);
  }
  return clipStudentMessage(trimmed, 180);
}

function sameTopic(a?: string | null, b?: string | null): boolean {
  const left = String(a ?? "").trim();
  const right = String(b ?? "").trim();
  return Boolean(left) && left === right;
}

function findPriorScienceLine(
  turn: ChatHistoryTurn,
  history: ChatHistoryTurn[]
): string | null {
  const topicId = String(turn.topic_id ?? "");
  const stamp = turn.timestamp ?? "";
  const candidates = history.filter((row) => {
    if (!sameTopic(row.topic_id, topicId)) return false;
    if (isLowInsightStudentLine(row.student_message)) return false;
    if (stamp && row.timestamp && row.timestamp >= stamp) return false;
    return Boolean((row.student_message ?? "").trim());
  });
  const prior = candidates.at(-1);
  return clipStudentMessage(prior?.student_message, 180);
}

function turnsFromProfile(profile: StudentProfileResponse | null): ChatHistoryTurn[] {
  const fromChat = profile?.chat_history_last_5 ?? [];
  const fromConfusion = profile?.critical_confusion_turns ?? [];
  const fromTimeline = (profile?.engagement_timeline_last_10_turns ?? []).map(
    (row) =>
      ({
        topic_id: row.topic_id,
        interaction_score: row.interaction_score,
        timestamp: row.timestamp,
        persona_id: row.persona_id,
        student_message: (row as ChatHistoryTurn).student_message,
        tutor_hint: (row as ChatHistoryTurn).tutor_hint,
        critical_confusion: (row as ChatHistoryTurn).critical_confusion,
      }) satisfies ChatHistoryTurn
  );
  const merged = [...fromTimeline, ...fromChat, ...fromConfusion];
  const seen = new Set<string>();
  const unique: ChatHistoryTurn[] = [];
  for (const turn of merged) {
    const key = `${turn.timestamp ?? ""}|${turn.topic_id ?? ""}|${turn.student_message ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(turn);
  }
  return unique.sort((a, b) =>
    String(a.timestamp ?? "").localeCompare(String(b.timestamp ?? ""))
  );
}

function formatErrorCategory(value?: string | null): string {
  if (!value) return "—";
  if (value === "NO_ERROR") return "None";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function RecentAttemptsTable({ attempts }: { attempts: RecentAttemptRow[] }) {
  if (attempts.length === 0) {
    return (
      <p className="text-sm text-brand-text/60">
        No recent quiz attempts recorded for this learner yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-brand-surface">
      <table className="w-full min-w-[28rem] text-left text-xs">
        <thead className="bg-brand-background/80 text-[0.65rem] uppercase tracking-wide text-brand-text/50">
          <tr>
            <th className="px-3 py-2 font-medium">Skill</th>
            <th className="px-3 py-2 font-medium">Result</th>
            <th className="px-3 py-2 font-medium">Error</th>
            <th className="px-3 py-2 font-medium">Distractor</th>
            <th className="px-3 py-2 font-medium">Time</th>
            <th className="px-3 py-2 font-medium">P(L)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-surface">
          {[...attempts].reverse().map((row, index) => {
            const mastery =
              typeof row.mastery_probability === "number"
                ? `${Math.round(row.mastery_probability * 100)}%`
                : "—";
            return (
              <tr key={`${row.topic_id}-${index}`} className="align-top">
                <td className="px-3 py-2">
                  <p className="font-medium text-brand-text">
                    {getCurriculumTitle(row.topic_id)}
                  </p>
                  <p className="font-mono text-[0.62rem] text-brand-text/45">
                    {compactTopicLabel(row.topic_id)}
                  </p>
                </td>
                <td className="px-3 py-2">
                  <Badge
                    className={
                      row.is_correct
                        ? "bg-brand-secondary/20 text-brand-text hover:bg-brand-secondary/20"
                        : "bg-red-600 text-white hover:bg-red-600"
                    }
                  >
                    {row.is_correct ? "Correct" : "Incorrect"}
                  </Badge>
                </td>
                <td className="px-3 py-2 text-brand-text/70">
                  {formatErrorCategory(row.error_category)}
                </td>
                <td className="max-w-[8rem] px-3 py-2 text-brand-text/70">
                  {row.distractor_label || "—"}
                </td>
                <td className="px-3 py-2 tabular-nums text-brand-text/70">
                  {typeof row.response_time_s === "number"
                    ? `${row.response_time_s.toFixed(1)}s`
                    : "—"}
                </td>
                <td className="px-3 py-2 tabular-nums font-medium text-brand-text">
                  {mastery}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function trendLabel(trend: TimeOnTaskTrend["trend"]) {
  switch (trend) {
    case "increasing":
      return { text: "Slower", className: "text-brand-accent" };
    case "decreasing":
      return { text: "Faster", className: "text-brand-secondary" };
    default:
      return { text: "Stable", className: "text-brand-text/55" };
  }
}

function TimeOnTaskList({ trends }: { trends: TimeOnTaskTrend[] }) {
  if (trends.length === 0) {
    return (
      <p className="text-sm text-brand-text/60">
        No response-time trends yet — appears after a learner completes several
        quiz attempts.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-brand-surface rounded-xl border border-brand-surface">
      {trends.slice(0, 6).map((row) => {
        const trend = trendLabel(row.trend);
        return (
          <li
            key={row.topic_id}
            className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-brand-text">
                {getCurriculumTitle(row.topic_id)}
              </p>
              <p className="font-mono text-[0.62rem] text-brand-text/45">
                {compactTopicLabel(row.topic_id)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-semibold tabular-nums text-brand-text">
                {row.avg_time_on_task_s !== null &&
                row.avg_time_on_task_s !== undefined
                  ? `${row.avg_time_on_task_s.toFixed(1)}s`
                  : "—"}
              </p>
              <p className={cn("text-[0.65rem] font-medium", trend.className)}>
                {trend.text}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function TutoringActivitySummary({
  profile,
}: {
  profile: StudentProfileResponse | null;
}) {
  const history = useMemo(() => turnsFromProfile(profile), [profile]);
  const confusionTurns = useMemo(() => {
    const flagged = profile?.critical_confusion_turns ?? [];
    if (flagged.length > 0) return flagged;
    return history.filter((turn) => {
      if (turn.critical_confusion) return true;
      return (
        typeof turn.interaction_score === "number" &&
        turn.interaction_score < 0.3
      );
    });
  }, [history, profile?.critical_confusion_turns]);
  const confusionCount = confusionTurns.length;
  const recentTurns = profile?.engagement_timeline_last_10_turns ?? [];
  const recentTopics = useMemo(() => {
    const seen = new Set<string>();
    const rows: { topicId: string; timestamp: string | null }[] = [];
    for (const turn of [...recentTurns].reverse()) {
      const topicId = String(turn.topic_id ?? "");
      if (!topicId || seen.has(topicId)) continue;
      seen.add(topicId);
      rows.push({ topicId, timestamp: turn.timestamp ?? null });
      if (rows.length >= 4) break;
    }
    return rows;
  }, [recentTurns]);

  if (recentTurns.length === 0 && confusionCount === 0) {
    return (
      <p className="text-sm text-brand-text/60">
        No tutoring activity recorded for this learner yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">
          {recentTurns.length} recent tutor turn
          {recentTurns.length === 1 ? "" : "s"}
        </Badge>
        {confusionCount > 0 ? (
          <Badge className="bg-red-600 text-white hover:bg-red-600">
            {confusionCount} critical confusion signal
            {confusionCount === 1 ? "" : "s"}
          </Badge>
        ) : (
          <Badge className="bg-brand-secondary/20 text-brand-text hover:bg-brand-secondary/20">
            No critical confusion flagged
          </Badge>
        )}
      </div>
      {recentTopics.length > 0 ? (
        <ul className="space-y-1.5 text-sm">
          {recentTopics.map(({ topicId, timestamp }) => (
            <li
              key={topicId}
              className="flex items-start justify-between gap-2 rounded-lg bg-brand-background/60 px-2.5 py-2"
            >
              <span className="min-w-0 text-brand-text">
                {getCurriculumTitle(topicId)}
              </span>
              {timestamp ? (
                <span className="shrink-0 text-[0.65rem] text-brand-text/45">
                  {formatEducatorTimestamp(timestamp)}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
      {confusionCount > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/50">
            What they were stuck on
          </p>
          <ul className="space-y-2">
            {confusionTurns.map((turn: ChatHistoryTurn, index) => {
              const topicId = String(turn.topic_id ?? "");
              const tutorQuestion =
                extractTutorQuestion(turn.tutor_hint) ??
                extractTutorQuestion(
                  [...history]
                    .reverse()
                    .find(
                      (row) =>
                        sameTopic(row.topic_id, topicId) &&
                        Boolean(row.tutor_hint?.trim()) &&
                        (!turn.timestamp ||
                          !row.timestamp ||
                          row.timestamp <= turn.timestamp)
                    )?.tutor_hint
                );
              const scienceLine = isLowInsightStudentLine(turn.student_message)
                ? findPriorScienceLine(turn, history)
                : clipStudentMessage(turn.student_message, 180);
              const score =
                typeof turn.interaction_score === "number"
                  ? Math.round(turn.interaction_score * 100)
                  : null;
              return (
                <li
                  key={`${topicId}-${turn.timestamp ?? index}`}
                  className="rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-brand-text">
                    {topicId ? getCurriculumTitle(topicId) : "Unknown topic"}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] text-brand-text/55">
                    Chat score {score !== null ? `${score}%` : "n/a"}
                    {turn.timestamp
                      ? ` · ${formatEducatorTimestamp(turn.timestamp)}`
                      : ""}
                  </p>
                  {tutorQuestion ? (
                    <p className="mt-2 text-sm text-brand-text">
                      <span className="font-semibold text-brand-text/70">
                        Concept Socrates was checking:{" "}
                      </span>
                      {tutorQuestion}
                    </p>
                  ) : null}
                  {scienceLine ? (
                    <p className="mt-1.5 text-sm text-brand-text/85">
                      <span className="font-semibold text-brand-text/70">
                        What they tried to say:{" "}
                      </span>
                      {scienceLine}
                    </p>
                  ) : (
                    <p className="mt-1.5 text-sm text-brand-text/70">
                      They sent a stuck/help message without naming the science
                      idea.
                      {tutorQuestion
                        ? " Use Socrates’ question above as the reteach target."
                        : " Reteach from this skill title."}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
      <p className="text-xs leading-relaxed text-brand-text/50">
        A critical confusion signal is a tutor turn scored below 30%. This
        card shows the skill, the idea Socrates was probing, and any science
        attempt from the student — not a full chat transcript.
      </p>
    </div>
  );
}

export function StudentDeepDive({
  studentIds,
  students = [],
  selectedStudentId,
  topicIds,
  matrixRow,
  attemptMatrix,
  priorByTopicId,
  profile,
  isLoading,
  error,
  onStudentChange,
}: StudentDeepDiveProps) {
  const misconceptionChartRef = useRef<HTMLDivElement>(null);
  const selectedStudentName = selectedStudentId
    ? getStudentDisplayName(selectedStudentId, students)
    : null;
  const rowBands = countStudentTopicBands(matrixRow, topicIds, {
    attemptsByTopic: selectedStudentId
      ? (attemptMatrix?.[selectedStudentId] ?? {})
      : {},
    priorByTopicId,
  });

  const compareData = useMemo(() => {
    const mastery = profile?.mastery_timeline_last_10_attempts ?? [];
    const engagement = profile?.engagement_timeline_last_10_turns ?? [];
    const length = Math.max(mastery.length, engagement.length);
    return Array.from({ length: length }, (_, index) => ({
      step: index + 1,
      mastery:
        mastery[index]?.mastery_probability !== null &&
        mastery[index]?.mastery_probability !== undefined
          ? Math.round((mastery[index]?.mastery_probability ?? 0) * 100)
          : null,
      engagement:
        engagement[index]?.interaction_score !== null &&
        engagement[index]?.interaction_score !== undefined
          ? Math.round((engagement[index]?.interaction_score ?? 0) * 100)
          : null,
    }));
  }, [profile]);

  const misconceptionData = useMemo(() => {
    const tags =
      profile?.assessment_insights?.most_frequent_distractor_tags ?? [];
    return [...tags]
      .filter((item) => isMisconceptionPhrase(item.tag))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((item) => ({
        tag: item.tag,
        count: item.count,
      }));
  }, [profile]);

  const masteryAvg = useMemo(() => {
    const points = profile?.mastery_timeline_last_10_attempts ?? [];
    const values = points
      .map((point) => point.mastery_probability)
      .filter((value): value is number => typeof value === "number");
    if (values.length === 0) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [profile]);

  const showEngagementGap =
    profile?.engagement_mastery_gap?.flagged ??
    (masteryAvg !== null &&
      typeof profile?.engagement_average_last_10 === "number" &&
      masteryAvg < 0.5 &&
      profile.engagement_average_last_10 >= 0.7);

  const quizVsChatSummary = useMemo(
    () => summarizeQuizVsChat(compareData, showEngagementGap),
    [compareData, showEngagementGap]
  );

  const focusAreas = profile?.focus_areas ?? [];
  const timeOnTaskTrends = profile?.engagement_metrics?.time_on_task_trends ?? [];
  const recentAttempts: RecentAttemptRow[] =
    profile?.recent_attempts ??
    (profile?.mastery_timeline_last_10_attempts ?? []).map((point) => ({
      topic_id: point.topic_id,
      is_correct: Boolean(point.is_correct),
      response_time_s: point.response_time_s,
      mastery_probability: point.mastery_probability,
      distractor_label: point.distractor_label,
      question_type: point.question_type,
      error_category: point.error_category,
      timestamp: point.timestamp,
    }));

  const metrics = useMemo(
    () => [
      {
        label: "Attempts",
        value: profile?.assessment_insights?.attempts_count ?? 0,
        tone: "default" as const,
      },
      {
        label: "Topics",
        value: profile?.topics_covered_count ?? 0,
        tone: "default" as const,
      },
      {
        label: "Frustration",
        value:
          profile?.engagement_metrics?.average_frustration_cue !== null &&
          profile?.engagement_metrics?.average_frustration_cue !== undefined
            ? profile.engagement_metrics.average_frustration_cue.toFixed(2)
            : "N/A",
        tone: "default" as const,
      },
      {
        label: "Mastered",
        value: rowBands.mastered,
        tone: "default" as const,
      },
      {
        label: "Learning",
        value: rowBands.learning,
        tone: "default" as const,
      },
      {
        label: "Needs support",
        value: rowBands.atRisk,
        tone: "danger" as const,
      },
      {
        label: "Not started",
        value: rowBands.notStarted,
        tone: "default" as const,
      },
      {
        label: "Engagement",
        value:
          profile?.engagement_average_last_10 !== null &&
          profile?.engagement_average_last_10 !== undefined
            ? `${Math.round(profile.engagement_average_last_10 * 100)}%`
            : "N/A",
        tone: "special" as const,
      },
      {
        label: "Focus areas",
        value: profile?.focus_areas_count ?? focusAreas.length,
        tone: "danger" as const,
      },
    ],
    [profile, rowBands, focusAreas.length]
  );

  return (
    <section
      aria-label="Student diagnostic deep dive"
      className="space-y-5 rounded-2xl border border-brand-special/20 bg-white p-5 shadow-[0_12px_40px_-24px_rgba(114,9,183,0.45)] sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-brand-special/10 pb-4">
        <div>
          <p
            className={cn(
              "text-xs font-semibold uppercase tracking-[0.16em]",
              EDUCATOR_PURPLE.text
            )}
          >
            Learner diagnostics
          </p>
          <h2 className="mt-1 text-xl font-semibold text-brand-text">
            Student Deep-Dive
          </h2>
          <p className="mt-1 text-sm text-brand-text/65">
            A simple view of how this learner is doing — progress, struggle spots, and what to help with next.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-9 max-w-full items-center gap-2 rounded-lg border border-brand-surface bg-brand-background px-3 text-sm font-medium text-brand-text outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-brand-primary/30">
            <span className="truncate">
              {selectedStudentName ?? "Select student"}
            </span>
            <ChevronDown className="size-4 shrink-0 opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 w-64">
            <DropdownMenuLabel>Learner</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={selectedStudentId ?? undefined}
              onValueChange={onStudentChange}
            >
              {studentIds.map((studentId) => (
                <DropdownMenuRadioItem key={studentId} value={studentId}>
                  {getStudentDisplayName(studentId, students)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error ? (
        <Card
          className={cn(
            "border",
            EDUCATOR_AT_RISK.borderSoft,
            EDUCATOR_AT_RISK.bgSoft
          )}
        >
          <CardContent className={cn("py-3 text-sm", EDUCATOR_AT_RISK.text)}>
            {error}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {metrics.map((metric) => (
          <MetricPill
            key={metric.label}
            label={metric.label}
            value={metric.value}
            tone={metric.tone}
          />
        ))}
      </div>

      <Card className="border-brand-surface">
        <CardHeader>
          <CardTitle className="text-base">
            Quiz progress vs chat activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-8 text-center text-sm text-brand-text/60">
              Loading learner profile…
            </p>
          ) : compareData.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text/60">
              No timeline data available for this learner yet.
            </p>
          ) : (
            <>
              <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-3 py-2.5 text-sm leading-relaxed text-brand-accent">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>{quizVsChatSummary}</p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={compareData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                    <XAxis dataKey="step" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="mastery"
                      name="Quiz mastery"
                      stroke="#00A8E8"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      name="Chat activity"
                      stroke="#7209B7"
                      strokeWidth={2.5}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <CollapsibleSection
        title="Recent Attempts"
        description="Latest quiz answers for this learner — what they got right or wrong, and common mistake patterns."
        badge={recentAttempts.length}
        defaultOpen={false}
        accent="primary"
      >
        {isLoading ? (
          <p className="py-4 text-sm text-brand-text/60">Loading attempts…</p>
        ) : (
          <RecentAttemptsTable attempts={recentAttempts} />
        )}
      </CollapsibleSection>

      <Card className="border-brand-surface">
        <CardHeader>
          <CardTitle className="text-base">Common mistakes</CardTitle>
          <CardDescription>
            Wrong answers this learner picks most often on quizzes.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-visible">
          {misconceptionData.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text/60">
              No distractor tags available yet.
            </p>
          ) : (
            <div ref={misconceptionChartRef} className="h-80 w-full overflow-visible">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={misconceptionData}
                  layout="vertical"
                  margin={{ top: 8, right: 24, bottom: 8, left: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="tag"
                    width={240}
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <Tooltip
                    content={(props) => (
                      <MisconceptionChartTooltip
                        active={props.active}
                        payload={
                          props.payload as MisconceptionTooltipProps["payload"]
                        }
                        coordinate={props.coordinate}
                        chartContainerRef={misconceptionChartRef}
                      />
                    )}
                    cursor={{ fill: "rgba(0, 168, 232, 0.08)" }}
                    isAnimationActive={false}
                  />
                  <Bar dataKey="count" fill="#FF6B35" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <CollapsibleSection
        title="Learner Focus Areas"
        description="A topic lands here when at least 2 of 3 signals fire: mastery below 45%, last 3 quiz/chat scores falling, or recent performance average below 40%."
        badge={focusAreas.length}
        defaultOpen={false}
        accent="special"
      >
        {isLoading ? (
          <p className="py-4 text-sm text-brand-text/60">Loading focus areas…</p>
        ) : (
          <FocusAreaList areas={focusAreas} />
        )}
      </CollapsibleSection>

      <Card className="border-brand-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Timer className="size-4 text-brand-primary" />
            Response Time Trends
          </CardTitle>
          <CardDescription>
            How long this learner takes on each skill. Longer times can mean they are unsure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-4 text-sm text-brand-text/60">Loading trends…</p>
          ) : (
            <TimeOnTaskList trends={timeOnTaskTrends} />
          )}
        </CardContent>
      </Card>

      <Card className="border-brand-surface">
        <CardHeader>
          <CardTitle className="text-base">Tutor help summary</CardTitle>
          <CardDescription>
            Topics they asked the tutor about. Critical confusion is a chat
            score below 30% — the card names the skill and the idea Socrates
            was checking, not just a stuck/help line.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="py-4 text-sm text-brand-text/60">Loading activity…</p>
          ) : (
            <TutoringActivitySummary profile={profile} />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
