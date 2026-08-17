"use client";

import { useMemo, useState } from "react";
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
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Flag,
} from "lucide-react";

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
import { countStudentTopicBands } from "@/lib/educator/bkt";
import { getStudentDisplayName } from "@/lib/educator/students";
import { EDUCATOR_AT_RISK, EDUCATOR_PURPLE } from "@/lib/educator/theme";
import { cn } from "@/lib/utils";
import { getPersonaById, resolvePersonaId } from "@/types";
import type { ClassroomStudentMeta, StudentProfileResponse } from "@/types/educator";

interface StudentDeepDiveProps {
  studentIds: readonly string[];
  students: readonly ClassroomStudentMeta[];
  selectedStudentId: string | null;
  topicIds: readonly string[];
  matrixRow?: Record<string, number | null>;
  profile: StudentProfileResponse | null;
  isLoading: boolean;
  error: string | null;
  onStudentChange: (studentId: string) => void;
}

function MetricPill({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-brand-surface bg-brand-background px-3 py-2">
      <p className="text-[0.68rem] uppercase tracking-wide text-brand-text/50">
        {label}
      </p>
      <p className="text-lg font-bold text-brand-text">{value}</p>
    </div>
  );
}

function ChatTurnAccordion({
  turns,
}: {
  turns: NonNullable<StudentProfileResponse["chat_history_last_5"]>;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (turns.length === 0) {
    return (
      <p className="text-sm text-brand-text/60">
        No Socratic transcript available for this learner yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {turns.map((turn, index) => {
        const isOpen = openIndex === index;
        const persona = turn.persona_id
          ? getPersonaById(resolvePersonaId(turn.persona_id))
          : null;
        const decayScore =
          typeof turn.interaction_score === "number"
            ? turn.interaction_score.toFixed(2)
            : "N/A";

        return (
          <div
            key={`${turn.timestamp ?? index}-${index}`}
            className="overflow-hidden rounded-xl border border-brand-surface bg-white"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-text">
                  Turn {index + 1}
                  {turn.critical_confusion ? (
                    <Badge className="ml-2 bg-red-600 text-white hover:bg-red-600">
                      Critical confusion
                    </Badge>
                  ) : null}
                </p>
                <p className="truncate text-xs text-brand-text/60">
                  {getCurriculumTitle(String(turn.topic_id ?? ""))}
                </p>
              </div>
              {isOpen ? (
                <ChevronUp className="size-4 shrink-0 text-brand-text/50" />
              ) : (
                <ChevronDown className="size-4 shrink-0 text-brand-text/50" />
              )}
            </button>

            {isOpen ? (
              <div className="space-y-3 border-t border-brand-surface px-4 py-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  {persona ? (
                    <Badge className="bg-brand-special text-white">
                      {persona.label}
                    </Badge>
                  ) : null}
                  <Badge variant="outline">Decay score: {decayScore}</Badge>
                  {turn.timestamp ? (
                    <Badge variant="outline">{turn.timestamp}</Badge>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-brand-text/50">
                    Student
                  </p>
                  <p className="text-brand-text">{turn.student_message ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-brand-text/50">
                    Socratic hint
                  </p>
                  <p className="text-brand-text">{turn.tutor_hint ?? "—"}</p>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function StudentDeepDive({
  studentIds,
  students = [],
  selectedStudentId,
  topicIds,
  matrixRow,
  profile,
  isLoading,
  error,
  onStudentChange,
}: StudentDeepDiveProps) {
  const selectedStudentName = selectedStudentId
    ? getStudentDisplayName(selectedStudentId, students)
    : null;
  const rowBands = countStudentTopicBands(matrixRow, topicIds);

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
    masteryAvg !== null &&
    typeof profile?.engagement_average_last_10 === "number" &&
    masteryAvg < 0.5 &&
    profile.engagement_average_last_10 >= 0.7;

  return (
    <section
      aria-label="Student diagnostic deep dive"
      className="space-y-5 rounded-2xl border border-brand-special/20 bg-white p-5 shadow-[0_12px_40px_-24px_rgba(114,9,183,0.45)] sm:p-6"
    >
      <div className="flex flex-col gap-4 border-b border-brand-special/10 pb-4">
        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-[0.16em]", EDUCATOR_PURPLE.text)}>
            Learner diagnostics
          </p>
          <h2 className="mt-1 text-xl font-semibold text-brand-text">
            Student Deep-Dive
          </h2>
          <p className="mt-1 text-sm text-brand-text/65">
            Mastery trajectory, misconceptions, and recent Socratic turns.
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
                  <span className="flex flex-col gap-0.5">
                    <span>{getStudentDisplayName(studentId, students)}</span>
                    <span className="font-mono text-[0.65rem] text-brand-text/45">
                      {studentId}
                    </span>
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {error ? (
        <Card className={cn("border", EDUCATOR_AT_RISK.borderSoft, EDUCATOR_AT_RISK.bgSoft)}>
          <CardContent className={cn("py-3 text-sm", EDUCATOR_AT_RISK.text)}>
            {error}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricPill
          label="Assessment attempts"
          value={profile?.assessment_insights?.attempts_count ?? 0}
        />
        <MetricPill
          label="Avg frustration cue"
          value={
            profile?.engagement_metrics?.average_frustration_cue !== null &&
            profile?.engagement_metrics?.average_frustration_cue !== undefined
              ? profile.engagement_metrics.average_frustration_cue.toFixed(2)
              : "N/A"
          }
        />
        <MetricPill label="Topics mastered" value={rowBands.mastered} />
        <MetricPill label="Topics learning" value={rowBands.learning} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricPill label="Topics at risk" value={rowBands.atRisk} />
        <MetricPill
          label="Engagement avg (last 10)"
          value={
            profile?.engagement_average_last_10 !== null &&
            profile?.engagement_average_last_10 !== undefined
              ? `${Math.round(profile.engagement_average_last_10 * 100)}%`
              : "N/A"
          }
        />
        <MetricPill
          label="Critical confusion turns"
          value={profile?.critical_confusion_turns?.length ?? 0}
        />
      </div>

      <Card className="border-brand-surface">
        <CardHeader>
          <CardTitle className="text-base">
            Mastery Timeline vs Conversational Engagement
          </CardTitle>
          <CardDescription>
            Official BKT mastery curve compared with chat interaction scores.
          </CardDescription>
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
              {showEngagementGap ? (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>
                    Student is participating well in dialogue but struggling with
                    formal assessments.
                  </p>
                </div>
              ) : null}
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
                      name="Official Mastery (BKT)"
                      stroke="#00A8E8"
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      name="Chat Engagement"
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

      <Card className="border-brand-surface">
        <CardHeader>
          <CardTitle className="text-base">Misconception Cloud</CardTitle>
          <CardDescription>
            Most frequent distractor tags selected during incorrect quiz
            attempts.
            {profile?.meta?.distractor_source ? (
              <span className="mt-1 block text-xs">
                Source: {profile.meta.distractor_source}
              </span>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {misconceptionData.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-text/60">
              No distractor tags available yet.
            </p>
          ) : (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={misconceptionData}
                  layout="vertical"
                  margin={{ left: 12, right: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="tag"
                    width={120}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FF6B35" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-brand-surface">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Flag className="size-4 text-brand-special" />
            Recent Socratic Turns
          </CardTitle>
          <CardDescription>
            Last five tutoring exchanges with persona, confusion flag, and decay
            score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatTurnAccordion turns={profile?.chat_history_last_5 ?? []} />
        </CardContent>
      </Card>
    </section>
  );
}
