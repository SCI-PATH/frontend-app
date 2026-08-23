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
 * Deduplicate the *first* /next per session across React Strict Mode remounts.
 * Each /next advances C2 state — a second mount must reuse the same promise,
 * not fire another HTTP call. Subsequent /next after /answer bypass this cache.
 */
const initialNextBySession = new Map<string, Promise<NextQuestionResponse>>();

function fetchInitialNext(sessionId: string): Promise<NextQuestionResponse> {
  const cached = initialNextBySession.get(sessionId);
  if (cached) return cached;

  const promise = fetchNextQuestion(sessionId).catch((err) => {
    initialNextBySession.delete(sessionId);
    throw err;
  });
  initialNextBySession.set(sessionId, promise);
  return promise;
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
  const [index, setIndex] = useState(0);
  const [asked, setAsked] = useState(0);
  const [cap, setCap] = useState(maxQuestions);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  /** Blocks overlapping /next while one is in flight (post-answer path). */
  const nextInFlight = useRef(false);

  const timerRunning = phase === "answering";
  const elapsed = useElapsedSeconds(
    timerRunning,
    question?.question_id ?? "none"
  );

  const loadResults = useCallback(async () => {
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
    (raw: QuizQuestionRaw, askedHint?: number) => {
      const q = normalizeQuestion(raw);
      setQuestion(q);
      setIndex((i) => i + 1);
      setAsked(
        askedHint ?? q.questions_asked ?? q.question_number ?? 0
      );
      if (q.total_questions) setCap(q.total_questions);
      if (q.question_type === "MultiBlank") {
        setAnswer(Array.from({ length: q.blanks ?? 2 }, () => ""));
      } else {
        setAnswer("");
      }
      setPhase("answering");
    },
    []
  );

  /** After a successful /answer (or manual retry) — always a fresh /next. */
  const loadNext = useCallback(async () => {
    if (nextInFlight.current) return;
    nextInFlight.current = true;
    setPhase("loading");
    setError(null);
    setFlash(null);
    setAnswer("");
    try {
      const next = await fetchNextQuestion(sessionId);
      if (next.max_questions) setCap(next.max_questions);
      if (next.questions_asked != null) setAsked(next.questions_asked);

      const complete = isSessionComplete({
        is_complete: next.is_complete,
        done: next.done,
        complete: next.complete,
        hasQuestion: Boolean(next.question),
      });
      if (complete) {
        await loadResults();
        return;
      }
      applyQuestion(next.question as QuizQuestionRaw, next.questions_asked);
    } catch (err) {
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
    setIndex(0);
    setAsked(0);
    setCap(maxQuestions);
    setResults(null);
    setQuestion(null);
    setError(null);
    setFlash(null);
    setAnswer("");
    setPhase("loading");

    let cancelled = false;

    async function boot() {
      try {
        // Shared promise: Strict Mode remount awaits the same first /next.
        const next = await fetchInitialNext(sessionId);
        if (cancelled) return;
        if (next.max_questions) setCap(next.max_questions);
        if (next.questions_asked != null) setAsked(next.questions_asked);

        const complete = isSessionComplete({
          is_complete: next.is_complete,
          done: next.done,
          complete: next.complete,
          hasQuestion: Boolean(next.question),
        });
        if (complete) {
          const res = await fetchQuizResults(sessionId);
          if (cancelled) return;
          setResults(res);
          setPhase("results");
          onFinished?.(res);
          return;
        }
        // Reset index then apply so remount doesn't double-count.
        setIndex(0);
        applyQuestion(next.question as QuizQuestionRaw, next.questions_asked);
      } catch (err) {
        if (cancelled) return;
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
      if (res.is_correct != null) {
        setFlash(
          res.is_correct
            ? "Nice! That one landed."
            : "Keep going — every try teaches something."
        );
      }
      if (
        isSessionComplete({
          is_complete: res.is_complete,
          session_complete: res.session_complete,
        })
      ) {
        await loadResults();
        return;
      }
      await loadNext();
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not submit answer"
      );
      setPhase("answering");
    }
  }

  const progressNum = question?.question_number ?? (asked || index);
  const progressDen = question?.total_questions ?? cap;
  const progressLabel = progressDen
    ? `Question ${progressNum || index} / ${progressDen}`
    : `Question ${progressNum || index}`;

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
              // Failed initial boot: clear cache so retry issues a new /next.
              initialNextBySession.delete(sessionId);
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
