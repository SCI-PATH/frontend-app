"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Check,
  Clock,
  Loader2,
  Rocket,
  Send,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { Navbar } from "@/components/common/Navbar";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  evaluateAmplitude,
  fetchAmplitudeChapters,
  fetchAmplitudeQuiz,
  fetchInitialCategory,
  fetchPlacementStatus,
  resolveInitialCategory,
  submitAmplitudeSurvey,
} from "../api/amplitude";
import { useAssessmentUser } from "../store/useAssessmentUser";
import type {
  AmplitudeCategory,
  AmplitudeChapter,
  AmplitudeEvaluateResponse,
  AmplitudeQuizQuestion,
  AmplitudeSurveyRequest,
  PastGradeMarksRange,
} from "../types";
import { AssessmentApiError } from "../types";
import { STUDENT_LEARNING_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";
import { AssessmentShell } from "../components/AssessmentShell";
import { QuizExitGuard } from "../components/QuizExitGuard";
import { hasAnswer, QuestionRenderer } from "../components/QuestionRenderer";
import { ACCENT_STYLES } from "@/components/common/landing/landing-content";
import { cn } from "@/lib/utils";

type Step = "boot" | "survey" | "quiz" | "evaluating" | "result";

const MARKS: { value: PastGradeMarksRange; label: string }[] = [
  { value: "BELOW_50", label: "Below 50%" },
  { value: "50_75", label: "50–75%" },
  { value: "ABOVE_75", label: "Above 75%" },
];

const PREREQS = [
  "I can understand a short science paragraph and say what it is mainly about",
  "I can read a labelled diagram, table, or simple graph in science",
  "I can follow step-by-step instructions for a science activity or experiment",
  "I can explain a science idea in my own words (not only memorize facts)",
  "I can use simple measurements in science (length, time, mass, or temperature)",
];

const CATEGORY_STYLE: Record<
  AmplitudeCategory,
  { bg: string; label: string; title: string }
> = {
  BASIC: {
    bg: "bg-brand-accent/15 text-brand-accent",
    title: "Basic",
    label: "We'll start with building foundations — the right pace for where you are now.",
  },
  INTERMEDIATE: {
    bg: "bg-brand-primary/15 text-brand-primary",
    title: "Intermediate",
    label: "You're on a solid middle path — lessons will match your current level.",
  },
  ADVANCED: {
    bg: "bg-brand-secondary/20 text-brand-text",
    title: "Advanced",
    label: "You're ready for more challenge — we'll stretch your science skills.",
  },
};

function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value <= 1 ? `${Math.round(value * 100)}%` : `${Math.round(value)}%`;
}

function formatChapterId(id: string): string {
  const match = /^G(\d+)_C(\d+)/i.exec(id.trim());
  if (match) return `Chapter ${match[2]}`;
  return id.replace(/_/g, " ");
}

function serializeCurrent(current: string | string[]): string {
  return Array.isArray(current)
    ? current.map((v) => v.trim()).join(" | ")
    : String(current);
}

export function AmplitudeScreen() {
  const user = useAssessmentUser();
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const grade = user.grade ?? 7;
  const [chapters, setChapters] = useState<AmplitudeChapter[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const [step, setStep] = useState<Step>("boot");
  const [marks, setMarks] = useState<PastGradeMarksRange>("50_75");
  const [hours, setHours] = useState(5);
  const [confidence, setConfidence] = useState(3);
  const [efficacy, setEfficacy] = useState(4);
  const [prereqChecks, setPrereqChecks] = useState<boolean[]>(
    Array(5).fill(false)
  );

  const [questions, setQuestions] = useState<AmplitudeQuizQuestion[]>([]);
  const [qi, setQi] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [current, setCurrent] = useState<string | string[]>("");
  const [result, setResult] = useState<AmplitudeEvaluateResponse | null>(null);
  const [persistedCategory, setPersistedCategory] =
    useState<AmplitudeCategory | null>(null);
  const [savedScore, setSavedScore] = useState<number | null>(null);
  const [evaluatedThisVisit, setEvaluatedThisVisit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answersRef = useRef(answers);
  const currentRef = useRef(current);
  const qiRef = useRef(qi);
  const questionsRef = useRef(questions);
  answersRef.current = answers;
  currentRef.current = current;
  qiRef.current = qi;
  questionsRef.current = questions;

  const prereqCount = prereqChecks.filter(Boolean).length;
  const primary = ACCENT_STYLES.primary;
  const special = ACCENT_STYLES.special;
  const accent = ACCENT_STYLES.accent;

  const surveyBody = useMemo<AmplitudeSurveyRequest>(
    () => ({
      user_id: user.userId,
      grade,
      completed_chapters_count: selectedChapters.length,
      completed_chapter_ids: selectedChapters,
      past_grade_marks_range: marks,
      study_hours_per_week: hours,
      self_confidence: confidence,
      science_self_efficacy: efficacy,
      prerequisite_ready_count: prereqCount,
    }),
    [
      user.userId,
      grade,
      selectedChapters,
      marks,
      hours,
      confidence,
      efficacy,
      prereqCount,
    ]
  );
  const surveyBodyRef = useRef(surveyBody);
  surveyBodyRef.current = surveyBody;

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;
    async function boot() {
      // Already in this visit's quiz — don't bounce back to survey/result.
      if (
        step === "quiz" ||
        step === "evaluating" ||
        (step === "result" && evaluatedThisVisit)
      ) {
        return;
      }

      if (!user.userId || !user.isAuthenticated) {
        setStep("survey");
        return;
      }
      try {
        const status = await fetchPlacementStatus(user.userId);
        if (cancelled) return;
        if (status.completed && status.category) {
          setPersistedCategory(status.category);
          try {
            const persisted = await fetchInitialCategory(user.userId);
            if (cancelled) return;
            const category =
              resolveInitialCategory(persisted) ?? status.category;
            setPersistedCategory(category);
            setSavedScore(
              persisted.initial_category_score ?? persisted.weighted_score ?? null
            );
          } catch {
            if (!cancelled) setSavedScore(null);
          }
          setStep("result");
          return;
        }
      } catch {
        /* fall through to survey */
      }
      if (!cancelled) setStep("survey");
    }
    void boot();
    return () => {
      cancelled = true;
    };
    // step / evaluatedThisVisit are read as a guard; boot should re-run on auth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.userId, user.isAuthenticated, hasHydrated]);

  useEffect(() => {
    let cancelled = false;
    async function loadChapters() {
      setChaptersLoading(true);
      try {
        const res = await fetchAmplitudeChapters(grade);
        if (cancelled) return;
        setChapters(res.chapters ?? []);
        setSelectedChapters([]);
      } catch {
        if (!cancelled) {
          setChapters([]);
          setSelectedChapters([]);
        }
      } finally {
        if (!cancelled) setChaptersLoading(false);
      }
    }
    void loadChapters();
    return () => {
      cancelled = true;
    };
  }, [grade]);

  const sortedChapters = useMemo(
    () =>
      [...chapters].sort(
        (a, b) =>
          (a.chapter ?? 0) - (b.chapter ?? 0) ||
          a.chapter_id.localeCompare(b.chapter_id)
      ),
    [chapters]
  );
  const allChaptersSelected =
    chapters.length > 0 && selectedChapters.length === chapters.length;

  function toggleChapter(id: string) {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function persistEvaluation(res: AmplitudeEvaluateResponse) {
    setResult(res);
    setEvaluatedThisVisit(true);
    setPersistedCategory(res.category);
    try {
      const persisted = await fetchInitialCategory(user.userId);
      setPersistedCategory(
        resolveInitialCategory(persisted) ?? res.category
      );
      setSavedScore(
        persisted.initial_category_score ?? res.weighted_score ?? null
      );
    } catch {
      setSavedScore(res.weighted_score);
    }
  }
  const persistEvaluationRef = useRef(persistEvaluation);
  persistEvaluationRef.current = persistEvaluation;

  async function startQuiz() {
    if (user.role !== "student") {
      setError("The aptitude placement test is available to student accounts.");
      return;
    }
    if (!user.userId) {
      setError("Sign in to start the placement test.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitAmplitudeSurvey(surveyBodyRef.current);
      const quiz = await fetchAmplitudeQuiz(grade);
      const list = quiz.questions ?? [];
      if (list.length === 0) {
        throw new AssessmentApiError(
          500,
          "Aptitude quiz returned no questions (is the placement bank generated for this grade?)"
        );
      }
      setQuestions(list);
      setQi(0);
      setAnswers({});
      setCurrent("");
      setStep("quiz");
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not start aptitude test"
      );
    } finally {
      setBusy(false);
    }
  }

  async function advanceOrEvaluate(nextAnswers: Record<string, string>) {
    if (qi + 1 < questions.length) {
      setQi((i) => i + 1);
      setCurrent("");
      return;
    }
    setStep("evaluating");
    setBusy(true);
    try {
      const res = await evaluateAmplitude({
        ...surveyBodyRef.current,
        answers: nextAnswers,
      });
      await persistEvaluation(res);
      setStep("result");
    } catch (err) {
      setError(
        err instanceof AssessmentApiError ? err.message : "Evaluation failed"
      );
      setStep("quiz");
    } finally {
      setBusy(false);
    }
  }

  function submitCurrent() {
    const q = questions[qi];
    if (!q || !hasAnswer(current)) return;
    const nextAnswers = {
      ...answers,
      [q.question_id]: serializeCurrent(current),
    };
    setAnswers(nextAnswers);
    void advanceOrEvaluate(nextAnswers);
  }

  const placeWithCurrentAnswers = useCallback(async () => {
    const q = questionsRef.current[qiRef.current];
    const cur = currentRef.current;
    let nextAnswers = { ...answersRef.current };
    if (q && hasAnswer(cur)) {
      nextAnswers = {
        ...nextAnswers,
        [q.question_id]: serializeCurrent(cur),
      };
    }
    const body = surveyBodyRef.current;
    if (!body.user_id) {
      throw new AssessmentApiError(401, "Sign in to save placement.");
    }
    const res = await evaluateAmplitude({
      ...body,
      answers: nextAnswers,
    });
    await persistEvaluationRef.current(res);
  }, []);

  const displayCategory: AmplitudeCategory =
    result?.category ?? persistedCategory ?? "INTERMEDIATE";

  if (step === "boot") {
    return (
      <>
        <Navbar />
        <AssessmentShell maxWidth="2xl" hideHeader title="">
          <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-sm">
            <BrandGradientBar />
            <div className="flex flex-col items-center gap-3 px-6 py-16">
              <Loader2
                className="size-8 animate-spin text-brand-primary"
                aria-hidden
              />
              <p className="text-sm font-medium text-brand-text">
                Checking placement…
              </p>
            </div>
          </div>
        </AssessmentShell>
      </>
    );
  }

  if (step === "quiz" && questions[qi]) {
    const q = questions[qi];
    const progressDen = questions.length;
    const progressNum = qi + 1;
    const progressPct = Math.min(
      100,
      Math.round((progressNum / progressDen) * 100)
    );
    const dok = q.dok_level ?? null;

    const quizUi = (
      <div className="mx-auto w-full max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
        {error ? (
          <p
            className="mb-4 rounded-2xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <div className="overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-[0_18px_50px_-28px_rgba(0,168,232,0.35)]">
          <BrandGradientBar />
          <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
                    {q.question_type ?? "MCQ"}
                  </Badge>
                  {dok != null ? (
                    <Badge
                      variant="outline"
                      className="border-brand-special/30 bg-brand-special/8 text-brand-special"
                    >
                      DOK {dok}
                    </Badge>
                  ) : null}
                  {q.chapter_name ? (
                    <span className="max-w-[14rem] truncate text-xs text-brand-text/50 sm:max-w-xs">
                      {q.chapter_name}
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold tabular-nums text-brand-text/70">
                  Question {progressNum} / {progressDen}
                </p>
              </div>
            </div>

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

            <QuestionRenderer
              questionType={
                q.question_type === "TrueFalse" ? "TrueFalse" : "MCQ"
              }
              prompt={q.prompt}
              options={q.options}
              value={typeof current === "string" ? current : ""}
              onChange={setCurrent}
              disabled={busy}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-brand-surface/80 pt-4">
              <p className="text-xs text-brand-text/45">
                Choose carefully — you submit once per question.
              </p>
              <Button
                disabled={!hasAnswer(current) || busy}
                onClick={submitCurrent}
                className="h-11 gap-2 rounded-xl bg-brand-primary px-6 text-white shadow-md shadow-brand-primary/25 hover:bg-brand-primary/90"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Saving…
                  </>
                ) : qi + 1 >= questions.length ? (
                  <>
                    Finish &amp; evaluate
                    <Send className="size-4" aria-hidden />
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
      </div>
    );

    return (
      <>
        <Navbar />
        <AssessmentShell
          maxWidth="2xl"
          hideHeader
          title=""
          className="flex flex-col items-center justify-center"
        >
          <QuizExitGuard
            active
            title="Leave the aptitude test?"
            description="We'll score the answers you've submitted so far. Unanswered questions count as incorrect. You'll be placed into a category and won't retake this test from here."
            confirmLabel="Score and leave"
            cancelLabel="Stay and finish"
            onConfirmLeave={placeWithCurrentAnswers}
          >
            {quizUi}
          </QuizExitGuard>
        </AssessmentShell>
      </>
    );
  }

  if (step === "evaluating") {
    return (
      <>
        <Navbar />
        <AssessmentShell maxWidth="2xl" hideHeader title="">
          <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-sm">
            <BrandGradientBar />
            <div className="flex flex-col items-center gap-3 px-6 py-16">
              <Loader2
                className="size-8 animate-spin text-brand-primary"
                aria-hidden
              />
              <p className="text-sm font-medium text-brand-text">
                Calculating your pathway category…
              </p>
              <p className="text-xs text-brand-text/55">
                Scoring your answers with the survey you just completed
              </p>
            </div>
          </div>
        </AssessmentShell>
      </>
    );
  }

  if (step === "result" && (result || persistedCategory)) {
    return (
      <>
        <Navbar />
        <AssessmentShell
          title="Placement result"
          subtitle="Your starting science pathway"
          maxWidth="2xl"
          backHref=""
        >
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
                  <Badge
                    className={cn(
                      "mb-3 hover:bg-inherit",
                      CATEGORY_STYLE[displayCategory].bg
                    )}
                  >
                    <Sparkles className="mr-1 size-3.5" aria-hidden />
                    {CATEGORY_STYLE[displayCategory].title} pathway
                  </Badge>
                  <h2 className="text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
                    {CATEGORY_STYLE[displayCategory].title} placement
                  </h2>
                  <p className="mt-2 max-w-md text-base text-brand-text/65">
                    {CATEGORY_STYLE[displayCategory].label}
                  </p>

                  {(evaluatedThisVisit && result) || savedScore != null ? (
                    <div className="mt-6 w-full max-w-sm">
                      <ScoreStat
                        label="Your overall score"
                        value={formatPercent(
                          evaluatedThisVisit && result
                            ? result.weighted_score
                            : savedScore
                        )}
                        sub="Based on your quiz answers and survey — used to choose your starting level"
                        accent="primary"
                      />
                    </div>
                  ) : null}

                  <Button
                    asChild
                    className="mt-8 h-12 rounded-2xl bg-brand-accent px-8 text-base text-white shadow-sm hover:bg-brand-accent/90"
                  >
                    <Link href={STUDENT_LEARNING_PATH}>Take a course</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </AssessmentShell>
      </>
    );
  }

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
                Find your pathway
              </h1>
              <p className="mx-auto max-w-lg text-base leading-relaxed text-brand-text/65 sm:mx-0">
                A short survey for Grade {grade}, then a 10-question placement
                quiz.
              </p>
            </header>

            <div className="space-y-12 sm:space-y-14">
              <SetupBlock
                icon={Target}
                iconClass={cn(primary.bg, primary.text)}
                title="Past science marks"
                hint="Required"
              >
                <div className="flex flex-wrap gap-2">
                  {MARKS.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMarks(m.value)}
                      className={cn(
                        "rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all duration-200",
                        marks === m.value
                          ? "border-brand-primary/30 bg-brand-primary/5 text-brand-text ring-2 ring-brand-primary/25"
                          : "border-brand-surface bg-brand-background/50 text-brand-text hover:border-brand-primary/20 hover:bg-white"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </SetupBlock>

              <SetupBlock
                icon={BookOpen}
                iconClass={cn(primary.bg, primary.text)}
                title="Chapters completed"
                hint={
                  chaptersLoading
                    ? "Loading…"
                    : selectedChapters.length === 0
                      ? `Select none if you have not started Grade ${grade} yet`
                      : `${selectedChapters.length} of ${chapters.length} selected`
                }
                action={
                  !chaptersLoading && chapters.length > 0 ? (
                    <button
                      type="button"
                      onClick={
                        allChaptersSelected
                          ? () => setSelectedChapters([])
                          : () =>
                              setSelectedChapters(
                                chapters.map((c) => c.chapter_id)
                              )
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
                ) : chapters.length === 0 ? (
                  <p className="text-sm text-brand-text/55">
                    No chapters returned for grade {grade}. You can still
                    continue with an empty selection.
                  </p>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {sortedChapters.map((ch) => {
                      const on = selectedChapters.includes(ch.chapter_id);
                      const num =
                        typeof ch.chapter === "number" && ch.chapter > 0
                          ? ch.chapter
                          : null;
                      return (
                        <button
                          key={ch.chapter_id}
                          type="button"
                          onClick={() => toggleChapter(ch.chapter_id)}
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
                            <Check
                              className="size-3.5"
                              strokeWidth={3}
                              aria-hidden
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold leading-snug text-brand-text">
                              {num != null
                                ? `Chapter ${num}`
                                : formatChapterId(ch.chapter_id)}
                              {ch.chapter_title ? ` · ${ch.chapter_title}` : ""}
                            </span>
                            <span className="mt-0.5 block text-xs text-brand-text/45">
                              {formatChapterId(ch.chapter_id)}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </SetupBlock>

              <SetupBlock
                icon={Clock}
                iconClass={cn(special.bg, special.text)}
                title="Study hours / week"
                hint={`Optional · ${hours}h`}
              >
                <div className="rounded-2xl border border-brand-surface/80 bg-brand-background/40 px-4 py-4">
                  <input
                    type="range"
                    min={0}
                    max={40}
                    step={0.5}
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full accent-brand-primary"
                    aria-label="Study hours per week"
                  />
                  <div className="mt-2 flex justify-between text-xs font-medium tabular-nums text-brand-text/45">
                    <span>0</span>
                    <span>20</span>
                    <span>40</span>
                  </div>
                </div>
              </SetupBlock>

              <SetupBlock
                icon={Sparkles}
                iconClass={cn(primary.bg, primary.text)}
                title="Self-confidence"
                hint={`Optional · ${confidence} / 5`}
              >
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setConfidence(n)}
                      className={cn(
                        "size-11 rounded-2xl border text-sm font-bold transition-all duration-200",
                        confidence === n
                          ? "border-brand-primary/30 bg-brand-primary text-white ring-2 ring-brand-primary/25"
                          : "border-brand-surface bg-brand-background/50 text-brand-text hover:border-brand-primary/20 hover:bg-white"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </SetupBlock>

              <SetupBlock
                icon={Sparkles}
                iconClass={cn(special.bg, special.text)}
                title="Science self-efficacy"
                hint={`${efficacy} / 5 — I can figure out new or hard science questions`}
              >
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEfficacy(n)}
                      className={cn(
                        "size-11 rounded-2xl border text-sm font-bold transition-all duration-200",
                        efficacy === n
                          ? "border-brand-secondary/35 bg-brand-secondary/8 text-brand-text ring-2 ring-brand-secondary/25"
                          : "border-brand-surface bg-brand-background/50 text-brand-text hover:border-brand-secondary/25 hover:bg-white"
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </SetupBlock>

              <SetupBlock
                icon={Check}
                iconClass={cn(accent.bg, accent.text)}
                title="Prerequisites ready"
                hint={`${prereqCount} / 5 selected`}
              >
                <div className="grid gap-2.5">
                  {PREREQS.map((label, i) => {
                    const on = prereqChecks[i];
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          const next = [...prereqChecks];
                          next[i] = !next[i];
                          setPrereqChecks(next);
                        }}
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
                          <Check
                            className="size-3.5"
                            strokeWidth={3}
                            aria-hidden
                          />
                        </span>
                        <span className="text-sm leading-snug text-brand-text">
                          {label}
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
                disabled={busy}
                onClick={() => void startQuiz()}
                className="h-12 w-full gap-2 rounded-2xl bg-brand-accent text-base text-white shadow-sm hover:bg-brand-accent/90 disabled:opacity-50"
              >
                {busy ? (
                  <>
                    <Loader2 className="size-5 animate-spin" aria-hidden />
                    Starting…
                  </>
                ) : (
                  <>
                    <Rocket className="size-5" aria-hidden />
                    Continue to 10-question quiz
                  </>
                )}
              </Button>
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
