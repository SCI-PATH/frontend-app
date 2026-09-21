"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Check,
  CircleDot,
  Layers,
  ListChecks,
  Loader2,
  PenLine,
  Rocket,
  Sparkles,
  TextCursorInput,
  ToggleLeft,
} from "lucide-react";

import { Navbar } from "@/components/common/Navbar";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchAmplitudeChapters } from "../api/amplitude";
import {
  clearNextQuestionGate,
  seedNextQuestion,
} from "../api/nextQuestionGate";
import {
  createCustomizableQuiz,
  fetchNextQuestion,
} from "../api/quizzes";
import { chaptersForGrade } from "../data/catalog";
import { useAssessmentUser } from "../store/useAssessmentUser";
import { useQuizSessionStore } from "../store/useQuizSessionStore";
import type {
  AmplitudeChapter,
  ClientQuestionSnapshot,
  NextQuestionResponse,
  QuestionType,
  QuizResults,
} from "../types";
import { AssessmentApiError } from "../types";
import { AssessmentShell } from "../components/AssessmentShell";
import { QuizPlayer } from "../components/QuizPlayer";
import { ResultsSummary } from "../components/ResultsSummary";
import { ACCENT_STYLES } from "@/components/common/landing/landing-content";
import { cn } from "@/lib/utils";

const ALL_TYPES: QuestionType[] = [
  "MCQ",
  "TrueFalse",
  "ShortAnswer",
  "MultiBlank",
];


const TYPE_META: Record<
  QuestionType,
  { label: string; description: string; icon: LucideIcon }
> = {
  MCQ: {
    label: "Multiple choice",
    description: "Pick one answer",
    icon: ListChecks,
  },
  TrueFalse: {
    label: "True or false",
    description: "Decide if a statement is correct",
    icon: ToggleLeft,
  },
  ShortAnswer: {
    label: "Short answer",
    description: "Write a brief response",
    icon: PenLine,
  },
  MultiBlank: {
    label: "Fill in the blanks",
    description: "Complete missing words",
    icon: TextCursorInput,
  },
};

type View = "setup" | "playing" | "results";

export function CustomQuizScreen() {
  const user = useAssessmentUser();
  const grade = user.grade ?? 6;
  const setCustomQuizReview = useQuizSessionStore((s) => s.setCustomQuizReview);
  const clearCustomQuizReview = useQuizSessionStore((s) => s.clearCustomQuizReview);
  const [apiChapters, setApiChapters] = useState<AmplitudeChapter[] | null>(
    null
  );
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [types, setTypes] = useState<QuestionType[]>([...ALL_TYPES]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialNext, setInitialNext] = useState<NextQuestionResponse | null>(
    null
  );
  const [results, setResults] = useState<QuizResults | null>(null);
  const [clientSnapshots, setClientSnapshots] = useState<
    Record<string, ClientQuestionSnapshot>
  >({});
  const [view, setView] = useState<View>("setup");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Restore results only after a soft refresh of this page — not after Home / other routes.
  useEffect(() => {
    let cancelled = false;

    function restoreReview() {
      if (cancelled) return;
      const saved = useQuizSessionStore.getState().customQuizReview;
      if (saved?.sessionId && saved.results?.history?.length) {
        setSessionId(saved.sessionId);
        setResults(saved.results);
        setClientSnapshots(saved.clientSnapshots ?? {});
        setNumQuestions(saved.expectedQuestionCount || 5);
        setView("results");
      }
      setBootstrapped(true);
    }

    if (useQuizSessionStore.persist.hasHydrated()) {
      restoreReview();
    } else {
      const unsub = useQuizSessionStore.persist.onFinishHydration(() => {
        restoreReview();
      });
      return () => {
        cancelled = true;
        unsub();
      };
    }

    return () => {
      cancelled = true;
    };
  }, []);

  // Leaving this route (Home, Past quizzes, etc.) clears saved review.
  // Full page refresh keeps it. Strict Mode remount won't clear (short delay).
  useEffect(() => {
    const KEY = "iae-custom-quiz-mounted";
    sessionStorage.setItem(KEY, "1");

    let fullUnload = false;
    const markUnload = () => {
      fullUnload = true;
    };
    window.addEventListener("beforeunload", markUnload);

    return () => {
      window.removeEventListener("beforeunload", markUnload);
      sessionStorage.removeItem(KEY);
      if (fullUnload) return;
      window.setTimeout(() => {
        if (sessionStorage.getItem(KEY) !== "1") {
          clearCustomQuizReview();
        }
      }, 80);
    };
  }, [clearCustomQuizReview]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setChaptersLoading(true);
      try {
        const res = await fetchAmplitudeChapters(grade);
        if (cancelled) return;
        const list = res.chapters ?? [];
        setApiChapters(list);
        setSelected(list.slice(0, 2).map((c) => c.chapter_id));
      } catch {
        if (cancelled) return;
        setApiChapters(null);
        const fallback = chaptersForGrade(grade);
        setSelected(fallback.slice(0, 2).map((c) => c.id));
      } finally {
        if (!cancelled) setChaptersLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [grade]);

  const chapterChoices =
    apiChapters != null
      ? apiChapters.map((c) => ({
          id: c.chapter_id,
          label: c.chapter_title,
        }))
      : chaptersForGrade(grade).map((c) => ({ id: c.id, label: c.label }));

  function toggleChapter(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function toggleType(t: QuestionType) {
    setTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }

  function selectAllChapters() {
    setSelected(chapterChoices.map((c) => c.id));
  }

  function selectAllTypes() {
    setTypes([...ALL_TYPES]);
  }

  const allTypesSelected = types.length === ALL_TYPES.length;
  const allChaptersSelected =
    chapterChoices.length > 0 &&
    selected.length === chapterChoices.length;

  function handleRetry() {
    if (sessionId) {
      clearNextQuestionGate(sessionId);
      useQuizSessionStore.getState().setPendingNext(sessionId, null);
    }
    clearCustomQuizReview();
    setSessionId(null);
    setInitialNext(null);
    setResults(null);
    setClientSnapshots({});
    setError(null);
    setView("setup");
  }

  function persistReview(
    id: string,
    res: QuizResults,
    snapshots: Record<string, ClientQuestionSnapshot>
  ) {
    setCustomQuizReview({
      sessionId: id,
      results: res,
      clientSnapshots: snapshots,
      expectedQuestionCount: numQuestions,
    });
  }

  async function handleStart() {
    if (user.role !== "student") {
      setError("Custom quizzes are available to student accounts.");
      return;
    }
    if (!user.userId) {
      setError("Sign in to start a custom quiz.");
      return;
    }
    if (selected.length === 0) {
      setError("Pick at least one chapter.");
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const session = await createCustomizableQuiz({
        student_id: user.userId,
        grade,
        chapters: selected,
        num_questions: numQuestions,
        // Always send explicit types so the backend never falls back to its
        // MCQ+TrueFalse-only schema default when all four are selected.
        question_types: types,
      });
      const id = session.session_id;
      if (!id) throw new AssessmentApiError(500, "No session_id returned");

      // Exactly one /next for question 1. QuizPlayer must reuse this payload
      // (backend burns a slot on every /next call).
      const first = await fetchNextQuestion(id);
      seedNextQuestion(id, first);
      useQuizSessionStore.getState().setPendingNext(id, first);

      setResults(null);
      setInitialNext(first);
      setSessionId(id);
      clearCustomQuizReview();
      setView("playing");
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not start quiz"
      );
    } finally {
      setStarting(false);
    }
  }

  if (!bootstrapped) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-brand-primary" aria-hidden />
      </div>
    );
  }

  if (view === "results" && sessionId) {
    return (
      <>
        <Navbar />
        <AssessmentShell
          title="Quiz results"
          subtitle="See your score and every question to review."
          maxWidth="3xl"
          backHref=""
        >
          <ResultsSummary
            sessionId={sessionId}
            studentId={user.userId}
            results={results}
            expectedQuestionCount={numQuestions}
            clientSnapshots={clientSnapshots}
            onRetry={handleRetry}
          />
        </AssessmentShell>
      </>
    );
  }

  if (view === "playing" && sessionId) {
    return (
      <>
        <Navbar />
        <AssessmentShell
          title="Custom Quiz"
          subtitle="Adaptive practice in progress"
          maxWidth="2xl"
          hideHeader
          className="flex flex-col items-center justify-center"
        >
          <QuizPlayer
            sessionId={sessionId}
            maxQuestions={numQuestions}
            initialNext={initialNext}
            enableExitGuard
            onFinished={(res, extras) => {
              const snapshots = extras?.clientSnapshots ?? {};
              setResults(res);
              setClientSnapshots(snapshots);
              setView("results");
              persistReview(sessionId, res, snapshots);
            }}
            onQuitToSetup={handleRetry}
            onRestart={handleRetry}
            restartLabel="Configure another quiz"
          />
        </AssessmentShell>
      </>
    );
  }

  const primary = ACCENT_STYLES.primary;

  return (
    <>
      <Navbar />
      <AssessmentShell maxWidth="3xl" hideHeader title="">
        <div className="relative overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-sm">
          <BrandGradientBar />
          <div
            aria-hidden
            className="pointer-events-none absolute -left-16 top-10 size-56 rounded-full bg-brand-primary/10 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 bottom-8 size-48 rounded-full bg-brand-accent/10 blur-3xl"
          />

          <div className="relative space-y-12 px-5 py-8 sm:space-y-14 sm:px-8 sm:py-10">
            <header className="space-y-3 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge className="gap-1 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
                  <Sparkles className="size-3.5" aria-hidden />
                  Grade {grade}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-brand-surface text-brand-text/70"
                >
                  {user.displayName}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
                Build your quiz
              </h1>
              <p className="mx-auto max-w-lg text-base leading-relaxed text-brand-text/65 sm:mx-0">
                Choose chapters and question styles, then start adaptive practice.
              </p>
            </header>

            <div className="space-y-12 sm:space-y-14">
            <SetupBlock
              icon={BookOpen}
              iconClass={cn(primary.bg, primary.text)}
              title="Chapters"
              hint={
                chaptersLoading
                  ? "Loading…"
                  : `${selected.length} of ${chapterChoices.length} selected`
              }
              action={
                !chaptersLoading && chapterChoices.length > 0 ? (
                  <button
                    type="button"
                    onClick={
                      allChaptersSelected ? () => setSelected([]) : selectAllChapters
                    }
                    className="text-xs font-semibold text-brand-primary hover:text-brand-special"
                  >
                    {allChaptersSelected ? "Clear all" : "Select all"}
                  </button>
                ) : null
              }
            >
              {chaptersLoading ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-brand-text/55">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Loading chapters…
                </div>
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {chapterChoices.map((ch) => {
                    const on = selected.includes(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => toggleChapter(ch.id)}
                        aria-pressed={on}
                        className={cn(
                          "group flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200",
                          on
                            ? "border-brand-primary/30 bg-brand-primary/5 ring-2 ring-brand-primary/25"
                            : "border-brand-surface bg-brand-background/50 hover:border-brand-primary/20 hover:bg-white"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                            on
                              ? "border-brand-primary bg-brand-primary text-white"
                              : "border-brand-surface bg-white text-transparent group-hover:border-brand-primary/40"
                          )}
                        >
                          <Check className="size-3.5" strokeWidth={3} aria-hidden />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold leading-snug text-brand-text">
                            {ch.label}
                          </span>
                          <span className="mt-0.5 block text-xs text-brand-text/45">
                            {formatChapterId(ch.id)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </SetupBlock>

            <SetupBlock
              icon={Layers}
              iconClass={cn(ACCENT_STYLES.special.bg, ACCENT_STYLES.special.text)}
              title="Quiz length"
              hint={`${numQuestions} question${numQuestions === 1 ? "" : "s"}`}
            >
              <div className="rounded-2xl border border-brand-surface/80 bg-brand-background/40 px-4 py-4">
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full accent-brand-primary"
                  aria-label="Number of questions"
                />
                <div className="mt-2 flex justify-between text-xs font-medium tabular-nums text-brand-text/45">
                  <span>1</span>
                  <span>15</span>
                  <span>30</span>
                </div>
              </div>
            </SetupBlock>

            <SetupBlock
              icon={CircleDot}
              iconClass={cn(ACCENT_STYLES.secondary.bg, ACCENT_STYLES.secondary.text)}
              title="Question styles"
              hint={
                allTypesSelected
                  ? "All styles included"
                  : `${types.length} of ${ALL_TYPES.length} selected`
              }
              action={
                <button
                  type="button"
                  onClick={
                    allTypesSelected ? () => setTypes([]) : selectAllTypes
                  }
                  className="text-xs font-semibold text-brand-primary hover:text-brand-special"
                >
                  {allTypesSelected ? "Clear all" : "All styles"}
                </button>
              }
            >
              <div className="grid gap-2.5 sm:grid-cols-2">
                {ALL_TYPES.map((t) => {
                  const on = types.includes(t);
                  const meta = TYPE_META[t];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleType(t)}
                      aria-pressed={on}
                      className={cn(
                        "flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition-all duration-200",
                        on
                          ? "border-brand-secondary/35 bg-brand-secondary/8 ring-2 ring-brand-secondary/25"
                          : "border-brand-surface bg-brand-background/50 hover:border-brand-secondary/25 hover:bg-white"
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl",
                          on
                            ? "bg-brand-secondary/20 text-brand-text"
                            : "bg-white text-brand-text/45 ring-1 ring-brand-surface"
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-brand-text">
                          {meta.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-brand-text/50">
                          {meta.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </SetupBlock>
            </div>

            <div className="space-y-4 pt-2">
            {error ? (
              <p
                className="rounded-2xl border border-brand-accent/25 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <Button
              disabled={starting || selected.length === 0 || types.length === 0}
              onClick={() => void handleStart()}
              className="h-12 w-full gap-2 rounded-2xl bg-brand-accent text-base text-white shadow-sm hover:bg-brand-accent/90 disabled:opacity-50"
            >
              {starting ? (
                <>
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  Starting…
                </>
              ) : (
                <>
                  <Rocket className="size-5" aria-hidden />
                  Start quiz
                </>
              )}
            </Button>
            {selected.length === 0 || types.length === 0 ? (
              <p className="text-center text-xs text-brand-text/45">
                {selected.length === 0
                  ? "Pick at least one chapter to continue."
                  : "Pick at least one question style to continue."}
              </p>
            ) : null}
            </div>
          </div>
        </div>
      </AssessmentShell>
    </>
  );
}

function SetupBlock({
  icon: Icon,
  iconClass,
  title,
  hint,
  action,
  children,
}: {
  icon: LucideIcon;
  iconClass: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-xl",
              iconClass
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-semibold text-brand-text">{title}</h2>
            {hint ? (
              <p className="text-xs text-brand-text/50">{hint}</p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function formatChapterId(id: string): string {
  const match = /^G(\d+)_C(\d+)/i.exec(id.trim());
  if (match) return `Chapter ${match[2]}`;
  return id.replace(/_/g, " ");
}
