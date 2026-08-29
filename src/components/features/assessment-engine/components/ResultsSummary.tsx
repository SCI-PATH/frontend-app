"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { fetchSessionDetail } from "../api/history";
import {
  countAnsweredInResults,
  fetchQuizResults,
  fetchQuizResultsWhenReady,
  mergeQuizResults,
} from "../api/quizzes";
import { asPromptString } from "../api/normalizeQuestion";
import type {
  AttemptRecord,
  ClientQuestionSnapshot,
  NestedPrompt,
  QuizResults,
  SessionDetail,
  SessionDetailItem,
  SessionDetailQuestion,
} from "../types";
import { AssessmentApiError } from "../types";
import {
  attemptIsCorrect,
  collectAttemptHistory,
  computeAttemptStats,
} from "../utils/attemptStats";

interface ResultsSummaryProps {
  sessionId: string;
  studentId?: string;
  results?: QuizResults | null;
  expectedQuestionCount?: number;
  clientSnapshots?: Record<string, ClientQuestionSnapshot>;
  onRetry?: () => void;
  showRetry?: boolean;
  showHistoryLink?: boolean;
  /** Pre-loaded session detail (e.g. from history page). */
  initialDetail?: SessionDetail | null;
}

type EnrichedAttempt = {
  attempt: AttemptRecord;
  prompt: string;
  studentAnswerDisplay: string;
  correctAnswerDisplay: string;
  options?: Record<string, string>;
};

function formatTag(tag: string | null | undefined): string | null {
  if (!tag) return null;
  return tag
    .split("_")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ");
}

function asDistractorLabel(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function uniqueLines(
  ...values: Array<string | null | undefined>
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const text = asDistractorLabel(value);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

export function sessionDetailToQuizResults(
  sessionId: string,
  detail: SessionDetail
): QuizResults {
  const history = collectAttemptHistory(null, detail);
  const session = detail.session;
  return {
    session_id: sessionId,
    status: detail.status ?? session?.status,
    history,
    total_answered: history.length,
    correct_count: history.filter((item) => attemptIsCorrect(item)).length,
    max_questions: session?.max_questions,
    questions_asked: session?.questions_asked,
    score: detail.score ?? detail.accuracy,
    accuracy: detail.accuracy ?? detail.score,
  };
}

function isPartial(attempt: AttemptRecord): boolean {
  if (attemptIsCorrect(attempt)) return false;
  const cat = (attempt.error_category || "").toUpperCase();
  if (cat === "PARTIAL_MASTERY") return true;
  if (
    attempt.missed_blanks &&
    Object.keys(attempt.missed_blanks).length > 0 &&
    (attempt.accuracy_score ?? 0) > 0
  ) {
    return true;
  }
  // ShortAnswer / MultiBlank with some credit but below pass bar
  const score =
    typeof attempt.accuracy_score === "number" ? attempt.accuracy_score : 0;
  const normalized = score > 1 ? score / 100 : score;
  return normalized > 0 && normalized < 0.8;
}

function asOptions(
  value: unknown
): Record<string, string> | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string" && v.trim()) out[k.toUpperCase()] = v.trim();
  }
  return Object.keys(out).length ? out : undefined;
}

function formatExpected(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  if (Array.isArray(raw)) {
    return raw
      .map((item, i) => {
        const text = typeof item === "string" ? item : String(item);
        return `Blank ${i + 1}: ${text}`;
      })
      .join(" · ");
  }
  if (typeof raw === "object") {
    return Object.entries(raw as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(" · ");
  }
  return String(raw);
}

function formatStudentAnswer(
  answer: string,
  questionType?: string | null,
  options?: Record<string, string>
): string {
  const trimmed = answer.trim();
  if (!trimmed) return "";

  const type = String(questionType || "").toLowerCase().replace(/[_\s-]/g, "");

  if (type === "mcq" || type === "multiplechoice") {
    return resolveChoiceText(trimmed, options);
  }

  if (type === "truefalse" || type === "tf") {
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("t")) return "True";
    if (lower.startsWith("f")) return "False";
    return trimmed;
  }

  if (type === "multiblank" || type === "fillintheblank") {
    // Frontend serializes MultiBlank as "a | b | c"
    const parts = trimmed
      .split(/\s*\|\s*/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length > 1) {
      return parts.map((p, i) => `Blank ${i + 1}: ${p}`).join(" · ");
    }
    return trimmed;
  }

  // ShortAnswer and unknown — show as written
  return trimmed;
}

function formatCorrectAnswer(
  expectedFormatted: string,
  questionType?: string | null,
  options?: Record<string, string>
): string {
  const trimmed = expectedFormatted.trim();
  if (!trimmed) return "";

  const type = String(questionType || "").toLowerCase().replace(/[_\s-]/g, "");

  if (type === "mcq" || type === "multiplechoice") {
    return resolveChoiceText(trimmed, options) || trimmed;
  }

  if (type === "truefalse" || type === "tf") {
    const lower = trimmed.toLowerCase();
    if (lower.startsWith("t")) return "True";
    if (lower.startsWith("f")) return "False";
    return trimmed;
  }

  return trimmed;
}

function resolveChoiceText(
  answer: string,
  options?: Record<string, string>
): string {
  const trimmed = answer.trim();
  if (!trimmed) return "";
  if (!options) return trimmed;

  const letter = trimmed.toUpperCase();
  // Single letter A–D (or longer keys)
  if (options[letter]) {
    return `${letter}. ${options[letter]}`;
  }
  // "A. text" already — keep
  const match = trimmed.match(/^([A-Da-d])\s*[.):\-]\s*(.*)$/);
  if (match) {
    const key = match[1].toUpperCase();
    if (options[key]) return `${key}. ${options[key]}`;
  }

  return trimmed;
}

function questionPrompt(q?: SessionDetailQuestion): string {
  if (!q) return "";
  if (q.payload) {
    const fromPayload = asPromptString(q.payload as NestedPrompt);
    if (fromPayload) return fromPayload;
  }
  if (q.prompt) return asPromptString(q.prompt);
  return "";
}

function questionOptions(q?: SessionDetailQuestion): Record<string, string> | undefined {
  if (!q) return undefined;
  return asOptions(q.payload?.options) ?? asOptions(q.options);
}

function isDetailItem(item: unknown): item is SessionDetailItem {
  return Boolean(item && typeof item === "object" && ("attempt" in item || "question" in item));
}

function enrichFromDetail(
  history: AttemptRecord[],
  detail: SessionDetail | null,
  clientSnapshots?: Record<string, ClientQuestionSnapshot>
): EnrichedAttempt[] {
  const items = (detail?.items ?? detail?.answers ?? []) as unknown[];
  const byId = new Map<string, SessionDetailItem>();

  for (const item of items) {
    if (!isDetailItem(item)) continue;
    const id =
      item.attempt?.question_id ||
      item.question?.id ||
      item.question?.question_id;
    if (id) byId.set(id, item);
  }

  return history.map((attempt) => {
    const detailItem = byId.get(attempt.question_id);
    const q = detailItem?.question;
    const snapshot = clientSnapshots?.[attempt.question_id];
    const options =
      questionOptions(q) ?? asOptions(snapshot?.options);
    const expectedRaw =
      detailItem?.expected_answer ??
      q?.payload?.correct_answer ??
      q?.payload?.ideal_answer ??
      q?.payload?.answers;
    const expectedFormatted = formatExpected(expectedRaw);
    const studentRaw = attempt.student_answer ?? detailItem?.student_answer ?? "";

    return {
      attempt,
      prompt:
        questionPrompt(q) ||
        snapshot?.prompt ||
        (attempt.sub_concept
          ? `Question on ${attempt.sub_concept}`
          : `Question (${attempt.question_type || snapshot?.question_type || "item"})`),
      studentAnswerDisplay:
        formatStudentAnswer(
          studentRaw,
          String(attempt.question_type || q?.question_type || snapshot?.question_type || ""),
          options
        ) || "—",
      correctAnswerDisplay:
        formatCorrectAnswer(
          expectedFormatted,
          String(attempt.question_type || q?.question_type || snapshot?.question_type || ""),
          options
        ) ||
        expectedFormatted ||
        "—",
      options,
    };
  });
}

function AttemptReviewCard({
  item,
  index,
}: {
  item: EnrichedAttempt;
  index: number;
}) {
  const { attempt } = item;
  const correct = attemptIsCorrect(attempt);
  const partial = !correct && isPartial(attempt);
  const variant = correct ? "correct" : partial ? "partial" : "incorrect";
  const tagLabel = formatTag(attempt.distractor_tag);
  const distractorLabel = asDistractorLabel(attempt.distractor_label);
  const feedbackLine = asDistractorLabel(attempt.feedback);
  const extraExplanationLines = uniqueLines(
    attempt.detailed_explanation,
    attempt.concept_explanation
  ).filter((line) => {
    const lower = line.toLowerCase();
    if (distractorLabel && lower === distractorLabel.toLowerCase()) return false;
    if (feedbackLine) {
      const fb = feedbackLine.toLowerCase();
      if (lower === fb || fb.includes(lower)) return false;
    }
    return true;
  });
  const blankEntries =
    attempt.missed_blanks && typeof attempt.missed_blanks === "object"
      ? Object.entries(attempt.missed_blanks)
      : [];
  const showDiagnostics = variant !== "correct";
  const accuracyPct = Math.round(
    (typeof attempt.accuracy_score === "number"
      ? attempt.accuracy_score > 1
        ? attempt.accuracy_score
        : attempt.accuracy_score * 100
      : correct
        ? 100
        : partial
          ? 50
          : 0) as number
  );

  const styles = {
    correct: {
      border: "border-brand-secondary/30",
      accent: "border-l-brand-secondary bg-brand-secondary/5",
      badge: "bg-brand-secondary/20 text-brand-text",
      icon: CheckCircle2,
      iconWrap: "bg-brand-secondary/15 text-brand-secondary ring-brand-secondary/25",
      index: "bg-brand-secondary/15 text-brand-secondary",
      label: "Correct",
    },
    partial: {
      border: "border-brand-primary/25",
      accent: "border-l-brand-primary bg-brand-primary/5",
      badge: "bg-brand-primary/15 text-brand-primary",
      icon: AlertCircle,
      iconWrap: "bg-brand-primary/15 text-brand-primary ring-brand-primary/25",
      index: "bg-brand-primary/10 text-brand-primary",
      label: "Partial credit",
    },
    incorrect: {
      border: "border-brand-accent/25",
      accent: "border-l-brand-accent bg-brand-accent/5",
      badge: "bg-brand-accent/15 text-brand-accent",
      icon: XCircle,
      iconWrap: "bg-brand-accent/15 text-brand-accent ring-brand-accent/25",
      index: "bg-brand-accent/10 text-brand-accent",
      label: "Incorrect",
    },
  }[variant];

  const StatusIcon = styles.icon;

  return (
    <article
      className={`overflow-hidden rounded-2xl border border-l-[5px] bg-white shadow-[0_12px_40px_-24px_rgba(0,168,232,0.45)] ${styles.border} ${styles.accent}`}
    >
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold tabular-nums ${styles.index}`}
            >
              {index + 1}
            </span>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {attempt.question_type ? (
                  <Badge
                    variant="outline"
                    className="border-brand-surface/80 bg-white text-xs font-medium text-brand-text/70"
                  >
                    {String(attempt.question_type)}
                  </Badge>
                ) : null}
                {attempt.chapter_name ? (
                  <span className="truncate text-xs text-brand-text/50">
                    {attempt.chapter_name}
                    {attempt.sub_concept ? ` · ${attempt.sub_concept}` : ""}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!correct && typeof attempt.accuracy_score === "number" ? (
              <span className="rounded-full bg-brand-background px-2.5 py-1 text-xs font-semibold tabular-nums text-brand-text/60">
                {accuracyPct}%
              </span>
            ) : null}
            <Badge className={`gap-1 px-2.5 py-1 ${styles.badge}`}>
              <StatusIcon className="size-3.5" aria-hidden />
              {styles.label}
            </Badge>
          </div>
        </div>

        <p className="text-[1.05rem] font-semibold leading-snug tracking-tight text-brand-text">
          {item.prompt}
        </p>

        <div
          className={`mt-5 grid gap-3 ${variant !== "correct" ? "sm:grid-cols-2" : ""}`}
        >
          <div
            className={
              variant === "correct"
                ? "rounded-xl border border-brand-secondary/20 bg-brand-secondary/8 px-4 py-3"
                : "rounded-xl border border-brand-surface bg-brand-background/60 px-4 py-3"
            }
          >
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-brand-text/45">
              Your answer
            </p>
            <p className="mt-1.5 text-sm font-medium leading-relaxed text-brand-text">
              {item.studentAnswerDisplay}
            </p>
          </div>
          {variant !== "correct" ? (
            <div className="rounded-xl border border-brand-secondary/25 bg-brand-secondary/8 px-4 py-3">
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-brand-secondary">
                Correct answer
              </p>
              <p className="mt-1.5 text-sm font-semibold leading-relaxed text-brand-text">
                {item.correctAnswerDisplay}
              </p>
            </div>
          ) : null}
        </div>

        {showDiagnostics ? (
          <div className="mt-5 space-y-3 rounded-xl border border-brand-surface/80 bg-brand-background/40 px-4 py-4">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-text/45">
              <Target className="size-3.5" aria-hidden />
              What to learn from this
            </p>

            {distractorLabel ? (
              <p className="text-base font-medium leading-relaxed text-brand-text">
                {distractorLabel}
              </p>
            ) : null}

            {tagLabel ? (
              <p className="text-sm text-brand-text/75">
                <span className="font-semibold text-brand-text">
                  Mistake type:{" "}
                </span>
                {tagLabel}
              </p>
            ) : null}

            {feedbackLine &&
            feedbackLine.toLowerCase() !== (distractorLabel?.toLowerCase() ?? "") ? (
              <p className="text-sm font-medium text-brand-text/85">
                {feedbackLine}
              </p>
            ) : null}

            {attempt.error_category ? (
              <p className="text-sm text-brand-text/85">
                <span className="font-semibold text-brand-text">Category: </span>
                {formatTag(attempt.error_category) ?? attempt.error_category}
              </p>
            ) : null}

            {extraExplanationLines.map((line) => (
              <p key={line} className="text-sm leading-relaxed text-brand-text/90">
                {line}
              </p>
            ))}

            {blankEntries.length > 0 ? (
              <ul className="grid gap-2 sm:grid-cols-2">
                {blankEntries.map(([blank, note]) => (
                  <li
                    key={blank}
                    className="rounded-lg border border-brand-surface bg-white px-3 py-2 text-sm text-brand-text/85"
                  >
                    <span className="font-semibold text-brand-text">
                      Blank {blank}:{" "}
                    </span>
                    {note}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : variant === "correct" && attempt.feedback ? (
          <p className="mt-4 text-sm text-brand-text/60">{attempt.feedback}</p>
        ) : null}
      </div>
    </article>
  );
}

function QuestionReviewCarousel({ items }: { items: EnrichedAttempt[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [items.length]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") {
        setIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowRight") {
        setIndex((i) => Math.min(items.length - 1, i + 1));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-brand-secondary/25 bg-brand-secondary/10 px-5 py-10 text-center">
        <CheckCircle2
          className="mx-auto size-10 text-brand-secondary"
          aria-hidden
        />
        <p className="mt-3 text-base font-semibold text-brand-text">
          No questions to review
        </p>
        <p className="mt-1 text-sm text-brand-text/55">
          Your attempt history will show up here after you finish a quiz.
        </p>
      </div>
    );
  }

  const atStart = index === 0;
  const atEnd = index === items.length - 1;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-center gap-2 px-1">
        {items.map((item, i) => {
          const ok = attemptIsCorrect(item.attempt);
          const partial = !ok && isPartial(item.attempt);
          const dotClass = ok
            ? "bg-brand-secondary ring-brand-secondary/30"
            : partial
              ? "bg-brand-primary ring-brand-primary/30"
              : "bg-brand-accent ring-brand-accent/30";
          const isActive = i === index;
          return (
            <button
              key={item.attempt.question_id || i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Go to question ${i + 1}`}
              aria-current={isActive ? "step" : undefined}
              className={`size-2.5 rounded-full transition-all ${dotClass} ${
                isActive
                  ? "ring-2 ring-offset-2 scale-125"
                  : "opacity-60 hover:opacity-100"
              }`}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 px-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={atStart}
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          aria-label="Previous question"
          className="size-11 shrink-0 rounded-xl border-brand-surface shadow-sm"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Button>
        <p className="text-sm font-semibold tabular-nums text-brand-text/70">
          Question{" "}
          <span className="text-brand-text">{index + 1}</span>
          <span className="text-brand-text/40"> / </span>
          {items.length}
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={atEnd}
          onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
          aria-label="Next question"
          className="size-11 shrink-0 rounded-xl border-brand-surface shadow-sm"
        >
          <ChevronRight className="size-5" aria-hidden />
        </Button>
      </div>

      <AttemptReviewCard item={items[index]} index={index} />
    </div>
  );
}

function ScoreStat({
  label,
  value,
  sub,
  accent = "primary",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: "primary" | "secondary" | "accent";
}) {
  const ring =
    accent === "secondary"
      ? "from-brand-secondary/20 to-brand-secondary/5"
      : accent === "accent"
        ? "from-brand-accent/20 to-brand-accent/5"
        : "from-brand-primary/20 to-brand-primary/5";
  return (
    <div
      className={`rounded-2xl border border-brand-surface/80 bg-gradient-to-b ${ring} px-4 py-4 text-center`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-text/50">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-brand-text">
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-xs text-brand-text/55">{sub}</p>
      ) : null}
    </div>
  );
}

export function ResultsSummary({
  sessionId,
  studentId,
  results: initialResults,
  expectedQuestionCount = 0,
  clientSnapshots = {},
  onRetry,
  showRetry = true,
  showHistoryLink = true,
  initialDetail = null,
}: ResultsSummaryProps) {
  const expected =
    expectedQuestionCount ||
    initialResults?.max_questions ||
    initialResults?.total_answered ||
    Object.keys(clientSnapshots).length ||
    0;
  const hasInitialReview = Boolean(initialResults?.history?.length);

  const [results, setResults] = useState<QuizResults | null>(
    initialResults ?? null
  );
  const [detail, setDetail] = useState<SessionDetail | null>(initialDetail);
  const [loading, setLoading] = useState(!hasInitialReview);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!hasInitialReview) {
        setLoading(true);
      }
      setError(null);
      try {
        let quizResults: QuizResults = initialResults ?? {
          session_id: sessionId,
          history: [],
        };

        try {
          let serverResults = await fetchQuizResults(sessionId);
          if (
            expected > 0 &&
            countAnsweredInResults(serverResults) < expected &&
            countAnsweredInResults(initialResults ?? { session_id: sessionId }) >=
              expected
          ) {
            serverResults = await fetchQuizResultsWhenReady(sessionId, expected, {
              maxAttempts: 2,
              delayMs: 200,
            });
          }
          quizResults = initialResults?.history?.length
            ? mergeQuizResults(serverResults, initialResults)
            : serverResults;
        } catch (err) {
          if (!initialResults?.history?.length) {
            throw err;
          }
        }

        if (cancelled) return;
        setResults(quizResults);

        if (initialDetail) {
          setDetail(initialDetail);
        } else if (studentId) {
          void fetchSessionDetail(studentId, sessionId)
            .then((sessionDetail) => {
              if (!cancelled) setDetail(sessionDetail);
            })
            .catch(() => {
              if (!cancelled) setDetail(null);
            });
        }
      } catch (err) {
        if (cancelled) return;
        if (initialResults?.history?.length) {
          setResults(initialResults);
        } else {
          setError(
            err instanceof AssessmentApiError
              ? err.message
              : "Could not load quiz results"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    sessionId,
    studentId,
    initialResults,
    expectedQuestionCount,
    expected,
    hasInitialReview,
    initialDetail,
  ]);

  const history = useMemo(
    () => collectAttemptHistory(results, detail),
    [results, detail]
  );
  const enriched = useMemo(
    () => enrichFromDetail(history, detail, clientSnapshots),
    [history, detail, clientSnapshots]
  );
  const stats = useMemo(() => computeAttemptStats(history), [history]);
  const missedCount = stats.missedCount;

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-brand-surface bg-white/90 p-10 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2
            className="size-8 animate-spin text-brand-primary"
            aria-hidden
          />
          <p className="text-sm font-medium text-brand-text">
            Loading your results…
          </p>
        </div>
      </div>
    );
  }

  if (error && !results) {
    return (
      <div className="rounded-[2rem] border border-brand-accent/25 bg-white p-6 shadow-sm">
        <p className="rounded-2xl border border-brand-accent/25 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent">
          {error}
        </p>
        {showRetry && onRetry ? (
          <Button
            onClick={onRetry}
            className="mt-4 rounded-2xl bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            <RefreshCw className="size-4" aria-hidden />
            Retry
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6 duration-500">
      <div className="overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-sm">
        <BrandGradientBar />
        <div className="relative px-6 pb-8 pt-7 sm:px-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 top-0 size-40 rounded-full bg-brand-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-8 bottom-0 size-32 rounded-full bg-brand-secondary/15 blur-3xl"
          />

          <div className="relative flex flex-col items-center text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-brand-secondary/15 text-brand-secondary ring-2 ring-brand-secondary/20">
              <Trophy className="size-7" aria-hidden />
            </div>
            <Badge className="mb-3 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
              <Sparkles className="mr-1 size-3.5" aria-hidden />
              Quiz complete
            </Badge>
            <h2 className="text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
              Your results
            </h2>
            <p className="mt-2 max-w-md text-base text-brand-text/65">
              Browse every question and see what you got right.
            </p>
            {stats.answered > 0 ? (
              <div className="mt-6 grid w-full max-w-md grid-cols-3 gap-3">
                <ScoreStat
                  label="Score"
                  value={`${stats.scorePct}%`}
                  accent="primary"
                />
                <ScoreStat
                  label="Correct"
                  value={String(stats.correctCount)}
                  sub={`of ${stats.answered}`}
                  accent="secondary"
                />
                <ScoreStat
                  label="Review"
                  value={String(stats.missedCount)}
                  sub={stats.missedCount === 1 ? "question" : "questions"}
                  accent="accent"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-brand-text">
              Question review
            </h3>
            <p className="text-sm text-brand-text/60">
              Browse every question from this session.
            </p>
          </div>
          {enriched.length > 0 ? (
            <Badge className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
              {stats.correctCount} correct
              {missedCount > 0 ? ` · ${missedCount} missed` : ""}
            </Badge>
          ) : null}
        </div>

        <QuestionReviewCarousel items={enriched} />
      </section>

      <div className="flex flex-wrap justify-center gap-3 pt-2">
        {showHistoryLink ? (
          <Button
            asChild
            variant="outline"
            className="h-12 gap-2 rounded-2xl border-brand-surface px-6 text-base text-brand-text hover:bg-brand-background"
          >
            <Link href="/assessment/history">
              <History className="size-5" aria-hidden />
              Past quizzes
            </Link>
          </Button>
        ) : null}
        {showRetry && onRetry ? (
          <Button
            onClick={onRetry}
            className="h-12 gap-2 rounded-2xl bg-brand-accent px-8 text-base text-white shadow-sm hover:bg-brand-accent/90"
          >
            <RefreshCw className="size-5" aria-hidden />
            Try again
          </Button>
        ) : null}
      </div>
    </div>
  );
}
