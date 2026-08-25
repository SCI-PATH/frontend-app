"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Check,
  Clock,
  GraduationCap,
  Loader2,
  Sparkles,
  Target,
} from "lucide-react";

import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  evaluateAmplitude,
  fetchAmplitudeChapters,
  fetchAmplitudeQuiz,
  fetchInitialCategory,
  submitAmplitudeSurvey,
} from "../api/amplitude";
import { useAssessmentUser } from "../store/useAssessmentUser";
import type {
  AmplitudeCategory,
  AmplitudeChapter,
  AmplitudeEvaluateResponse,
  AmplitudeQuizQuestion,
  PastGradeMarksRange,
} from "../types";
import { AssessmentApiError } from "../types";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";
import { AssessmentShell } from "../components/AssessmentShell";
import { hasAnswer, QuestionRenderer } from "../components/QuestionRenderer";
import { ACCENT_STYLES } from "@/components/common/landing/landing-content";
import { cn } from "@/lib/utils";

type Step = "survey" | "quiz" | "evaluating" | "result";

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
  { bg: string; label: string }
> = {
  BASIC: {
    bg: "bg-brand-accent/15 text-brand-accent",
    label: "Building foundations",
  },
  INTERMEDIATE: {
    bg: "bg-brand-primary/15 text-brand-primary",
    label: "Solid middle path",
  },
  ADVANCED: {
    bg: "bg-brand-secondary/20 text-brand-text",
    label: "Ready for challenges",
  },
};

export function AmplitudeScreen() {
  const user = useAssessmentUser();
  const grade = user.grade ?? 7;
  const [chapters, setChapters] = useState<AmplitudeChapter[]>([]);
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const [step, setStep] = useState<Step>("survey");
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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const prereqCount = prereqChecks.filter(Boolean).length;
  const accent = ACCENT_STYLES.accent;
  const primary = ACCENT_STYLES.primary;
  const special = ACCENT_STYLES.special;

  const surveyBody = {
    user_id: user.userId,
    grade,
    completed_chapters_count: selectedChapters.length,
    completed_chapter_ids: selectedChapters,
    past_grade_marks_range: marks,
    study_hours_per_week: hours,
    self_confidence: confidence,
  };

  function toggleChapter(id: string) {
    setSelectedChapters((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function startQuiz() {
    if (user.role !== "student") {
      setError("The amplitude placement test is available to student accounts.");
      return;
    }
    if (!user.userId) {
      setError("Sign in to start the placement test.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitAmplitudeSurvey(surveyBody);
      const quiz = await fetchAmplitudeQuiz(grade);
      const list = quiz.questions ?? [];
      if (list.length === 0) {
        throw new AssessmentApiError(
          500,
          "Amplitude quiz returned no questions (is the placement bank generated for this grade?)"
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
          : "Could not start amplitude"
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
        ...surveyBody,
        answers: nextAnswers,
      });
      setResult(res);
      try {
        const persisted = await fetchInitialCategory(user.userId);
        setPersistedCategory(
          persisted.initial_category ??
            persisted.placement_category ??
            persisted.category ??
            null
        );
      } catch {
        setPersistedCategory(null);
      }
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
    const serialized = Array.isArray(current)
      ? current.map((v) => v.trim()).join(" | ")
      : String(current);
    const nextAnswers = { ...answers, [q.question_id]: serialized };
    setAnswers(nextAnswers);
    void advanceOrEvaluate(nextAnswers);
  }

  function reset() {
    setStep("survey");
    setResult(null);
    setPersistedCategory(null);
    setQuestions([]);
    setQi(0);
    setAnswers({});
    setError(null);
  }

  const displayCategory =
    result?.category ?? persistedCategory ?? ("INTERMEDIATE" as AmplitudeCategory);

  if (step === "quiz" && questions[qi]) {
    return (
      <AssessmentShell
        title="Amplitude quiz"
        subtitle={`Grade ${grade} · Question ${qi + 1} of ${questions.length}`}
        maxWidth="2xl"
        backHref={STUDENT_HOME_PATH}
        backLabel="Home"
      >
        {error ? (
          <p
            className="mb-4 rounded-2xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        <div className="overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-sm">
          <BrandGradientBar />
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-surface/80 px-5 py-4 sm:px-6">
            <Badge className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
              Question {qi + 1} / {questions.length}
            </Badge>
            <Badge variant="outline" className="border-brand-surface">
              {questions[qi].question_type ?? "MCQ"}
            </Badge>
          </div>
          <div className="px-5 py-6 sm:px-6">
            <QuestionRenderer
              questionType={
                questions[qi].question_type === "TrueFalse"
                  ? "TrueFalse"
                  : "MCQ"
              }
              prompt={questions[qi].prompt}
              options={questions[qi].options}
              value={typeof current === "string" ? current : ""}
              onChange={setCurrent}
            />
          </div>
          <div className="flex justify-end border-t border-brand-surface/80 px-5 py-4 sm:px-6">
            <Button
              disabled={!hasAnswer(current) || busy}
              onClick={submitCurrent}
              className="h-11 rounded-xl bg-brand-primary px-6 text-white hover:bg-brand-primary/90"
            >
              {qi + 1 >= questions.length ? "Finish & evaluate" : "Next"}
            </Button>
          </div>
        </div>
      </AssessmentShell>
    );
  }

  if (step === "evaluating") {
    return (
      <AssessmentShell
        title="Amplitude placement"
        subtitle="Almost there"
        maxWidth="2xl"
        backHref={STUDENT_HOME_PATH}
        backLabel="Home"
      >
        <div className="flex flex-col items-center gap-3 rounded-[2rem] border border-brand-surface bg-white py-16 shadow-sm">
          <Loader2
            className="size-8 animate-spin text-brand-special"
            aria-hidden
          />
          <p className="text-sm font-medium text-brand-text">
            Calculating your pathway category…
          </p>
        </div>
      </AssessmentShell>
    );
  }

  if (step === "result" && result) {
    return (
      <AssessmentShell
        title="Placement result"
        subtitle="Your starting science pathway"
        maxWidth="2xl"
        backHref={STUDENT_HOME_PATH}
        backLabel="Home"
      >
        <div className="overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <BrandGradientBar />
          <div className="space-y-6 px-6 py-8 text-center sm:px-8">
            <Badge className={CATEGORY_STYLE[displayCategory].bg}>
              {displayCategory}
            </Badge>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-brand-text">
                Your initial category
              </h2>
              <p className="mt-2 text-brand-text/65">
                {CATEGORY_STYLE[displayCategory].label}
                {persistedCategory ? ` · Saved as ${persistedCategory}` : ""}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <ScoreChip label="Weighted" value={result.weighted_score} />
              <ScoreChip label="Quiz (60%)" value={result.quiz_score} />
              <ScoreChip label="History (40%)" value={result.history_score} />
            </div>
            <Button
              asChild
              className="rounded-xl bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              <a href={STUDENT_HOME_PATH}>Go to home</a>
            </Button>
          </div>
        </div>
      </AssessmentShell>
    );
  }

  return (
    <AssessmentShell
      title="Amplitude placement"
      subtitle="Find your starting science pathway (BASIC · INTERMEDIATE · ADVANCED)"
      maxWidth="3xl"
      backHref={STUDENT_HOME_PATH}
      backLabel="Home"
    >
      {error ? (
        <p
          className="mb-4 rounded-2xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="relative overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-sm">
        <BrandGradientBar />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-16 top-10 size-56 rounded-full bg-brand-special/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 bottom-8 size-48 rounded-full bg-brand-primary/10 blur-3xl"
        />

        <div className="relative space-y-10 px-5 py-7 sm:px-8 sm:py-9">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-brand-special/10 text-brand-special hover:bg-brand-special/10">
                Step 1 · Survey
              </Badge>
              <Badge
                variant="outline"
                className="border-brand-surface text-brand-text/70"
              >
                {user.displayName}
              </Badge>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-brand-text">
              Tell us about your science journey
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-brand-text/65">
              A few quick questions for Grade {grade}, then a 10-item placement
              quiz.
            </p>
          </header>

          {/* Grade — locked from profile */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  accent.bg,
                  accent.text
                )}
              >
                <GraduationCap className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-brand-text">Grade</h3>
                <p className="text-sm text-brand-text/55">From your profile</p>
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
                <Target className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-brand-text">
                  Past science marks
                </h3>
                <p className="text-sm text-brand-text/55">Required</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pl-[3.25rem]">
              {MARKS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMarks(m.value)}
                  className={cn(
                    "rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors",
                    marks === m.value
                      ? "border-brand-special bg-brand-special text-white"
                      : "border-brand-surface bg-brand-background/70 text-brand-text hover:border-brand-special/40"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4 border-t border-brand-surface/80 pt-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl",
                    special.bg,
                    special.text
                  )}
                >
                  <BookOpen className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold text-brand-text">
                    Chapters completed
                  </h3>
                  <p className="text-sm text-brand-text/55">
                    {selectedChapters.length === 0
                      ? `Select none if you have not started Grade ${grade} yet`
                      : `${selectedChapters.length} selected`}
                  </p>
                </div>
              </div>
              {chapters.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedChapters(chapters.map((c) => c.chapter_id))
                    }
                    className="rounded-lg border border-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-brand-primary/5"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChapters([])}
                    disabled={selectedChapters.length === 0}
                    className="rounded-lg border border-brand-surface px-3 py-1.5 text-xs font-semibold text-brand-text/70 hover:bg-brand-background disabled:opacity-40"
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>
            <div className="sm:pl-[3.25rem]">
              {chaptersLoading ? (
                <p className="text-sm text-brand-text/55">Loading chapters…</p>
              ) : chapters.length === 0 ? (
                <p className="text-sm text-brand-text/55">
                  No chapters returned for grade {grade}. You can still continue
                  with an empty selection.
                </p>
              ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto rounded-2xl border border-brand-surface bg-brand-background/40 p-2">
                  {[...chapters]
                    .sort(
                      (a, b) =>
                        (a.chapter ?? 0) - (b.chapter ?? 0) ||
                        a.chapter_id.localeCompare(b.chapter_id)
                    )
                    .map((ch) => {
                      const on = selectedChapters.includes(ch.chapter_id);
                      const num =
                        typeof ch.chapter === "number" && ch.chapter > 0
                          ? ch.chapter
                          : null;
                      return (
                        <li key={ch.chapter_id}>
                          <button
                            type="button"
                            onClick={() => toggleChapter(ch.chapter_id)}
                            aria-pressed={on}
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                              on
                                ? "border-brand-primary bg-brand-primary/10 ring-1 ring-brand-primary/25"
                                : "border-transparent bg-white hover:border-brand-surface hover:bg-brand-background/80"
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-5 shrink-0 items-center justify-center rounded-md border",
                                on
                                  ? "border-brand-primary bg-brand-primary text-white"
                                  : "border-brand-surface bg-white text-transparent"
                              )}
                              aria-hidden
                            >
                              <Check className="size-3.5" strokeWidth={3} />
                            </span>
                            <span
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums",
                                on
                                  ? "bg-brand-primary text-white"
                                  : "bg-brand-primary/10 text-brand-primary"
                              )}
                            >
                              {num != null ? num : "—"}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-brand-text">
                                {num != null ? `Chapter ${num}` : ch.chapter_id}
                                {ch.chapter_title
                                  ? ` · ${ch.chapter_title}`
                                  : ""}
                              </span>
                              <span className="mt-0.5 block truncate text-xs text-brand-text/45">
                                {ch.chapter_id}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </section>

          <section className="space-y-4 border-t border-brand-surface/80 pt-8">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-xl",
                  accent.bg,
                  accent.text
                )}
              >
                <Clock className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-brand-text">
                  Study hours / week
                </h3>
                <p className="text-sm text-brand-text/55">
                  Optional · currently {hours}h
                </p>
              </div>
            </div>
            <div className="pl-[3.25rem]">
              <input
                type="range"
                min={0}
                max={40}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full accent-brand-special"
              />
            </div>
          </section>

          <section className="space-y-4 border-t border-brand-surface/80 pt-8">
            <FieldLabel
              title="Self-confidence"
              subtitle={`Optional · ${confidence} / 5`}
            />
            <div className="flex flex-wrap gap-2 pl-[3.25rem]">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setConfidence(n)}
                  className={cn(
                    "size-11 rounded-xl border text-sm font-bold transition-colors",
                    confidence === n
                      ? "border-brand-primary bg-brand-primary text-white"
                      : "border-brand-surface bg-white text-brand-text hover:border-brand-primary/40"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4 border-t border-brand-surface/80 pt-8">
            <FieldLabel
              title="Science self-efficacy"
              subtitle={`${efficacy} / 5 — I can figure out new or hard science questions`}
            />
            <div className="flex flex-wrap gap-2 pl-[3.25rem]">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setEfficacy(n)}
                  className={cn(
                    "size-11 rounded-xl border text-sm font-bold transition-colors",
                    efficacy === n
                      ? "border-brand-special bg-brand-special text-white"
                      : "border-brand-surface bg-white text-brand-text hover:border-brand-special/40"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4 border-t border-brand-surface/80 pt-8">
            <FieldLabel
              title="Prerequisites ready"
              subtitle={`${prereqCount} / 5 selected`}
            />
            <ul className="space-y-2 pl-[3.25rem]">
              {PREREQS.map((label, i) => (
                <li key={i}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-surface/80 bg-brand-background/40 px-3 py-3 text-sm text-brand-text transition-colors hover:border-brand-primary/30">
                    <input
                      type="checkbox"
                      checked={prereqChecks[i]}
                      onChange={(e) => {
                        const next = [...prereqChecks];
                        next[i] = e.target.checked;
                        setPrereqChecks(next);
                      }}
                      className="mt-0.5 size-4 accent-brand-primary"
                    />
                    <span>{label}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <div className="border-t border-brand-surface/80 pt-6">
            <Button
              disabled={busy}
              onClick={() => void startQuiz()}
              className="h-12 w-full gap-2 rounded-2xl bg-brand-special text-base text-white hover:bg-brand-special/90"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              Continue to 10-question quiz
            </Button>
          </div>
        </div>
      </div>
    </AssessmentShell>
  );
}

function FieldLabel({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
        <Sparkles className="size-5" aria-hidden />
      </span>
      <div>
        <h3 className="font-semibold text-brand-text">{title}</h3>
        <p className="text-sm text-brand-text/55">{subtitle}</p>
      </div>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  const display =
    value <= 1 ? `${Math.round(value * 100)}%` : value.toFixed(1);
  return (
    <div className="rounded-2xl border border-brand-surface bg-brand-background/70 px-2 py-3">
      <p className="text-xs text-brand-text/55">{label}</p>
      <p className="mt-1 text-lg font-semibold text-brand-text">{display}</p>
    </div>
  );
}
