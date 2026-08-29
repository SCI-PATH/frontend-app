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
  clearNextQuestionGate,
  fetchNextQuestionGuarded,
  releaseNextQuestion,
  seedNextQuestion,
} from "../api/nextQuestionGate";
import {
  fetchQuizResults,
  localAttemptsToSnapshots,
  mergeLocalAttemptsIntoResults,
  serializeStudentAnswer,
  submitAnswer,
  type LocalSubmittedAttempt,
} from "../api/quizzes";
import { isSessionComplete, normalizeQuestion } from "../api/normalizeQuestion";
import { useQuizSessionStore } from "../store/useQuizSessionStore";
import type {
  AnswerResponse,
  ClientQuestionSnapshot,
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
  /** Prefetched first /next from the start flow — boot must not call /next again. */
  initialNext?: NextQuestionResponse | null;
  onFinished?: (
    results: QuizResults,
    extras?: { clientSnapshots?: Record<string, ClientQuestionSnapshot> }
  ) => void;
  onRestart?: () => void;
  restartLabel?: string;
}

type Phase = "loading" | "answering" | "submitting" | "results" | "error";

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

function isBankExhaustedError(err: unknown): boolean {
  if (!(err instanceof AssessmentApiError) || err.status !== 409) {
    return false;
  }
  const msg = String(err.message || err.detail || "").toLowerCase();
  return msg.includes("no eligible") || msg.includes("no question");
}

function answerIndicatesComplete(res: AnswerResponse): boolean {
  const status = String(res.status || "").toLowerCase();
  if (
    status === "completed" ||
    status === "terminated" ||
    status === "failed"
  ) {
    return true;
  }
  return isSessionComplete({
    is_complete: res.is_complete,
    session_complete: res.session_complete,
  });
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

/** True when this served item is the last slot (do not GET /next again). */
function isFinalServedItem(
  asked: number | undefined,
  max: number | undefined,
  shown: number
): boolean {
  if (max != null && max > 0) {
    if (asked != null && asked >= max) return true;
    if (shown >= max) return true;
  }
  return false;
}

export function QuizPlayer({
  sessionId,
  maxQuestions,
  initialNext = null,
  onFinished,
  onRestart,
  restartLabel,
}: QuizPlayerProps) {
  const setLastSessionId = useQuizSessionStore((s) => s.setLastSessionId);
  const [phase, setPhase] = useState<Phase>("loading");
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [answer, setAnswer] = useState<string | string[]>("");
  /** 1-based count of questions shown to the student. */
  const [ordinal, setOrdinal] = useState(0);
  const [cap, setCap] = useState(maxQuestions);
  const [results, setResults] = useState<QuizResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const nextInFlight = useRef(false);
  const submitLock = useRef(false);
  const shownCountRef = useRef(0);
  /** questions_asked from the last successful GET /next. */
  const servedAskedRef = useRef(0);
  /** Last on-screen item already consumed the max slot — never GET /next again. */
  const lastItemOnScreenRef = useRef(false);
  /** Prevents Strict Mode double-apply within the same mount cycle only. */
  const appliedQuestionIdRef = useRef<string | null>(null);
  const localAttemptsRef = useRef<LocalSubmittedAttempt[]>([]);

  const timerRunning = phase === "answering";
  const elapsed = useElapsedSeconds(
    timerRunning,
    question?.question_id ?? "none"
  );

  const loadResults = useCallback(
    async (pending?: LocalSubmittedAttempt) => {
      releaseNextQuestion(sessionId);
      clearNextQuestionGate(sessionId);
      useQuizSessionStore.getState().setPendingNext(sessionId, null);

      const buildLocals = () => {
        const locals = [...localAttemptsRef.current];
        if (
          pending &&
          !locals.some((item) => item.question_id === pending.question_id)
        ) {
          locals.push(pending);
        }
        return locals;
      };

      const finishWithLocals = (locals: LocalSubmittedAttempt[]) => {
        const snapshots = localAttemptsToSnapshots(locals);
        const res = mergeLocalAttemptsIntoResults(
          { session_id: sessionId, history: [] },
          locals
        );
        if (onFinished) {
          onFinished(res, { clientSnapshots: snapshots });
          return true;
        }
        setResults(res);
        setPhase("results");
        return true;
      };

      const locals = buildLocals();
      // Review must not wait on GET /results (can hang while C4/DB is busy).
      finishWithLocals(locals);

      void fetchQuizResults(sessionId)
        .then((server) => {
          if (!onFinished) {
            setResults(mergeLocalAttemptsIntoResults(server, locals));
          }
        })
        .catch(() => {
          /* local review already shown */
        });
    },
    [sessionId, onFinished]
  );

  const applyQuestion = useCallback((raw: QuizQuestionRaw, ordinalHint: number) => {
    const q = normalizeQuestion(raw);
    if (!q.question_id) {
      setError("Question is missing an id — cannot grade this item.");
      setPhase("error");
      return;
    }
    // Same payload applied twice (Strict Mode) — keep ordinal stable.
    if (appliedQuestionIdRef.current === q.question_id) {
      setQuestion(q);
      setPhase("answering");
      return;
    }
    appliedQuestionIdRef.current = q.question_id;
    setQuestion(q);
    shownCountRef.current = ordinalHint;
    setOrdinal(ordinalHint);
    if (q.total_questions) setCap(q.total_questions);
    if (questionTypeIsMultiBlank(q.question_type)) {
      setAnswer(Array.from({ length: q.blanks ?? 2 }, () => ""));
    } else {
      setAnswer("");
    }
    setPhase("answering");
  }, []);

  const loadNext = useCallback(async () => {
    if (lastItemOnScreenRef.current) {
      return;
    }
    const capNow = maxQuestions ?? cap ?? null;
    if (
      isFinalServedItem(servedAskedRef.current, capNow ?? undefined, shownCountRef.current)
    ) {
      lastItemOnScreenRef.current = true;
      return;
    }
    if (nextInFlight.current) return;
    nextInFlight.current = true;
    setPhase("loading");
    setError(null);
    setFlash(null);
    setAnswer("");
    releaseNextQuestion(sessionId);
    useQuizSessionStore.getState().setPendingNext(sessionId, null);
    try {
      const next = await fetchNextQuestionGuarded(sessionId, { force: true });
      seedNextQuestion(sessionId, next);
      useQuizSessionStore.getState().setPendingNext(sessionId, next);

      if (next.max_questions) setCap(next.max_questions);
      if (typeof next.questions_asked === "number") {
        servedAskedRef.current = next.questions_asked;
      }

      const rawQ = extractQuestion(next);
      if (
        isSessionComplete({
          is_complete: next.is_complete,
          done: next.done,
          complete: next.complete,
          hasQuestion: Boolean(rawQ),
        })
      ) {
        // GET /next must not be the review trigger while a question is unanswered.
        const unanswered =
          Boolean(appliedQuestionIdRef.current) &&
          !localAttemptsRef.current.some(
            (a) => a.question_id === appliedQuestionIdRef.current
          );
        if (unanswered) {
          setPhase("answering");
          return;
        }
        await loadResults();
        return;
      }
      if (!rawQ) {
        setError("Next question payload was empty.");
        setPhase("error");
        return;
      }
      const nextShown = shownCountRef.current + 1;
      const maxNow = next.max_questions ?? capNow ?? undefined;
      lastItemOnScreenRef.current = isFinalServedItem(
        next.questions_asked,
        maxNow,
        nextShown
      );
      applyQuestion(rawQ, nextShown);
    } catch (err) {
      const unanswered =
        Boolean(appliedQuestionIdRef.current) &&
        !localAttemptsRef.current.some(
          (a) => a.question_id === appliedQuestionIdRef.current
        );
      if (unanswered && isSessionEndedError(err)) {
        // Extra /next completed the session; keep the on-screen item for /answer.
        lastItemOnScreenRef.current = true;
        setPhase("answering");
        return;
      }
      if (isBankExhaustedError(err) && localAttemptsRef.current.length > 0) {
        await loadResults();
        return;
      }
      if (isSessionEndedError(err) && localAttemptsRef.current.length > 0) {
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
  }, [sessionId, loadResults, applyQuestion, maxQuestions, cap]);

  useEffect(() => {
    setLastSessionId(sessionId);
    setOrdinal(0);
    setCap(maxQuestions);
    setResults(null);
    setQuestion(null);
    setError(null);
    setFlash(null);
    setAnswer("");
    setPhase("loading");
    shownCountRef.current = 0;
    servedAskedRef.current = 0;
    lastItemOnScreenRef.current = false;
    submitLock.current = false;
    appliedQuestionIdRef.current = null;
    localAttemptsRef.current = [];

    let cancelled = false;

    function showFirst(next: NextQuestionResponse) {
      if (cancelled) return;
      seedNextQuestion(sessionId, next);
      useQuizSessionStore.getState().setPendingNext(sessionId, next);
      if (next.max_questions) setCap(next.max_questions);
      if (typeof next.questions_asked === "number") {
        servedAskedRef.current = next.questions_asked;
      }
      const rawQ = extractQuestion(next);
      if (!rawQ) {
        setError("First question payload was empty.");
        setPhase("error");
        return;
      }
      lastItemOnScreenRef.current = isFinalServedItem(
        next.questions_asked,
        next.max_questions ?? maxQuestions,
        1
      );
      applyQuestion(rawQ, 1);
    }

    // Prefer the unanswered payload already in memory (mid-quiz remount /
    // Fast Refresh). Never prefer the original Q1 prefetch over it — that
    // would either re-show Q1 or, if the gate is empty, GET /next and
    // complete the session before the last POST /answer.
    const fromStore =
      useQuizSessionStore.getState().pendingNextBySession[sessionId];
    if (fromStore) {
      showFirst(fromStore);
      return () => {
        cancelled = true;
      };
    }

    if (initialNext) {
      showFirst(initialNext);
      return () => {
        cancelled = true;
      };
    }

    async function bootFetch() {
      try {
        const next = await fetchNextQuestionGuarded(sessionId);
        if (cancelled) return;
        showFirst(next);
      } catch (err) {
        if (cancelled) return;
        if (isSessionEndedError(err)) {
          await loadResults();
          return;
        }
        setError(
          err instanceof AssessmentApiError
            ? err.message
            : "Could not load the next question"
        );
        setPhase("error");
      }
    }

    void bootFetch();
    return () => {
      cancelled = true;
    };
    // intentionally only sessionId — initialNext is fixed for a given session
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, setLastSessionId]);

  async function handleSubmit() {
    if (phase !== "answering") return;
    if (submitLock.current) return;
    if (!question || !hasAnswer(answer)) return;
    if (!question.question_id) {
      setError("Cannot submit — question id is missing.");
      setPhase("error");
      return;
    }
    submitLock.current = true;
    setPhase("submitting");
    setError(null);
    try {
      const serialized = serializeStudentAnswer(answer);
      const res = await submitAnswer(sessionId, {
        question_id: question.question_id,
        student_answer: serialized,
        time_taken_seconds: elapsed,
      });

      const localAttempt: LocalSubmittedAttempt = {
        question_id: question.question_id,
        question_type: question.question_type,
        prompt: question.prompt,
        options: question.options,
        student_answer: serialized,
        answerResponse: res,
      };
      localAttemptsRef.current.push(localAttempt);

      const grade = res.grade as
        | { is_correct?: boolean; feedback?: string }
        | undefined;
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

      const intendedMax = maxQuestions ?? cap ?? undefined;
      const asked = res.questions_asked ?? servedAskedRef.current;
      const quizDone =
        answerIndicatesComplete(res) ||
        lastItemOnScreenRef.current ||
        isFinalServedItem(asked, intendedMax, shownCountRef.current);

      if (quizDone) {
        await loadResults(localAttempt);
        return;
      }
      await loadNext();
    } catch (err) {
      if (isSessionEndedError(err)) {
        await loadResults();
        return;
      }
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not submit answer"
      );
      setPhase("answering");
    } finally {
      submitLock.current = false;
    }
  }

  const progressDen = maxQuestions ?? question?.total_questions ?? cap;
  const progressNum = ordinal || 1;
  const progressLabel = progressDen
    ? `Question ${progressNum} / ${progressDen}`
    : `Question ${progressNum}`;

  if (phase === "results" && onFinished) {
    return null;
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
              if (
                lastItemOnScreenRef.current &&
                localAttemptsRef.current.length > 0
              ) {
                void loadResults();
                return;
              }
              appliedQuestionIdRef.current = null;
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-2xl border-brand-surface bg-white shadow-[0_18px_50px_-28px_rgba(0,168,232,0.35)] ring-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
