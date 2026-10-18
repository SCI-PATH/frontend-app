"use client";

import { useMemo } from "react";
import {
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
import { SectionInfoHint } from "@/components/features/learner-analytics/educator/SectionInfoHint";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type MetricTone =
  | "attempts"
  | "topics"
  | "engagement"
  | "frustration"
  | "mastered"
  | "learning"
  | "support"
  | "focus";

const metricToneClass: Record<MetricTone, string> = {
  attempts: "border-blue-200 bg-blue-50 text-blue-800",
  topics: "border-cyan-200 bg-cyan-50 text-cyan-800",
  engagement: "border-brand-special/30 bg-brand-special/10 text-brand-special",
  frustration: "border-brand-accent/30 bg-brand-accent/10 text-brand-accent",
  mastered: "border-brand-secondary/50 bg-brand-secondary/15 text-green-800",
  learning: "border-brand-primary/30 bg-brand-primary/10 text-brand-primary",
  support: "border-red-200 bg-red-50 text-red-800",
  focus: "border-rose-200 bg-rose-50 text-rose-700",
};

function MetricPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: MetricTone;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-full border px-2.5 py-1",
        metricToneClass[tone]
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide opacity-75">
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
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
  gapFlagged: boolean,
  skillTitle: string | null
): string {
  const quiz = points
    .map((point) => point.mastery)
    .filter((value): value is number => value !== null);
  const chat = points
    .map((point) => point.engagement)
    .filter((value): value is number => value !== null);
  const quizAvg = average(quiz);
  const chatAvg = average(chat);
  const skillBit = skillTitle
    ? ` on ${skillTitle}`
    : " across recent skills";
  const reteachBit = skillTitle
    ? ` Plan a short reteach of ${skillTitle}.`
    : " Use Learner focus areas and Recent attempts below to pick which skill to reteach.";

  if (quizAvg === null && chatAvg === null) {
    return "No quiz or tutor-chat scores yet for this learner.";
  }
  if (quizAvg === null) {
    return `Tutor chat scores average ${Math.round(chatAvg!)}% so far${skillBit}. Quiz mastery has not appeared on this chart yet.`;
  }
  if (chatAvg === null) {
    const direction = seriesDirection(quiz);
    if (direction === "up") {
      return `Quiz mastery is rising and currently averages ${Math.round(quizAvg)}%${skillBit}. No tutor chat scores yet.`;
    }
    if (direction === "down") {
      return `Quiz mastery has slipped and currently averages ${Math.round(quizAvg)}%${skillBit}. No tutor chat scores yet.`;
    }
    return `Quiz mastery is holding around ${Math.round(quizAvg)}%${skillBit}. No tutor chat scores yet.`;
  }
  if (gapFlagged) {
    return `This learner chats well with the tutor (about ${Math.round(chatAvg)}%), but recent quiz mastery is still low (about ${Math.round(quizAvg)}%)${skillBit}. Check whether they can do the work without the tutor.`;
  }
  const quizDirection = seriesDirection(quiz);
  if (quizAvg >= 70 && chatAvg >= 60) {
    return `Quiz mastery (about ${Math.round(quizAvg)}%) and tutor chat scores (about ${Math.round(chatAvg)}%) both look healthy${skillBit}. Keep regular practice going.`;
  }
  if (quizAvg < 50 && chatAvg < 50) {
    return `Quiz mastery (about ${Math.round(quizAvg)}%) and tutor chat scores (about ${Math.round(chatAvg)}%) are both on the low side${skillBit}.${reteachBit}`;
  }
  if (quizDirection === "up") {
    return `Quiz mastery is trending up (about ${Math.round(quizAvg)}%)${skillBit}. Tutor chat scores average about ${Math.round(chatAvg)}%. Keep checking that quiz gains hold without tutor help.`;
  }
  if (quizDirection === "down") {
    return `Quiz mastery is trending down (about ${Math.round(quizAvg)}%)${skillBit}. Tutor chat scores average about ${Math.round(chatAvg)}%. Follow up before the drop continues.`;
  }
  return `Quiz mastery averages about ${Math.round(quizAvg)}%; tutor chat scores average about ${Math.round(chatAvg)}%${skillBit}. Use the chart to see whether quizzes and chat are moving together.`;
}

function singleSkillTitle(
  attempts: { topic_id?: string | null }[],
  turns: { topic_id?: string | null }[]
): string | null {
  const ids = [...attempts, ...turns]
    .map((row) => String(row.topic_id ?? "").trim())
    .filter(Boolean);
  if (ids.length === 0) return null;
  const unique = new Set(ids);
  if (unique.size !== 1) return null;
  return getCurriculumTitle([...unique][0]);
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
    /^(?:help(?: me)?|idk|i don['’]?t (?:get|understand|know)(?: this| it)?|give up|(?:please\s+)?(?:give|show|tell)\s+me\s+(?:a\s+)?hint|hint(?:\s+please)?|(?:can|could|may)\s+i\s+(?:have|get)\s+(?:a\s+)?hint|i\s+need\s+(?:a\s+)?hint)(?:\s*[.!?…]*)?$/i.test(
      withoutEmoji
    )
  ) {
    return true;
  }
  return false;
}

function plainStudentLine(text?: string | null): string {
  return (text ?? "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isHintRequest(text?: string | null): boolean {
  return /^(?:(?:please\s+)?(?:give|show|tell)\s+me\s+(?:a\s+)?hint|hint(?:\s+please)?|(?:can|could|may)\s+i\s+(?:have|get)\s+(?:a\s+)?hint|i\s+need\s+(?:a\s+)?hint)(?:\s*[.!?…]*)?$/i.test(
    plainStudentLine(text)
  );
}

function tutorPrompt(
  hint?: string | null
): { kind: "asked" | "replied"; text: string } | null {
  const trimmed = (hint ?? "").replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  const questions = trimmed.match(/[^?]*\?/g);
  if (questions && questions.length > 0) {
    const question = clipStudentMessage(questions[questions.length - 1].trim(), 160);
    if (question) return { kind: "asked", text: question };
  }
  const reply = clipStudentMessage(trimmed, 140);
  if (!reply) return null;
  return { kind: "replied", text: reply };
}

function withinMinutes(
  a?: string | null,
  b?: string | null,
  minutes = 20
): boolean {
  if (!a || !b) return false;
  const left = Date.parse(a);
  const right = Date.parse(b);
  if (Number.isNaN(left) || Number.isNaN(right)) return false;
  return Math.abs(left - right) <= minutes * 60 * 1000;
}

function clusterStuckTurns(turns: ChatHistoryTurn[]): ChatHistoryTurn[][] {
  const sorted = [...turns].sort((a, b) =>
    String(a.timestamp ?? "").localeCompare(String(b.timestamp ?? ""))
  );
  const clusters: ChatHistoryTurn[][] = [];
  for (const turn of sorted) {
    const current = clusters.at(-1);
    const previous = current?.at(-1);
    if (
      current &&
      previous &&
      sameTopic(previous.topic_id, turn.topic_id) &&
      withinMinutes(previous.timestamp, turn.timestamp)
    ) {
      current.push(turn);
    } else {
      clusters.push([turn]);
    }
  }
  return clusters;
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

function formatErrorCategory(
  value: string | null | undefined,
  isCorrect: boolean
): string {
  if (!value || value === "NO_ERROR") {
    return isCorrect || value === "NO_ERROR" ? "None" : "N/A";
  }
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
                <td
                  className="px-3 py-2 text-brand-text/70"
                  title={
                    !row.error_category && !row.is_correct
                      ? "Multiple-choice and true/false items don't use an error category."
                      : undefined
                  }
                >
                  {formatErrorCategory(row.error_category, row.is_correct)}
                </td>
                <td className="max-w-[8rem] px-3 py-2 text-brand-text/70">
                  {row.distractor_label || "None"}
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
  const stuckEpisodes = useMemo(
    () => clusterStuckTurns(confusionTurns),
    [confusionTurns]
  );
  const confusionCount = stuckEpisodes.length;
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
          {recentTurns.length} recent chat
          {recentTurns.length === 1 ? "" : "s"}
        </Badge>
        {confusionCount > 0 ? (
          <Badge className="bg-red-600 text-white hover:bg-red-600">
            {confusionCount} stuck chat
            {confusionCount === 1 ? "" : "s"}
          </Badge>
        ) : (
          <Badge className="bg-brand-secondary/20 text-brand-text hover:bg-brand-secondary/20">
            No stuck chats
          </Badge>
        )}
      </div>
      {recentTopics.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/50">
            Recent topics
          </p>
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
        </div>
      ) : null}
      {confusionCount > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/50">
            Where they got stuck
          </p>
          <ul className="space-y-2">
            {stuckEpisodes.map((episode, index) => {
              const topicId = String(episode[0]?.topic_id ?? "");
              const quotes: string[] = [];
              let askedForHint = false;
              let saidTheyWereStuck = false;
              for (const turn of episode) {
                if (isHintRequest(turn.student_message)) {
                  askedForHint = true;
                  const prior = findPriorScienceLine(turn, history);
                  if (prior && !quotes.includes(prior)) quotes.push(prior);
                  continue;
                }
                if (isLowInsightStudentLine(turn.student_message)) {
                  saidTheyWereStuck = true;
                  const prior = findPriorScienceLine(turn, history);
                  if (prior && !quotes.includes(prior)) quotes.push(prior);
                  continue;
                }
                const line = clipStudentMessage(turn.student_message, 140);
                if (line && !quotes.includes(line)) quotes.push(line);
              }
              let tutor = episode
                .map((turn) => tutorPrompt(turn.tutor_hint))
                .find((prompt) => prompt?.kind === "asked") ?? null;
              if (!tutor) {
                tutor =
                  episode
                    .map((turn) => tutorPrompt(turn.tutor_hint))
                    .find((prompt) => prompt !== null) ?? null;
              }
              if (!tutor) {
                const fallback = [...history]
                  .reverse()
                  .find(
                    (row) =>
                      sameTopic(row.topic_id, topicId) &&
                      Boolean(row.tutor_hint?.trim())
                  );
                tutor = tutorPrompt(fallback?.tutor_hint);
              }
              const scores = episode
                .map((turn) => turn.interaction_score)
                .filter((score): score is number => typeof score === "number");
              const score =
                scores.length > 0
                  ? Math.round(Math.min(...scores) * 100)
                  : null;
              const when = episode.find((turn) => turn.timestamp)?.timestamp;
              return (
                <li
                  key={`${topicId}-${when ?? index}`}
                  className="rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-brand-text">
                      {topicId ? getCurriculumTitle(topicId) : "Unknown skill"}
                    </p>
                    {score !== null ? (
                      <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                        {score}% chat
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-[0.65rem] text-brand-text/55">
                    Struggling in this chat
                    {when ? ` · ${formatEducatorTimestamp(when)}` : ""}
                  </p>
                  {quotes.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {quotes.map((quote) => (
                        <p key={quote} className="text-sm text-brand-text">
                          <span className="font-semibold text-brand-text/70">
                            They said{" "}
                          </span>
                          “{quote}”
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-brand-text/75">
                      {askedForHint
                        ? "They asked for a hint and didn’t name the idea."
                        : "They said they were stuck and didn’t name the idea."}
                    </p>
                  )}
                  {quotes.length > 0 && askedForHint ? (
                    <p className="mt-1 text-xs text-brand-text/60">
                      Then they asked for a hint.
                    </p>
                  ) : null}
                  {quotes.length > 0 && saidTheyWereStuck && !askedForHint ? (
                    <p className="mt-1 text-xs text-brand-text/60">
                      They also said they were stuck.
                    </p>
                  ) : null}
                  {tutor ? (
                    <p className="mt-2 text-sm text-brand-text">
                      <span className="font-semibold text-brand-text/70">
                        {tutor.kind === "asked" ? "Tutor asked " : "Tutor replied "}
                      </span>
                      {tutor.text}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
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

  const quizVsChatSkill = useMemo(
    () =>
      singleSkillTitle(
        profile?.mastery_timeline_last_10_attempts ?? [],
        profile?.engagement_timeline_last_10_turns ?? []
      ),
    [profile]
  );

  const quizVsChatSummary = useMemo(
    () => summarizeQuizVsChat(compareData, showEngagementGap, quizVsChatSkill),
    [compareData, showEngagementGap, quizVsChatSkill]
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

  const snapshot = useMemo(() => {
    const frustration =
      profile?.engagement_metrics?.average_frustration_cue !== null &&
      profile?.engagement_metrics?.average_frustration_cue !== undefined
        ? profile.engagement_metrics.average_frustration_cue.toFixed(2)
        : "N/A";
    const engagement =
      profile?.engagement_average_last_10 !== null &&
      profile?.engagement_average_last_10 !== undefined
        ? `${Math.round(profile.engagement_average_last_10 * 100)}%`
        : "N/A";

    return {
      activity: [
        {
          label: "Attempts",
          value: profile?.assessment_insights?.attempts_count ?? 0,
          tone: "attempts" as const,
        },
        {
          label: "Topics",
          value: profile?.topics_covered_count ?? 0,
          tone: "topics" as const,
        },
        { label: "Engagement", value: engagement, tone: "engagement" as const },
        { label: "Frustration", value: frustration, tone: "frustration" as const },
      ],
      skills: [
        { label: "Mastered", value: rowBands.mastered, tone: "mastered" as const },
        { label: "Learning", value: rowBands.learning, tone: "learning" as const },
        {
          label: "Needs support",
          value: rowBands.atRisk,
          tone: "support" as const,
        },
        {
          label: "Focus areas",
          value: profile?.focus_areas_count ?? focusAreas.length,
          tone: "focus" as const,
        },
      ],
      notStarted: rowBands.notStarted,
    };
  }, [profile, rowBands, focusAreas.length]);

  return (
    <section
      aria-label="Student diagnostic deep dive"
      className="space-y-5 rounded-2xl border border-brand-special/20 bg-white p-5 shadow-[0_12px_40px_-24px_rgba(114,9,183,0.45)] sm:p-6"
    >
      <div className="flex flex-col gap-3 border-b border-brand-special/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
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
          <DropdownMenuTrigger className="inline-flex h-9 w-64 max-w-full shrink-0 items-center justify-between gap-2 self-start rounded-lg border border-brand-surface bg-brand-background px-3 text-sm font-medium text-brand-text outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-brand-primary/30">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-text/45">
            Activity
          </p>
          <div className="flex flex-wrap gap-1.5">
            {snapshot.activity.map((metric) => (
              <MetricPill
                key={metric.label}
                label={metric.label}
                value={metric.value}
                tone={metric.tone}
              />
            ))}
          </div>
        </div>
        <div className="min-w-0 sm:flex sm:flex-col sm:items-end">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-brand-text/45">
            Skills
          </p>
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {snapshot.skills.map((metric) => (
              <MetricPill
                key={metric.label}
                label={metric.label}
                value={metric.value}
                tone={metric.tone}
              />
            ))}
          </div>
          <p className="mt-1.5 text-xs text-brand-text/50 sm:text-right">
            {snapshot.notStarted} not started
          </p>
        </div>
      </div>

      <Card className="border-brand-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5 text-base">
            Quiz progress vs chat activity
            <SectionInfoHint text="Last ~10 quiz P(L) values and last ~10 tutor chat scores for this learner. Points are recent events in order — they can mix skills, and the two lines are not the same item." />
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
        descriptionAsHint
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
          <CardTitle className="flex items-center gap-1.5 text-base">
            Common mistakes
            <SectionInfoHint text="Wrong answers this learner picks most often on quizzes." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          {misconceptionData.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text/60">
              No distractor tags available yet.
            </p>
          ) : (
            <ol className="space-y-2">
              {misconceptionData.map((item, index) => (
                <li
                  key={item.tag}
                  className="flex items-start gap-3 rounded-xl border border-brand-accent/20 bg-brand-accent/5 px-3 py-2.5"
                >
                  <span className="mt-0.5 w-5 shrink-0 text-xs font-bold tabular-nums text-brand-text/35">
                    {index + 1}
                  </span>
                  <p className="min-w-0 flex-1 text-sm leading-relaxed text-brand-text">
                    {item.tag}
                  </p>
                  <span className="shrink-0 rounded-full bg-brand-accent px-2 py-0.5 text-[0.65rem] font-semibold text-white">
                    {item.count} time{item.count === 1 ? "" : "s"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      <CollapsibleSection
        title="Learner Focus Areas"
        description="A topic lands here when at least 2 of 3 signals fire: mastery below 45%, last 3 quiz/chat scores falling, or recent performance average below 40%."
        descriptionAsHint
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
            <span className="inline-flex items-center gap-1.5">
              Response Time Trends
              <SectionInfoHint text="How long this learner takes on each skill. Longer times can mean they are unsure." />
            </span>
          </CardTitle>
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
          <CardTitle className="flex items-center gap-1.5 text-base">
            Tutor help summary
            <SectionInfoHint text="Chats scored below 30%. Each card is one stuck moment: the skill, what the learner said, and what the tutor asked or replied." />
          </CardTitle>
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
