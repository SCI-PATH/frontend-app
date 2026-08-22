"use client";

import { useEffect, useState } from "react";
import { Loader2, Rocket } from "lucide-react";

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
import { fetchAmplitudeChapters } from "../api/amplitude";
import { createCustomizableQuiz } from "../api/quizzes";
import { chaptersForGrade } from "../data/catalog";
import { useActiveMockUser } from "../store/useMockUserStore";
import type { AmplitudeChapter, QuestionType } from "../types";
import { AssessmentApiError } from "../types";
import { AssessmentShell } from "../components/AssessmentShell";
import { QuizPlayer } from "../components/QuizPlayer";
import { cn } from "@/lib/utils";

const ALL_TYPES: QuestionType[] = [
  "MCQ",
  "TrueFalse",
  "ShortAnswer",
  "MultiBlank",
];

export function CustomQuizScreen() {
  const user = useActiveMockUser();
  const [grade, setGrade] = useState(user.grade ?? 6);
  const [apiChapters, setApiChapters] = useState<AmplitudeChapter[] | null>(
    null
  );
  const [chaptersLoading, setChaptersLoading] = useState(false);

  const [selected, setSelected] = useState<string[]>([]);
  const [numQuestions, setNumQuestions] = useState(5);
  const [types, setTypes] = useState<QuestionType[]>([...ALL_TYPES]);
  const [sessionId, setSessionId] = useState<string | null>(null);
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
        // Offline / API down — fall back to static catalog.
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

  async function handleStart() {
    if (user.role === "teacher") {
      setError("Switch to a student mock user to take a quiz.");
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
      setSessionId(id);
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

  if (sessionId) {
    return (
      <AssessmentShell
        title="Custom Quiz"
        subtitle="Adaptive practice in progress"
        maxWidth="2xl"
      >
        <QuizPlayer
          sessionId={sessionId}
          maxQuestions={numQuestions}
          onRestart={() => setSessionId(null)}
          restartLabel="Configure another quiz"
        />
      </AssessmentShell>
    );
  }

  return (
    <AssessmentShell
      title="Build your quiz"
      subtitle="Choose grade, chapters, length, and question styles — then dive in."
      maxWidth="3xl"
    >
      <Card className="overflow-hidden border-brand-surface bg-white/95 shadow-[0_18px_50px_-28px_rgba(0,168,232,0.4)] ring-0">
        <div
          aria-hidden
          className="h-1.5 w-full bg-[linear-gradient(90deg,#00A8E8_0%,#70E000_50%,#7209B7_100%)]"
        />
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
              Grade {grade}
            </Badge>
            <Badge variant="outline">{user.displayName}</Badge>
          </div>
          <CardTitle className="text-xl text-brand-text">
            Customizable adaptive quiz
          </CardTitle>
          <CardDescription className="text-brand-text/65">
            Chapter IDs use{" "}
            <code className="text-brand-primary">G{"{grade}"}_C{"{n}"}</code> —
            loaded from the amplitude chapters catalog when available.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-brand-text">Grade</h2>
            <select
              value={grade}
              onChange={(e) => setGrade(Number(e.target.value))}
              className="h-10 rounded-lg border border-brand-surface bg-brand-background/70 px-3 text-sm"
            >
              {[6, 7, 8, 9].map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-brand-text">Chapters</h2>
            {chaptersLoading ? (
              <p className="text-sm text-brand-text/55">Loading chapters…</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {chapterChoices.map((ch) => {
                  const on = selected.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => toggleChapter(ch.id)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-sm font-medium transition-all",
                        on
                          ? "border-brand-primary bg-brand-primary text-white shadow-sm"
                          : "border-brand-surface bg-brand-background text-brand-text hover:border-brand-primary/40"
                      )}
                    >
                      {ch.label}
                    </button>
                  );
                })}
              </div>
            )}
            {apiChapters == null && !chaptersLoading ? (
              <p className="text-xs text-brand-text/50">
                Using static chapter fallback (chapters API unavailable).
              </p>
            ) : null}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-brand-text">
                Number of questions
              </h2>
              <span className="text-2xl font-bold tabular-nums text-brand-primary">
                {numQuestions}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full accent-brand-primary"
            />
            <div className="flex justify-between text-xs text-brand-text/50">
              <span>1</span>
              <span>30</span>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-brand-text">
              Question types (all = omit filter)
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ALL_TYPES.map((t) => {
                const on = types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-medium transition-all",
                      on
                        ? "border-brand-secondary bg-brand-secondary/15 text-brand-text ring-1 ring-brand-secondary/40"
                        : "border-brand-surface bg-white text-brand-text/70 hover:bg-brand-surface/50"
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </section>

          {error ? (
            <p
              className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="border-brand-surface">
          <Button
            disabled={starting}
            onClick={() => void handleStart()}
            className="h-12 w-full gap-2 bg-brand-primary text-base text-white shadow-md shadow-brand-primary/30 hover:bg-brand-primary/90"
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
        </CardFooter>
      </Card>
    </AssessmentShell>
  );
}
