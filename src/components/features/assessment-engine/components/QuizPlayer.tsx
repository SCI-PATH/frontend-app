"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, LogOut, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
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
  terminateQuizSession,
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
import { QuizExitGuard } from "./QuizExitGuard";
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
  /** Called when student quits with no graded answers yet. */
  onQuitToSetup?: () => void;
  onRestart?: () => void;
  restartLabel?: string;
  /** Intercept Home / back and show quit confirmation. */
  enableExitGuard?: boolean;
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
  onQuitToSetup,
  onRestart,
  restartLabel,
  enableExitGuard = false,
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
  const [quitOpen, setQuitOpen] = useState(false);
  const [quitting, setQuitting] = useState(false);
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
  const targetDokRef = useRef<number | null>(null);

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

  const performQuit = useCallback(async () => {
    setQuitting(true);
    try {
      try {
        await terminateQuizSession(sessionId, {
          reason: "student_quit",
          source: "frontend",
        });
      } catch {
        /* session may already be ended */
      }
      releaseNextQuestion(sessionId);
      clearNextQuestionGate(sessionId);
      useQuizSessionStore.getState().setPendingNext(sessionId, null);

      if (localAttemptsRef.current.length > 0) {
        await loadResults();
      } else if (onQuitToSetup) {
        onQuitToSetup();
      } else if (onRestart) {
        onRestart();
      }
    } finally {
      setQuitting(false);
      setQuitOpen(false);
    }
  }, [sessionId, loadResults, onQuitToSetup, onRestart]);

  /** Used when leaving the page (Home / other links) — end session without opening results. */
  const performQuitAndLeave = useCallback(async () => {
    try {
      await terminateQuizSession(sessionId, {
        reason: "student_quit",
        source: "frontend",
      });
    } catch {
      /* ignore */
    }
    releaseNextQuestion(sessionId);
    clearNextQuestionGate(sessionId);
    useQuizSessionStore.getState().setPendingNext(sessionId, null);
    if (onQuitToSetup) onQuitToSetup();
    else if (onRestart) onRestart();
  }, [sessionId, onQuitToSetup, onRestart]);

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
      if (typeof next.target_dok === "number") {
        targetDokRef.current = next.target_dok;
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
      if (typeof next.target_dok === "number") {
        targetDokRef.current = next.target_dok;
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
    const loadingUi = (
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-sm">
        <BrandGradientBar />
        <div className="flex flex-col items-center gap-3 px-6 py-16">
          <Loader2
            className="size-8 animate-spin text-brand-primary"
            aria-hidden
          />
          <p className="text-sm font-medium text-brand-text">
            Picking your next question…
          </p>
          <p className="text-xs text-brand-text/55">
            Matching difficulty to how you&apos;re doing
          </p>
        </div>
      </div>
    );
    if (enableExitGuard) {
      return (
        <QuizExitGuard active onConfirmLeave={performQuitAndLeave}>
          {loadingUi}
        </QuizExitGuard>
      );
    }
    return loadingUi;
  }

  const dok =
    question.dok_level ??
    targetDokRef.current ??
    null;
  const progressPct =
    progressDen && progressDen > 0
      ? Math.min(100, Math.round((progressNum / progressDen) * 100))
      : null;

  const quizUi = (
    <div className="mx-auto w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-[0_18px_50px_-28px_rgba(0,168,232,0.35)]">
        <BrandGradientBar />
        <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
                  {question.question_type}
                </Badge>
                {dok != null ? (
                  <Badge
                    variant="outline"
                    className="border-brand-special/30 bg-brand-special/8 text-brand-special"
                  >
                    DOK {dok}
                  </Badge>
                ) : null}
                {question.chapter_name ? (
                  <span className="max-w-[14rem] truncate text-xs text-brand-text/50 sm:max-w-xs">
                    {question.chapter_name}
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-semibold tabular-nums text-brand-text/70">
                {progressLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <QuizTimer seconds={elapsed} />
              {enableExitGuard || onQuitToSetup ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={quitting || phase === "submitting"}
                  onClick={() => setQuitOpen(true)}
                  className="gap-1.5 border-brand-accent/30 text-brand-accent hover:bg-brand-accent/10"
                >
                  <LogOut className="size-3.5" aria-hidden />
                  Quit
                </Button>
              ) : null}
            </div>
          </div>

          {progressPct != null ? (
            <div>
              <div className="mb-1.5 flex justify-between text-[0.65rem] font-semibold uppercase tracking-wider text-brand-text/40">
                <span>Progress</span>
                <span className="tabular-nums">{progressPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-brand-background">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : null}

          {flash ? (
            <p className="rounded-xl border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-2 text-sm text-brand-text">
              {flash}
            </p>
          ) : null}
          {error ? (
            <p
              className="rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent"
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-surface/80 pt-4">
            <p className="text-xs text-brand-text/45">
              Choose carefully — you submit once per question.
            </p>
            <Button
              disabled={!hasAnswer(answer) || phase === "submitting"}
              onClick={() => void handleSubmit()}
              className="h-11 gap-2 rounded-xl bg-brand-primary px-6 text-white shadow-md shadow-brand-primary/25 hover:bg-brand-primary/90"
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
          </div>
        </div>
      </div>

      {quitOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-text/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-quit-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-brand-surface bg-white shadow-xl">
            <div className="space-y-2 px-5 pt-5 sm:px-6">
              <h2
                id="quiz-quit-title"
                className="text-lg font-bold tracking-tight text-brand-text"
              >
                Quit this quiz?
              </h2>
              <p className="text-sm leading-relaxed text-brand-text/65">
                {localAttemptsRef.current.length > 0
                  ? "We'll end the session and show a review of the questions you already answered."
                  : "You haven't submitted any answers yet. Leaving will end this quiz and return you to setup."}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-brand-surface/80 px-5 py-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                disabled={quitting}
                onClick={() => setQuitOpen(false)}
                className="border-brand-surface"
              >
                Keep playing
              </Button>
              <Button
                type="button"
                disabled={quitting}
                onClick={() => void performQuit()}
                className="gap-2 bg-brand-accent text-white hover:bg-brand-accent/90"
              >
                {quitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="size-4" aria-hidden />
                )}
                Quit quiz
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (enableExitGuard) {
    return (
      <QuizExitGuard
        active={phase !== "results"}
        onConfirmLeave={performQuitAndLeave}
      >
        {quizUi}
      </QuizExitGuard>
    );
  }

  return quizUi;
}
