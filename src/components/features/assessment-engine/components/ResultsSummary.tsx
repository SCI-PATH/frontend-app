"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  Trophy,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { fetchSessionDetail } from "../api/history";
import { fetchQuizResults } from "../api/quizzes";
import { asPromptString } from "../api/normalizeQuestion";
import type {
  AttemptRecord,
  NestedPrompt,
  QuizResults,
  SessionDetail,
  SessionDetailItem,
  SessionDetailQuestion,
} from "../types";
import { AssessmentApiError } from "../types";
import {
  attemptIsCorrect,
  attemptNeedsReview,
  collectAttemptHistory,
} from "../utils/attemptStats";

interface ResultsSummaryProps {
  sessionId: string;
  studentId?: string;
  results?: QuizResults | null;
  onRetry: () => void;
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
  detail: SessionDetail | null
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
    const options = questionOptions(q);
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
        (attempt.sub_concept
          ? `Question on ${attempt.sub_concept}`
          : `Question (${attempt.question_type || "item"})`),
      studentAnswerDisplay:
        formatStudentAnswer(
          studentRaw,
          String(attempt.question_type || q?.question_type || ""),
          options
        ) || "—",
      correctAnswerDisplay:
        formatCorrectAnswer(
          expectedFormatted,
          String(attempt.question_type || q?.question_type || ""),
          options
        ) ||
        expectedFormatted ||
        "—",
      options,
    };
  });
}

function WrongAttemptCard({
  item,
  index,
}: {
  item: EnrichedAttempt;
  index: number;
}) {
  const { attempt } = item;
  const partial = isPartial(attempt);
  const tagLabel = formatTag(attempt.distractor_tag);
  const blankEntries =
    attempt.missed_blanks && typeof attempt.missed_blanks === "object"
      ? Object.entries(attempt.missed_blanks)
      : [];

  return (
    <li className="rounded-2xl border border-brand-accent/20 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-brand-accent/10 text-sm font-bold text-brand-accent">
            {index + 1}
          </span>
          {attempt.question_type ? (
            <Badge
              variant="outline"
              className="border-brand-surface text-brand-text/70"
            >
              {String(attempt.question_type)}
            </Badge>
          ) : null}
          {attempt.chapter_name ? (
            <span className="text-xs text-brand-text/55">
              {attempt.chapter_name}
              {attempt.sub_concept ? ` · ${attempt.sub_concept}` : ""}
            </span>
          ) : null}
        </div>
        <Badge
          className={
            partial
              ? "bg-brand-primary/15 text-brand-primary hover:bg-brand-primary/15"
              : "bg-brand-accent/15 text-brand-accent hover:bg-brand-accent/15"
          }
        >
          {partial ? "Partial" : "Incorrect"}
        </Badge>
      </div>

      <p className="text-base font-semibold leading-snug text-brand-text">
        {item.prompt}
      </p>

      <div className="mt-4 space-y-2.5">
        <div className="rounded-xl border border-brand-accent/15 bg-brand-accent/5 px-3 py-2.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent/80">
            Your answer
          </p>
          <p className="mt-1 text-brand-text/90">{item.studentAnswerDisplay}</p>
        </div>
        <div className="rounded-xl border border-brand-secondary/25 bg-brand-secondary/10 px-3 py-2.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-secondary">
            Correct answer
          </p>
          <p className="mt-1 font-medium text-brand-text">
            {item.correctAnswerDisplay}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-brand-surface pt-3 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/45">
          Why this mattered
        </p>

        {tagLabel || attempt.distractor_label ? (
          <div className="space-y-1 text-brand-text/85">
            {tagLabel ? (
              <p>
                <span className="font-medium text-brand-text">Type: </span>
                {tagLabel}
              </p>
            ) : null}
            {attempt.distractor_label ? (
              <p>{attempt.distractor_label}</p>
            ) : null}
          </div>
        ) : null}

        {attempt.error_category ? (
          <p className="text-brand-text/85">
            <span className="font-medium text-brand-text">Error category: </span>
            {formatTag(attempt.error_category) ?? attempt.error_category}
          </p>
        ) : null}

        {attempt.detailed_explanation ? (
          <p className="leading-relaxed text-brand-text/90">
            {attempt.detailed_explanation}
          </p>
        ) : null}

        {blankEntries.length > 0 ? (
          <ul className="space-y-1.5">
            {blankEntries.map(([blank, note]) => (
              <li
                key={blank}
                className="rounded-xl border border-brand-surface bg-brand-background/70 px-3 py-2 text-brand-text/85"
              >
                <span className="font-medium text-brand-text">{blank}: </span>
                {note}
              </li>
            ))}
          </ul>
        ) : null}

        {attempt.feedback ? (
          <p className="text-brand-text/70">
            <span className="font-medium text-brand-text/55">Feedback: </span>
            {attempt.feedback}
          </p>
        ) : null}
      </div>
    </li>
  );
}

export function ResultsSummary({
  sessionId,
  studentId,
  results: initialResults,
  onRetry,
}: ResultsSummaryProps) {
  const [results, setResults] = useState<QuizResults | null>(
    initialResults ?? null
  );
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Always refresh results so score cards match the server history
        // for any mix of MCQ / TrueFalse / ShortAnswer / MultiBlank.
        let quizResults: QuizResults;
        try {
          quizResults = await fetchQuizResults(sessionId);
        } catch (err) {
          if (initialResults?.history?.length) {
            quizResults = initialResults;
          } else {
            throw err;
          }
        }

        let sessionDetail: SessionDetail | null = null;
        if (studentId) {
          try {
            sessionDetail = await fetchSessionDetail(studentId, sessionId);
          } catch {
            sessionDetail = null;
          }
        }

        if (cancelled) return;
        setResults(quizResults);
        setDetail(sessionDetail);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof AssessmentApiError
            ? err.message
            : "Could not load quiz results"
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [sessionId, studentId, initialResults]);

  const history = useMemo(
    () => collectAttemptHistory(results, detail),
    [results, detail]
  );
  const enriched = useMemo(
    () => enrichFromDetail(history, detail),
    [history, detail]
  );
  const wrongItems = useMemo(
    () => enriched.filter((item) => attemptNeedsReview(item.attempt)),
    [enriched]
  );

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
        <Button
          onClick={onRetry}
          className="mt-4 rounded-2xl bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          <RefreshCw className="size-4" aria-hidden />
          Retry
        </Button>
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
              Review every miss and the correct answer so you know what to
              practice next.
            </p>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2 px-1">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-brand-text">
              Questions to review
            </h3>
            <p className="text-sm text-brand-text/60">
              Every question you missed, with the full correct answer.
            </p>
          </div>
          {wrongItems.length > 0 ? (
            <Badge className="bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/10">
              {wrongItems.length} missed
            </Badge>
          ) : null}
        </div>

        {wrongItems.length > 0 ? (
          <ul className="space-y-4">
            {wrongItems.map((item, idx) => (
              <WrongAttemptCard
                key={item.attempt.question_id || idx}
                item={item}
                index={idx}
              />
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl border border-brand-secondary/25 bg-brand-secondary/10 px-5 py-8 text-center">
            <CheckCircle2
              className="mx-auto size-8 text-brand-secondary"
              aria-hidden
            />
            <p className="mt-3 text-base font-semibold text-brand-text">
              Perfect run — nothing to review
            </p>
            <p className="mt-1 text-sm text-brand-text/60">
              You got every question correct in this session.
            </p>
          </div>
        )}
      </section>

      <div className="flex justify-center pt-2">
        <Button
          onClick={onRetry}
          className="h-12 gap-2 rounded-2xl bg-brand-accent px-8 text-base text-white shadow-sm hover:bg-brand-accent/90"
        >
          <RefreshCw className="size-5" aria-hidden />
          Retry
        </Button>
      </div>
    </div>
  );
}
