"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { seedNextQuestion } from "../api/nextQuestionGate";
import { fetchNextQuestion, triggerPostLessonQuiz } from "../api/quizzes";
import { useAssessmentUser } from "../store/useAssessmentUser";
import { useQuizSessionStore } from "../store/useQuizSessionStore";
import { AssessmentApiError } from "../types";
import type { NextQuestionResponse } from "../types";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";
import { AssessmentShell } from "../components/AssessmentShell";
import { QuizPlayer } from "../components/QuizPlayer";

/**
 * Post-lesson quiz — no start screen; begins immediately.
 *
 * Prefetches the first GET /next here so QuizPlayer never burns a second slot
 * on mount (backend increments questions_asked on every /next).
 *
 * // TODO: INTEGRATION - Component 1 should navigate here after lesson complete:
 * // /assessment/post-lesson?chapter_id=G6_C8&grade=6
 */
export function PostLessonScreen() {
  const searchParams = useSearchParams();
  const user = useAssessmentUser();
  const chapterId = searchParams.get("chapter_id") ?? "G6_C8";
  const gradeParam = searchParams.get("grade");
  const grade = gradeParam ? Number(gradeParam) : user.grade ?? 6;

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [initialNext, setInitialNext] = useState<NextQuestionResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const started = useRef(false);

  async function startQuiz() {
    const session = await triggerPostLessonQuiz({
      student_id: user.userId,
      chapter_id: chapterId,
      grade,
    });
    const id = session.session_id;
    if (!id) {
      throw new AssessmentApiError(500, "No session_id returned");
    }
    const first = await fetchNextQuestion(id);
    seedNextQuestion(id, first);
    useQuizSessionStore.getState().setPendingNext(id, first);
    setInitialNext(first);
    setSessionId(id);
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void boot();

    async function boot() {
      setLoading(true);
      setError(null);
      if (user.role !== "student") {
        setError("Post-lesson quizzes are available to student accounts.");
        setLoading(false);
        return;
      }
      if (!user.userId) {
        setError("Sign in to start a post-lesson quiz.");
        setLoading(false);
        return;
      }
      try {
        await startQuiz();
      } catch (err) {
        setError(
          err instanceof AssessmentApiError
            ? err.message
            : "Could not start post-lesson quiz"
        );
      } finally {
        setLoading(false);
      }
    }
    // Intentionally run once on mount for seamless post-lesson start.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function retry() {
    setError(null);
    setLoading(true);
    setSessionId(null);
    setInitialNext(null);
    try {
      await startQuiz();
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not start post-lesson quiz"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <AssessmentShell
      title="Post-lesson check-in"
      subtitle={`Chapter ${chapterId} · Grade ${grade} · up to 15 questions`}
      maxWidth="2xl"
      backHref={STUDENT_HOME_PATH}
      backLabel="Home"
    >
      {loading ? (
        <Card className="border-brand-surface bg-white">
          <CardContent className="flex flex-col items-center gap-3 py-16">
            <Loader2
              className="size-8 animate-spin text-brand-primary"
              aria-hidden
            />
            <p className="text-sm font-medium text-brand-text">
              Jumping straight into your quiz…
            </p>
            <p className="text-xs text-brand-text/55">
              Seamless handoff from the lesson you just finished
            </p>
          </CardContent>
        </Card>
      ) : null}

      {error ? (
        <Card className="border-brand-accent/40 bg-white">
          <CardHeader>
            <CardTitle className="text-brand-text">Could not start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent">
              {error}
            </p>
            <Button
              onClick={retry}
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {sessionId && initialNext ? (
        <QuizPlayer
          sessionId={sessionId}
          maxQuestions={15}
          initialNext={initialNext}
          onRestart={retry}
          restartLabel="Retake post-lesson quiz"
        />
      ) : null}
    </AssessmentShell>
  );
}
