"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

import { fetchStudentSessions } from "../api/history";
import { useAssessmentUser } from "../store/useAssessmentUser";
import type { SessionSummary } from "../types";
import { AssessmentApiError } from "../types";
import { EDUCATOR_AT_RISK } from "@/lib/educator/theme";
import { cn } from "@/lib/utils";

const PROFILE_SESSION_LIMIT = 8;

export function ProfileRecentQuizAttempts() {
  const user = useAssessmentUser();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user.userId) {
      setSessions([]);
      setError("Sign in to view quiz history.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchStudentSessions(user.userId);
      setSessions(sortSessionsRecentFirst(list));
    } catch (err) {
      setError(
        err instanceof AssessmentApiError
          ? err.message
          : "Could not load quiz history."
      );
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const recent = useMemo(
    () => sessions.slice(0, PROFILE_SESSION_LIMIT),
    [sessions]
  );

  if (loading) {
    return (
      <p className="mt-3 flex items-center gap-2 text-sm text-brand-text/65">
        <Loader2 className="size-4 animate-spin text-brand-primary" aria-hidden />
        Loading recent quizzes…
      </p>
    );
  }

  if (error) {
    return (
      <p className="mt-3 text-sm text-brand-text/65" role="alert">
        {error}
      </p>
    );
  }

  if (recent.length === 0) {
    return (
      <p className="mt-3 text-sm text-brand-text/65">
        No quiz sessions yet. Finish a custom or post-lesson quiz and it will
        show up here.
      </p>
    );
  }

  return (
    <>
      <ul className="mt-3 space-y-2">
        {recent.map((session) => (
          <li key={session.session_id}>
            <ProfileSessionRow session={session} />
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-brand-text/65">
        <Link
          href="/assessment/history"
          className="font-semibold text-brand-primary hover:underline"
        >
          View all quiz history
        </Link>
      </p>
    </>
  );
}

function ProfileSessionRow({ session }: { session: SessionSummary }) {
  const label = formatSessionLabel(session);
  const score = formatSessionScore(session);
  const when = formatSessionWhen(session);

  return (
    <Link
      href={`/assessment/history/${session.session_id}`}
      title={when ? `Completed ${when}` : undefined}
      className="flex items-center justify-between gap-2 rounded-lg bg-brand-background px-3 py-2 text-sm transition-colors hover:bg-brand-background/80"
    >
      <span className="min-w-0 truncate text-brand-text">{label}</span>
      <span
        className={cn(
          "shrink-0 font-semibold tabular-nums",
          score.tone === "ok"
            ? "text-brand-secondary"
            : score.tone === "alert"
              ? EDUCATOR_AT_RISK.text
              : "text-brand-text/70"
        )}
      >
        {score.label}
      </span>
    </Link>
  );
}

function formatSessionLabel(session: SessionSummary): string {
  const scope = formatSessionScope(session);
  const kind = sessionKindLabel(session);
  if (scope === "Quiz session") return kind;
  return `${scope} · ${kind}`;
}

function sessionKindLabel(session: SessionSummary): string {
  const kind = (session.session_kind ?? session.session_type ?? "")
    .toLowerCase()
    .replace(/_/g, " ");
  if (kind === "customizable") return "Custom";
  if (kind === "post lesson") return "Post-lesson";
  return kind ? kind.replace(/\b\w/g, (c) => c.toUpperCase()) : "Quiz";
}

function sessionTimestamp(session: SessionSummary): number {
  if (!session.created_at) return 0;
  const parsed = Date.parse(session.created_at);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortSessionsRecentFirst(sessions: SessionSummary[]): SessionSummary[] {
  return [...sessions].sort(
    (a, b) => sessionTimestamp(b) - sessionTimestamp(a)
  );
}

function formatSessionScope(session: SessionSummary): string {
  const raw =
    session.scope_chapter ??
    session.chapter_id ??
    session.scope_chapters?.[0] ??
    session.chapters?.[0];

  if (!raw) return "Quiz session";
  const match = /^G(\d+)_C(\d+)/i.exec(raw.trim());
  if (match) return `Grade ${match[1]} · Ch. ${match[2]}`;
  return raw.replace(/_/g, " ");
}

function formatSessionWhen(session: SessionSummary): string {
  if (!session.created_at) return "";
  const date = new Date(session.created_at);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSessionScore(session: SessionSummary): {
  label: string;
  tone: "ok" | "alert" | "muted";
} {
  const answered = session.questions_asked ?? session.total_answered ?? 0;
  const correct = session.correct_count;

  if (typeof session.accuracy === "number" && Number.isFinite(session.accuracy)) {
    const pct = Math.round(
      session.accuracy <= 1 ? session.accuracy * 100 : session.accuracy
    );
    return {
      label: `${pct}%`,
      tone: pct >= 80 ? "ok" : "alert",
    };
  }

  if (
    typeof correct === "number" &&
    typeof answered === "number" &&
    answered > 0
  ) {
    const pct = Math.round((correct / answered) * 100);
    return {
      label: `${correct}/${answered}`,
      tone: pct >= 80 ? "ok" : "alert",
    };
  }

  const status = (session.status ?? "").toLowerCase();
  if (status && status !== "completed" && status !== "complete") {
    return {
      label: status.replace(/_/g, " "),
      tone: "muted",
    };
  }

  return { label: "Review", tone: "muted" };
}
