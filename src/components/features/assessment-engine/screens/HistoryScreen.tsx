"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Brain, ChevronRight, Loader2, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  analyzeSession,
  fetchSessionDetail,
  fetchStudentSessions,
} from "../api/history";
import { useAssessmentUser } from "../store/useAssessmentUser";
import type {
  AnalyzeResponse,
  SessionAnswerItem,
  SessionDetail,
  SessionSummary,
} from "../types";
import { AssessmentApiError } from "../types";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";
import { AssessmentShell } from "../components/AssessmentShell";

export function HistoryListScreen() {
  const user = useAssessmentUser();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user.userId) {
      setError("Sign in to view quiz history.");
      setSessions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchStudentSessions(user.userId);
      setSessions(list);
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not load history"
      );
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AssessmentShell
      title="Your quiz history"
      subtitle={`Sessions for ${user.displayName}`}
      maxWidth="3xl"
      backHref={STUDENT_HOME_PATH}
      backLabel="Home"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          className="border-brand-surface"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Refresh
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-brand-primary" />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent">
          {error}
        </p>
      ) : null}

      {!loading && !error && sessions.length === 0 ? (
        <Card className="border-brand-surface bg-white">
          <CardContent className="py-12 text-center text-sm text-brand-text/60">
            No sessions yet — try a custom or post-lesson quiz from the Dev Hub.
          </CardContent>
        </Card>
      ) : null}

      <ul className="space-y-3">
        {sessions.map((s) => (
          <li key={s.session_id}>
            <Link
              href={`/assessment/history/${s.session_id}`}
              className="block rounded-xl border border-brand-surface bg-white px-4 py-4 transition-all hover:border-brand-primary/40 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-brand-text">
                    {s.chapter_id ??
                      s.chapters?.join(", ") ??
                      s.session_type ??
                      "Quiz session"}
                  </p>
                  <p className="mt-1 text-xs text-brand-text/55">
                    {s.created_at
                      ? new Date(s.created_at).toLocaleString()
                      : s.session_id}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {s.status ? (
                    <Badge variant="outline">{s.status}</Badge>
                  ) : null}
                  {s.score != null || s.accuracy != null ? (
                    <Badge className="bg-brand-secondary/20 text-brand-text">
                      {formatScore(s.score ?? s.accuracy)}
                    </Badge>
                  ) : null}
                  <ChevronRight className="size-4 text-brand-text/40" />
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </AssessmentShell>
  );
}

export function HistoryDetailScreen() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const user = useAssessmentUser();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const d = await fetchSessionDetail(user.userId, sessionId);
        setDetail(d);
      } catch (err) {
        setError(
          err instanceof AssessmentApiError
            ? err.message
            : "Could not load session"
        );
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user.userId, sessionId]);

  async function runAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await analyzeSession(user.userId, sessionId);
      setAnalysis(res);
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Analyze request failed"
      );
    } finally {
      setAnalyzing(false);
    }
  }

  const items: SessionAnswerItem[] =
    detail?.answers ?? detail?.items ?? [];

  return (
    <AssessmentShell
      title="Session detail"
      subtitle={sessionId}
      backHref="/assessment/history"
      backLabel="All sessions"
      maxWidth="3xl"
      actions={
        <Button
          disabled={analyzing}
          onClick={() => void runAnalyze()}
          className="gap-1.5 bg-brand-special text-white hover:bg-brand-special/90"
        >
          {analyzing ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <Brain className="size-4" aria-hidden />
          )}
          AI analyze
        </Button>
      }
    >
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-8 animate-spin text-brand-primary" />
        </div>
      ) : null}

      {error ? (
        <p className="mb-4 rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent">
          {error}
        </p>
      ) : null}

      {detail ? (
        <Card className="mb-4 border-brand-surface bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-brand-text">
              {detail.chapter_id ??
                detail.chapters?.join(", ") ??
                "Quiz session"}
            </CardTitle>
            <CardDescription>
              Status: {detail.status ?? "—"} · Score:{" "}
              {formatScore(detail.score ?? detail.accuracy)}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {analysis ? (
        <Card className="mb-4 border-brand-special/30 bg-brand-special/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-text">
              <Brain className="size-5 text-brand-special" aria-hidden />
              Pedagogical feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-brand-text/85">
            {analysis.summary || analysis.feedback ? (
              <p className="leading-relaxed whitespace-pre-wrap">
                {analysis.summary ?? analysis.feedback}
              </p>
            ) : null}
            {analysis.explanations?.map((ex) => (
              <div
                key={ex.question_id}
                className="rounded-lg border border-brand-special/20 bg-white/80 px-3 py-2"
              >
                <p className="font-medium text-brand-text">{ex.explanation}</p>
                {ex.student_answer != null ? (
                  <p className="mt-1 text-xs text-brand-text/55">
                    Your answer: {ex.student_answer}
                    {ex.expected_answer
                      ? ` · Expected: ${ex.expected_answer}`
                      : ""}
                  </p>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={item.question_id || idx}>
            <Card className="border-brand-surface bg-white">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-medium text-brand-text">
                    {item.prompt ?? `Question ${idx + 1}`}
                  </CardTitle>
                  <Badge
                    className={
                      item.is_correct
                        ? "bg-brand-secondary/20 text-brand-text"
                        : "bg-brand-accent/15 text-brand-accent"
                    }
                  >
                    {item.is_correct ? "Correct" : "Review"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p>
                  <span className="text-brand-text/55">Your answer: </span>
                  <span className="font-medium text-brand-text">
                    {item.student_answer ?? "—"}
                  </span>
                </p>
                <p>
                  <span className="text-brand-text/55">Expected: </span>
                  <span className="font-medium text-brand-text">
                    {item.expected_answer ?? "—"}
                  </span>
                </p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {!loading && items.length === 0 && detail ? (
        <p className="text-center text-sm text-brand-text/55">
          No answer items in this session payload.
        </p>
      ) : null}
    </AssessmentShell>
  );
}

function formatScore(value?: number | null): string {
  if (value == null) return "—";
  if (value <= 1) return `${Math.round(value * 100)}%`;
  return `${Math.round(value)}%`;
}
