"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  fetchNextQuestion,
  fetchQuizResults,
  serializeStudentAnswer,
  submitAnswer,
} from "../api/quizzes";
import { isSessionComplete, normalizeQuestion } from "../api/normalizeQuestion";
import { useQuizSessionStore } from "../store/useQuizSessionStore";
import type {
  AnswerResponse,
  NextQuestionResponse,
  QuizQuestion,
  QuizQuestionRaw,
  QuizResults,
} from "../types";
import { AssessmentApiError } from "../types";
import { hasAnswer, QuestionRenderer } from "./QuestionRenderer";
import { QuizResultsView } from "./QuizResultsView";
import { QuizTimer, useElapsedSeconds } from "./QuizTimer";

interface QuizPlayerProps {
  sessionId: string;
  maxQuestions?: number;
  onFinished?: (results: QuizResults) => void;
  onRestart?: () => void;
  restartLabel?: string;
}

type Phase = "loading" | "answering" | "submitting" | "results" | "error";

/**
 * Cache the *current* unanswered /next payload per session.
 * Prevents React Strict Mode / Fast Refresh remounts from calling /next again
 * and consuming (skipping) the first question on the server.
 */
const pendingNextBySession = new Map<string, Promise<NextQuestionResponse>>();
const pendingNextResultBySession = new Map<string, NextQuestionResponse>();

function clearPendingNextMaps(sessionId: string) {
  pendingNextBySession.delete(sessionId);
  pendingNextResultBySession.delete(sessionId);
}

function readStorePending(sessionId: string): NextQuestionResponse | undefined {
  try {
    return useQuizSessionStore.getState().pendingNextBySession[sessionId];
  } catch {
    return undefined;
  }
}

function writeStorePending(
  sessionId: string,
  payload: NextQuestionResponse | null
) {
  try {
    useQuizSessionStore.getState().setPendingNext(sessionId, payload);
  } catch {
    // Store may be unavailable during SSR — maps still cover the happy path.
  }
}

function clearPendingNext(sessionId: string) {
  clearPendingNextMaps(sessionId);
  writeStorePending(sessionId, null);
}

function fetchInitialNext(sessionId: string): Promise<NextQuestionResponse> {
  const fromStore = readStorePending(sessionId);
  if (fromStore) {
    pendingNextResultBySession.set(sessionId, fromStore);
    return Promise.resolve(fromStore);
  }

  const resolved = pendingNextResultBySession.get(sessionId);
  if (resolved) return Promise.resolve(resolved);

  const cached = pendingNextBySession.get(sessionId);
  if (cached) return cached;

  const promise = fetchNextQuestion(sessionId)
    .then((data) => {
      pendingNextResultBySession.set(sessionId, data);
      writeStorePending(sessionId, data);
      return data;
    })
    .catch((err) => {
      clearPendingNext(sessionId);
      throw err;
    });
  pendingNextBySession.set(sessionId, promise);
  return promise;
}

function isSessionEndedError(err: unknown): boolean {
  if (!(err instanceof AssessmentApiError) || err.status !== 409) {
    return false;
  }
  const msg = String(err.message || err.detail || "").toLowerCase();
  return (
    msg.includes("session") ||
    msg.includes("complete") ||
    msg.includes("ended") ||
    msg.includes("no question")
  );
}

/**
 * Prefer backend completion flags.
 * Do not use questions_asked >= max alone — that counts *served* questions,
 * so it is already max while the student is still answering the last item.
 */
function answerIndicatesComplete(res: AnswerResponse): boolean {
  if (
    isSessionComplete({
      is_complete: res.is_complete,
      session_complete: res.session_complete,
    })
  ) {
    return true;
  }
  const status = String(res.status || "").toLowerCase();
  return (
    status === "completed" || status === "terminated" || status === "failed"
  );
}

function extractQuestion(
  next: NextQuestionResponse
): QuizQuestionRaw | null {
  if (next.question && typeof next.question === "object") {
    return next.question as QuizQuestionRaw;
  }
  const root = next as NextQuestionResponse & QuizQuestionRaw;
  if (root.id || root.question_id || root.payload) {
    return root;
  }
  return null;
}

function questionTypeIsMultiBlank(type: string | undefined): boolean {
  return (
    String(type || "")
      .toLowerCase()
      .replace(/[_\s-]/g, "") === "multiblank"
  );
}

export function QuizPlayer({
  sessionId,
  maxQuestions,
  onFinished,
  onRestart,
  restartLabel,
}: QuizPlayerProps) {
  const setLastSessionId = useQuizSessionStore((s) => s.setLastSessionId);
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState<string | string[]>("");
  /** 1-based ordinal of the question currently on screen. */
  const [ordinal, setOrdinal] = useState(0);
  const [asked, setAsked] = useState(0);
  const [cap, setCap] = useState(maxQuestions);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const nextInFlight = useRef(false);
  const bootAppliedRef = useRef(false);

  const timerRunning = phase === "answering";
  const elapsed = useElapsedSeconds(
    timerRunning,
    question?.question_id ?? "none"
  );

  const loadResults = useCallback(async () => {
    clearPendingNext(sessionId);
    try {
      const res = await fetchQuizResults(sessionId);
      setResults(res);
      setPhase("results");
      onFinished?.(res);
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Failed to load results"
      );
      setPhase("error");
    }
  }, [sessionId, onFinished]);

  const applyQuestion = useCallback(
    (raw: QuizQuestionRaw, askedHint?: number, ordinalHint?: number) => {
      const q = normalizeQuestion(raw);
      setQuestion(q);
      setOrdinal((prev) => ordinalHint ?? (prev > 0 ? prev + 1 : 1));
      setAsked(askedHint ?? q.questions_asked ?? q.question_number ?? 0);
      if (q.total_questions) setCap(q.total_questions);
      if (questionTypeIsMultiBlank(q.question_type)) {
        setAnswer(Array.from({ length: q.blanks ?? 2 }, () => ""));
      } else {
        setAnswer("");
      }
      setPhase("answering");
    },
    []
  );

  const loadNext = useCallback(async () => {
    if (nextInFlight.current) return;
    nextInFlight.current = true;
    setPhase("loading");
    setError(null);
    setFlash(null);
    setAnswer("");
    clearPendingNext(sessionId);
    try {
      const next = await fetchNextQuestion(sessionId);
      // Keep payload so a remount mid-question won't burn another /next.
      pendingNextResultBySession.set(sessionId, next);
      writeStorePending(sessionId, next);

      if (next.max_questions) setCap(next.max_questions);
      if (next.questions_asked != null) setAsked(next.questions_asked);

      const rawQ = extractQuestion(next);
      const complete = isSessionComplete({
        is_complete: next.is_complete,
        done: next.done,
        complete: next.complete,
        hasQuestion: Boolean(rawQ),
      });
      if (complete) {
        clearPendingNext(sessionId);
        await loadResults();
        return;
      }
      applyQuestion(rawQ as QuizQuestionRaw, next.questions_asked);
    } catch (err) {
      if (isSessionEndedError(err)) {
        clearPendingNext(sessionId);
        await loadResults();
        return;
      }
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not load the next question"
      );
      setPhase("error");
    } finally {
      nextInFlight.current = false;
    }
  }, [sessionId, loadResults, applyQuestion]);

  useEffect(() => {
    setLastSessionId(sessionId);
    setOrdinal(0);
    setAsked(0);
    setCap(maxQuestions);
    setResults(null);
    setQuestion(null);
    setError(null);
    setFlash(null);
    setAnswer("");
    setPhase("loading");
    bootAppliedRef.current = false;

    let cancelled = false;

    async function boot() {
      try {
        const next = await fetchInitialNext(sessionId);
        if (cancelled) return;

        if (next.max_questions) setCap(next.max_questions);
        if (next.questions_asked != null) setAsked(next.questions_asked);

        const rawQ = extractQuestion(next);
        const complete = isSessionComplete({
          is_complete: next.is_complete,
          done: next.done,
          complete: next.complete,
          hasQuestion: Boolean(rawQ),
        });
        if (complete) {
          clearPendingNext(sessionId);
          const res = await fetchQuizResults(sessionId);
          if (cancelled) return;
          setResults(res);
          setPhase("results");
          onFinished?.(res);
          return;
        }

        // Apply once — Strict Mode remount reuses the same cached /next payload.
        if (bootAppliedRef.current) return;
        bootAppliedRef.current = true;
        const displayOrdinal = Math.max(1, next.questions_asked ?? 1);
        applyQuestion(
          rawQ as QuizQuestionRaw,
          next.questions_asked,
          displayOrdinal
        );
      } catch (err) {
        if (cancelled) return;
        if (isSessionEndedError(err)) {
          try {
            clearPendingNext(sessionId);
            const res = await fetchQuizResults(sessionId);
            if (cancelled) return;
            setResults(res);
            setPhase("results");
            onFinished?.(res);
            return;
          } catch (resultsErr) {
            if (cancelled) return;
            setError(
              resultsErr instanceof AssessmentApiError
                ? resultsErr.message
                : "Failed to load results"
            );
            setPhase("error");
            return;
          }
        }
        setError(
          err instanceof AssessmentApiError
            ? err.message
            : "Could not load the next question"
        );
        setPhase("error");
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, setLastSessionId]);

  async function handleSubmit() {
    if (!question || !hasAnswer(answer)) return;
    setPhase("submitting");
    setError(null);
    try {
      const res = await submitAnswer(sessionId, {
        question_id: question.question_id,
        student_answer: serializeStudentAnswer(answer),
        time_taken_seconds: elapsed,
      });

      const grade = res.grade as { is_correct?: boolean } | undefined;
      const isCorrect =
        res.is_correct ??
        (grade && typeof grade === "object" ? grade.is_correct : undefined);
      if (isCorrect != null) {
        setFlash(
          isCorrect
            ? "Nice! That one landed."
            : "Keep going — every try teaches something."
        );
      }
      if (res.questions_asked != null) setAsked(res.questions_asked);

      // Answered — clear pending so the next /next is a real new fetch.
      clearPendingNext(sessionId);

      if (answerIndicatesComplete(res)) {
        await loadResults();
        return;
      }
      await loadNext();
    } catch (err) {
      if (isSessionEndedError(err)) {
        clearPendingNext(sessionId);
        await loadResults();
        return;
      }
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not submit answer"
      );
      setPhase("answering");
    }
  }

  const progressDen = question?.total_questions ?? cap;
  const progressNum = ordinal || question?.question_number || asked || 1;
  const progressLabel = progressDen
    ? `Question ${progressNum} / ${progressDen}`
    : `Question ${progressNum}`;

  if (phase === "results" && onFinished) {
    return (
      <Card className="border-brand-surface bg-white">
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <Loader2
            className="size-8 animate-spin text-brand-primary"
            aria-hidden
          />
          <p className="text-sm font-medium text-brand-text">
            Preparing your results…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (phase === "results" && results) {
    return (
      <QuizResultsView
        results={results}
        onAgain={onRestart}
        againLabel={restartLabel}
      />
    );
  }

  if (phase === "error") {
    return (
      <Card className="border-brand-accent/40 bg-white">
        <CardHeader>
          <CardTitle className="text-brand-text">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent">
            {error}
          </p>
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            onClick={() => {
              clearPendingNext(sessionId);
              bootAppliedRef.current = false;
              void loadNext();
            }}
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            Retry
          </Button>
          {onRestart ? (
            <Button variant="outline" onClick={onRestart}>
              Start over
            </Button>
          ) : null}
        </CardFooter>
      </Card>
    );
  }

  if (phase === "loading" || !question) {
    return (
      <Card className="border-brand-surface bg-white">
        <CardContent className="flex flex-col items-center gap-3 py-16">
          <Loader2
            className="size-8 animate-spin text-brand-primary"
            aria-hidden
          />
          <p className="text-sm font-medium text-brand-text">
            Picking your next question…
          </p>
          <p className="text-xs text-brand-text/55">
            Adaptive engine is matching difficulty to you
          </p>
          <div className="mt-4 h-3 w-48 animate-pulse rounded-full bg-brand-surface" />
          <div className="h-24 w-full max-w-md animate-pulse rounded-xl bg-brand-surface/70" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand-surface bg-white shadow-[0_18px_50px_-28px_rgba(0,168,232,0.35)] ring-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-brand-surface/80 pb-4">
        <div className="space-y-1">
          <Badge className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
            {question.question_type}
          </Badge>
          <CardTitle className="text-base font-medium text-brand-text/70">
            {progressLabel}
          </CardTitle>
        </div>
        <QuizTimer seconds={elapsed} />
      </CardHeader>
      <CardContent className="pt-6">
        {flash ? (
          <p className="mb-4 rounded-lg border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-2 text-sm text-brand-text">
            {flash}
          </p>
        ) : null}
        {error ? (
          <p
            className="mb-4 rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <QuestionRenderer
          questionType={question.question_type}
          prompt={question.prompt}
          options={question.options}
          paragraph={question.paragraph}
          blanks={question.blanks}
          value={answer}
          onChange={setAnswer}
          disabled={phase === "submitting"}
        />
      </CardContent>
      <CardFooter className="justify-end border-brand-surface">
        <Button
          disabled={!hasAnswer(answer) || phase === "submitting"}
          onClick={() => void handleSubmit()}
          className="h-11 gap-2 bg-brand-primary px-5 text-white shadow-md shadow-brand-primary/25 hover:bg-brand-primary/90"
        >
          {phase === "submitting" ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Checking…
            </>
          ) : (
            <>
              Submit answer
              <Send className="size-4" aria-hidden />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
