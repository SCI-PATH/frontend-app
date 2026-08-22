"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { AssessmentShell } from "../components/AssessmentShell";
import { hasAnswer, QuestionRenderer } from "../components/QuestionRenderer";
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
  const [grade, setGrade] = useState(user.grade ?? 7);
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

  const surveyBody = {
    user_id: user.userId,
    grade,
    completed_chapter_ids: selectedChapters,
    past_grade_marks_range: marks,
    study_hours_per_week: hours,
    self_confidence: confidence,
    science_self_efficacy: efficacy,
    prerequisite_ready_count: prereqCount,
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

  return (
    <AssessmentShell
      title="Amplitude placement"
      subtitle="Find your starting science pathway (BASIC · INTERMEDIATE · ADVANCED)"
      maxWidth="2xl"
      backHref="/dashboard"
      backLabel="Home"
    >
      {error ? (
        <p
          className="mb-4 rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {step === "survey" ? (
        <Card className="border-brand-surface bg-white shadow-[0_18px_50px_-28px_rgba(114,9,183,0.25)] ring-0">
          <CardHeader>
            <Badge className="w-fit bg-brand-special/10 text-brand-special hover:bg-brand-special/10">
              Step 1 · Survey
            </Badge>
            <CardTitle className="text-xl text-brand-text">
              Tell us about your science journey
            </CardTitle>
            <CardDescription className="text-brand-text/65">
              {user.displayName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Field label="Grade">
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="h-10 w-full rounded-lg border border-brand-surface bg-brand-background/70 px-3 text-sm text-brand-text"
              >
                {[6, 7, 8, 9].map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Past science marks (required)">
              <div className="flex flex-wrap gap-2">
                {MARKS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMarks(m.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium",
                      marks === m.value
                        ? "border-brand-special bg-brand-special text-white"
                        : "border-brand-surface bg-brand-background text-brand-text"
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Chapters completed (select none if you have not started)">
              {chaptersLoading ? (
                <p className="text-sm text-brand-text/55">Loading chapters…</p>
              ) : chapters.length === 0 ? (
                <p className="text-sm text-brand-text/55">
                  No chapters returned for grade {grade}. You can still continue
                  with an empty selection.
                </p>
              ) : (
                <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
                  {chapters.map((ch) => {
                    const on = selectedChapters.includes(ch.chapter_id);
                    return (
                      <button
                        key={ch.chapter_id}
                        type="button"
                        onClick={() => toggleChapter(ch.chapter_id)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm font-medium",
                          on
                            ? "border-brand-primary bg-brand-primary text-white"
                            : "border-brand-surface bg-brand-background text-brand-text"
                        )}
                      >
                        {ch.chapter_title}
                      </button>
                    );
                  })}
                </div>
              )}
            </Field>

            <Field label={`Study hours / week: ${hours} (optional)`}>
              <input
                type="range"
                min={0}
                max={40}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full accent-brand-special"
              />
            </Field>

            <Field label={`Self-confidence: ${confidence} / 5 (optional)`}>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setConfidence(n)}
                    className={cn(
                      "size-10 rounded-xl border text-sm font-bold",
                      confidence === n
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-brand-surface bg-white text-brand-text"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label={`Science self-efficacy: ${efficacy} / 5 — “I can figure out science questions even when they are new or a bit hard.”`}
            >
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEfficacy(n)}
                    className={cn(
                      "size-10 rounded-xl border text-sm font-bold",
                      efficacy === n
                        ? "border-brand-special bg-brand-special text-white"
                        : "border-brand-surface bg-white text-brand-text"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>

            <Field label={`Prerequisites ready (${prereqCount} / 5)`}>
              <ul className="space-y-2">
                {PREREQS.map((label, i) => (
                  <li key={i}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-brand-text">
                      <input
                        type="checkbox"
                        checked={prereqChecks[i]}
                        onChange={(e) => {
                          const next = [...prereqChecks];
                          next[i] = e.target.checked;
                          setPrereqChecks(next);
                        }}
                        className="mt-1 size-4 accent-brand-primary"
                      />
                      <span>{label}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </Field>
          </CardContent>
          <CardFooter>
            <Button
              disabled={busy}
              onClick={() => void startQuiz()}
              className="h-11 w-full gap-2 bg-brand-special text-white hover:bg-brand-special/90"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
              Continue to 10-question quiz
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {step === "quiz" && questions[qi] ? (
        <Card className="border-brand-surface bg-white">
          <CardHeader className="flex flex-row items-center justify-between">
            <Badge className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
              Question {qi + 1} / {questions.length}
            </Badge>
            <Badge variant="outline">
              {questions[qi].question_type ?? "MCQ"}
            </Badge>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter className="justify-end">
            <Button
              disabled={!hasAnswer(current) || busy}
              onClick={submitCurrent}
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              {qi + 1 >= questions.length ? "Finish & evaluate" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      ) : null}

      {step === "evaluating" ? (
        <Card className="border-brand-surface bg-white">
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Loader2
              className="size-8 animate-spin text-brand-special"
              aria-hidden
            />
            <p className="text-sm font-medium text-brand-text">
              Calculating your pathway category…
            </p>
          </CardContent>
        </Card>
      ) : null}

      {step === "result" && result ? (
        <Card className="border-brand-surface bg-white animate-in fade-in zoom-in-95 duration-500">
          <div
            aria-hidden
            className="h-1.5 w-full bg-[linear-gradient(90deg,#7209B7_0%,#00A8E8_50%,#70E000_100%)]"
          />
          <CardHeader className="items-center text-center">
            <Badge className={CATEGORY_STYLE[displayCategory].bg}>
              {displayCategory}
            </Badge>
            <CardTitle className="text-2xl text-brand-text">
              Your initial category
            </CardTitle>
            <CardDescription>
              {CATEGORY_STYLE[displayCategory].label}
              {persistedCategory
                ? ` · Saved as ${persistedCategory}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <Score label="Weighted" value={result.weighted_score} />
              <Score label="Quiz (60%)" value={result.quiz_score} />
              <Score label="History (40%)" value={result.history_score} />
            </div>
          </CardContent>
          <CardFooter className="justify-center">
            <Button
              onClick={reset}
              variant="outline"
              className="border-brand-surface"
            >
              Retake amplitude
            </Button>
          </CardFooter>
        </Card>
      ) : null}
    </AssessmentShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-brand-text">{label}</label>
      {children}
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  const display =
    value <= 1 ? `${Math.round(value * 100)}%` : value.toFixed(1);
  return (
    <div className="rounded-xl border border-brand-surface bg-brand-background/70 px-2 py-3">
      <p className="text-xs text-brand-text/55">{label}</p>
      <p className="mt-1 text-lg font-semibold text-brand-text">{display}</p>
    </div>
  );
}
