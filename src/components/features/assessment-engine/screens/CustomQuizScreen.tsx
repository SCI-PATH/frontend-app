"use client";

import { useEffect, useState } from "react";
import { BookOpen, Layers, Loader2, Rocket, Target } from "lucide-react";

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
  NextQuestionResponse,
  QuestionType,
  QuizResults,
} from "../types";
import { AssessmentApiError } from "../types";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";
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

const TYPE_LABELS: Record<QuestionType, string> = {
  MCQ: "Multiple choice",
  TrueFalse: "True / False",
  ShortAnswer: "Short answer",
  MultiBlank: "Fill in the blanks",
};

type View = "setup" | "playing" | "results";

export function CustomQuizScreen() {
  const user = useAssessmentUser();
  const grade = user.grade ?? 6;
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
  const [view, setView] = useState<View>("setup");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handleRetry() {
    if (sessionId) {
      clearNextQuestionGate(sessionId);
      useQuizSessionStore.getState().setPendingNext(sessionId, null);
    }
    setSessionId(null);
    setInitialNext(null);
    setResults(null);
    setError(null);
    setView("setup");
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
      const allTypesSelected =
        types.length === ALL_TYPES.length &&
        ALL_TYPES.every((t) => types.includes(t));

      const session = await createCustomizableQuiz({
        student_id: user.userId,
        grade,
        chapters: selected,
        num_questions: numQuestions,
        ...(allTypesSelected || types.length === 0
          ? {}
          : { question_types: types }),
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

  if (view === "results" && sessionId) {
    return (
      <AssessmentShell
        title="Quiz results"
        subtitle="See your score and every question to review."
        maxWidth="3xl"
        backHref={STUDENT_HOME_PATH}
        backLabel="Home"
      >
        <ResultsSummary
          sessionId={sessionId}
          studentId={user.userId}
          results={results}
          onRetry={handleRetry}
        />
      </AssessmentShell>
    );
  }

  if (view === "playing" && sessionId) {
    return (
      <AssessmentShell
        title="Custom Quiz"
        subtitle="Adaptive practice in progress"
        maxWidth="2xl"
        backHref={STUDENT_HOME_PATH}
        backLabel="Home"
      >
        <QuizPlayer
          sessionId={sessionId}
          maxQuestions={numQuestions}
          initialNext={initialNext}
          onFinished={(res) => {
            setResults(res);
            setView("results");
          }}
          onRestart={handleRetry}
          restartLabel="Configure another quiz"
        />
      </AssessmentShell>
    );
  }

  const accent = ACCENT_STYLES.accent;
  const primary = ACCENT_STYLES.primary;

  return (
    <AssessmentShell
      title="Build your quiz"
      subtitle="Choose chapters, length, and question styles — then dive in."
      maxWidth="3xl"
      backHref={STUDENT_HOME_PATH}
      backLabel="Home"
    >
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

        <div className="relative space-y-10 px-5 py-7 sm:px-8 sm:py-9">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
                Grade {grade}
              </Badge>
              <Badge
                variant="outline"
                className="border-brand-surface text-brand-text/70"
              >
                {user.displayName}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-brand-text">
              Customizable adaptive quiz
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-brand-text/65">
              Pick what you want to practice for Grade {grade}.
            </p>
          </header>

          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  accent.bg,
                  accent.text
                )}
              >
                <Target className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-brand-text">Grade</h3>
                <p className="text-sm text-brand-text/55">Your learning level</p>
              </div>
            </div>
            <p className="pl-[3.25rem] text-lg font-semibold text-brand-text">
              Grade {grade}
            </p>
          </section>

          <section className="space-y-4 border-t border-brand-surface/80 pt-8">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  primary.bg,
                  primary.text
                )}
              >
                <BookOpen className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-brand-text">Chapters</h3>
                <p className="text-sm text-brand-text/55">
                  Select one or more chapters to practice
                </p>
              </div>
            </div>
            {chaptersLoading ? (
              <p className="pl-[3.25rem] text-sm text-brand-text/55">
                Loading chapters…
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {chapterChoices.map((ch) => {
                  const on = selected.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChapter(ch.id)}
                      className={cn(
                        "rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition-all duration-300",
                        on
                          ? cn(
                              "border-transparent bg-white shadow-md ring-2",
                              accent.ring,
                              "text-brand-text"
                            )
                          : "border-brand-surface bg-brand-background/70 text-brand-text hover:-translate-y-0.5 hover:border-brand-accent/25 hover:bg-white"
                      )}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="space-y-4 border-t border-brand-surface/80 pt-8">
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    ACCENT_STYLES.special.bg,
                    ACCENT_STYLES.special.text
                  )}
                >
                  <Layers className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold text-brand-text">
                    Number of questions
                  </h3>
                  <p className="text-sm text-brand-text/55">
                    How long should this session be?
                  </p>
                </div>
              </div>
              <span className="text-3xl font-bold tabular-nums text-brand-primary">
                {numQuestions}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full accent-brand-accent"
              aria-label="Number of questions"
            />
            <div className="flex justify-between text-xs font-medium text-brand-text/45">
              <span>1</span>
              <span>30</span>
            </div>
          </section>

          <section className="space-y-4 border-t border-brand-surface/80 pt-8">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  ACCENT_STYLES.secondary.bg,
                  ACCENT_STYLES.secondary.text
                )}
              >
                <Target className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-brand-text">Question types</h3>
                <p className="text-sm text-brand-text/55">
                  Leave all selected to include every style
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ALL_TYPES.map((t) => {
                const on = types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={cn(
                      "rounded-2xl border px-4 py-5 text-left transition-all duration-300",
                      on
                        ? cn(
                            "border-transparent bg-white shadow-md ring-2",
                            primary.ring
                          )
                        : "border-brand-surface bg-brand-background/70 text-brand-text/70 hover:-translate-y-0.5 hover:bg-white"
                    )}
                  >
                    <span className="block text-sm font-semibold text-brand-text">
                      {t}
                    </span>
                    <span className="mt-1 block text-xs text-brand-text/55">
                      {TYPE_LABELS[t]}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {error ? (
            <p
              className="rounded-2xl border border-brand-accent/25 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <Button
            disabled={starting}
            onClick={() => void handleStart()}
            className="h-12 w-full gap-2 rounded-2xl bg-brand-accent text-base text-white shadow-sm hover:bg-brand-accent/90"
          >
            {starting ? (
              <>
                <Loader2 className="size-5 animate-spin" aria-hidden />
                Starting…
              </>
            ) : (
              <>
                <Rocket className="size-5" aria-hidden />
                Start Quiz
              </>
            )}
          </Button>
        </div>
      </div>
    </AssessmentShell>
  );
}
