"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  History,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Navbar } from "@/components/common/Navbar";
import { fetchSessionDetail, fetchStudentSessions } from "../api/history";
import {
  ResultsSummary,
  sessionDetailToQuizResults,
} from "../components/ResultsSummary";
import { useAssessmentUser } from "../store/useAssessmentUser";
import type { SessionDetail, SessionSummary } from "../types";
import { AssessmentApiError } from "../types";
import { AssessmentShell } from "../components/AssessmentShell";
import { cn } from "@/lib/utils";

type SessionGroup = {
  label: string;
  sessions: SessionSummary[];
};

type KindFilter = "all" | "customizable" | "post_lesson";

export function HistoryListScreen() {
  const user = useAssessmentUser();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");

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
      setSessions(sortSessionsRecentFirst(list));
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

  const stats = useMemo(() => summarizeSessions(sessions), [sessions]);

  const filteredSessions = useMemo(() => {
    if (kindFilter === "all") return sessions;
    return sessions.filter(
      (session) => sessionKindValue(session) === kindFilter
    );
  }, [sessions, kindFilter]);

  const groups = useMemo(
    () => groupSessionsByDate(filteredSessions),
    [filteredSessions]
  );

  return (
    <>
      <Navbar />
      <AssessmentShell
        title="Your quiz history"
        subtitle="Review past custom and post-lesson sessions"
        maxWidth="3xl"
        backHref=""
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
          <p className="rounded-2xl border border-brand-accent/30 bg-brand-accent/10 px-4 py-3 text-sm text-brand-accent">
            {error}
          </p>
        ) : null}

        {!loading && !error && sessions.length === 0 ? (
          <div className="overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-sm">
            <BrandGradientBar />
            <div className="px-6 py-14 text-center sm:px-8">
              <History
                className="mx-auto size-12 text-brand-primary/70"
                aria-hidden
              />
              <p className="mt-4 text-lg font-semibold text-brand-text">
                No quiz sessions yet
              </p>
              <p className="mt-2 text-sm text-brand-text/60">
                Finish a custom or post-lesson quiz and it will show up here.
              </p>
              <Button
                asChild
                className="mt-6 bg-brand-primary text-white hover:bg-brand-primary/90"
              >
                <Link href="/assessment/custom-quiz">Start a custom quiz</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {!loading && !error && sessions.length > 0 ? (
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[2rem] border border-brand-surface bg-white shadow-sm">
              <BrandGradientBar />
              <div className="grid gap-4 px-5 py-5 sm:grid-cols-3 sm:px-6">
                <StatTile
                  label="Total sessions"
                  value={String(stats.total)}
                  accent="primary"
                />
                <StatTile
                  label="Custom quizzes"
                  value={String(stats.custom)}
                  accent="accent"
                />
                <StatTile
                  label="Post-lesson"
                  value={String(stats.postLesson)}
                  accent="secondary"
                />
              </div>
              <div className="border-t border-brand-surface/80 px-5 py-4 sm:px-6">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-text/45">
                  Filter by type
                </p>
                <div className="flex flex-wrap gap-2">
                  <KindFilterChip
                    active={kindFilter === "all"}
                    onClick={() => setKindFilter("all")}
                    icon={History}
                    label="All"
                    count={stats.total}
                    activeClass="border-brand-text/20 bg-brand-text/5 text-brand-text ring-brand-text/15"
                  />
                  <KindFilterChip
                    active={kindFilter === "customizable"}
                    onClick={() => setKindFilter("customizable")}
                    icon={BookOpen}
                    label="Custom"
                    count={stats.custom}
                    activeClass="border-brand-primary/30 bg-brand-primary/10 text-brand-primary ring-brand-primary/20"
                  />
                  <KindFilterChip
                    active={kindFilter === "post_lesson"}
                    onClick={() => setKindFilter("post_lesson")}
                    icon={Sparkles}
                    label="Post-lesson"
                    count={stats.postLesson}
                    activeClass="border-brand-secondary/35 bg-brand-secondary/10 text-brand-text ring-brand-secondary/25"
                  />
                </div>
              </div>
            </div>

            {filteredSessions.length === 0 ? (
              <div className="rounded-2xl border border-brand-surface bg-white px-5 py-10 text-center">
                <p className="text-sm font-medium text-brand-text">
                  No {kindFilter === "customizable" ? "custom" : "post-lesson"}{" "}
                  quizzes yet
                </p>
                <p className="mt-1 text-xs text-brand-text/55">
                  Try another filter or start a new quiz.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-4 border-brand-surface"
                  onClick={() => setKindFilter("all")}
                >
                  Show all sessions
                </Button>
              </div>
            ) : null}

            {groups.map((group) => (
              <section key={group.label} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <CalendarDays
                    className="size-4 text-brand-text/40"
                    aria-hidden
                  />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-brand-text/50">
                    {group.label}
                  </h2>
                  <span className="text-xs tabular-nums text-brand-text/40">
                    ({group.sessions.length})
                  </span>
                </div>
                <ul className="space-y-3">
                  {group.sessions.map((session) => (
                    <li key={session.session_id}>
                      <SessionHistoryCard session={session} />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}
      </AssessmentShell>
    </>
  );
}

export function HistoryDetailScreen() {
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;
  const user = useAssessmentUser();
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
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

  const quizResults = useMemo(
    () => (detail ? sessionDetailToQuizResults(sessionId, detail) : null),
    [detail, sessionId]
  );

  return (
    <>
      <Navbar />
      <AssessmentShell
        title="Session review"
        subtitle={
          detail?.session?.scope_chapter ??
          detail?.chapter_id ??
          detail?.chapters?.join(", ") ??
          sessionId
        }
        backHref="/assessment/history"
        backLabel="All sessions"
        maxWidth="3xl"
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

        {quizResults ? (
          <ResultsSummary
            sessionId={sessionId}
            studentId={user.userId}
            results={quizResults}
            initialDetail={detail}
            showRetry={false}
            showHistoryLink={false}
          />
        ) : !loading && !error ? (
          <p className="text-center text-sm text-brand-text/55">
            No answers found for this session.
          </p>
        ) : null}
      </AssessmentShell>
    </>
  );
}

function SessionHistoryCard({ session }: { session: SessionSummary }) {
  const kind = sessionKindValue(session);
  const meta = sessionKindMeta(kind);
  const progress = sessionProgress(session);
  const scope = formatSessionScope(session);
  const chapters =
    session.scope_chapters?.length && session.scope_chapters.length > 1
      ? `${session.scope_chapters.length} chapters`
      : null;

  return (
    <Link
      href={`/assessment/history/${session.session_id}`}
      className={cn(
        "group block overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
        meta.borderClass
      )}
    >
      <div className="flex">
        <div
          className={cn("w-1.5 shrink-0", meta.accentBarClass)}
          aria-hidden
        />
        <div className="min-w-0 flex-1 p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-xl sm:size-12",
                meta.iconWrapClass
              )}
            >
              <meta.icon className="size-5 sm:size-6" aria-hidden />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-text/45">
                    {meta.label}
                  </p>
                  <p className="truncate text-base font-bold tracking-tight text-brand-text sm:text-lg">
                    {scope}
                  </p>
                  {chapters ? (
                    <p className="text-xs text-brand-text/55">{chapters}</p>
                  ) : null}
                </div>
                <StatusPill status={session.status} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-brand-text/55">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                  {formatSessionWhen(session)}
                </span>
                {progress.label ? (
                  <span className="inline-flex items-center gap-1.5 font-medium text-brand-text/65">
                    <ClipboardList className="size-3.5 shrink-0" aria-hidden />
                    {progress.label}
                  </span>
                ) : null}
              </div>

              {progress.total > 0 ? (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[0.65rem] font-semibold uppercase tracking-wider text-brand-text/40">
                    <span>Progress</span>
                    <span className="tabular-nums">
                      {progress.answered}/{progress.total}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-brand-background">
                    <div
                      className={cn("h-full rounded-full transition-all", meta.progressClass)}
                      style={{
                        width: `${Math.min(100, Math.round((progress.answered / progress.total) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <ChevronRight
              className="mt-1 size-5 shrink-0 text-brand-text/25 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-primary"
              aria-hidden
            />
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "primary" | "secondary" | "accent";
}) {
  const ring =
    accent === "secondary"
      ? "from-brand-secondary/20 to-brand-secondary/5"
      : accent === "accent"
        ? "from-brand-accent/15 to-brand-accent/5"
        : "from-brand-primary/20 to-brand-primary/5";
  return (
    <div
      className={cn(
        "rounded-xl border border-brand-surface/80 bg-gradient-to-b px-3 py-3 text-center sm:px-4",
        ring
      )}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-text/50">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-brand-text">
        {value}
      </p>
    </div>
  );
}

function KindFilterChip({
  active,
  onClick,
  icon: Icon,
  label,
  count,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof History;
  label: string;
  count: number;
  activeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all",
        active
          ? cn("shadow-sm ring-2 ring-offset-1", activeClass)
          : "border-brand-surface bg-brand-background/50 text-brand-text/65 hover:border-brand-primary/25 hover:bg-white"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-xs tabular-nums",
          active ? "bg-white/60" : "bg-brand-surface/80 text-brand-text/50"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function StatusPill({ status }: { status?: string }) {
  if (!status) return null;
  const normalized = status.toLowerCase();
  const done = normalized === "completed" || normalized === "complete";
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0 capitalize",
        done
          ? "border-brand-secondary/30 bg-brand-secondary/10 text-brand-text"
          : "border-brand-surface text-brand-text/60"
      )}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

function sessionKindMeta(kind: string) {
  if (kind === "post_lesson") {
    return {
      label: "Post-lesson quiz",
      icon: Sparkles,
      borderClass: "border-brand-secondary/25 hover:border-brand-secondary/45",
      accentBarClass: "bg-brand-secondary",
      iconWrapClass: "bg-brand-secondary/15 text-brand-secondary",
      progressClass: "bg-brand-secondary",
    };
  }
  if (kind === "customizable") {
    return {
      label: "Custom quiz",
      icon: BookOpen,
      borderClass: "border-brand-primary/25 hover:border-brand-primary/45",
      accentBarClass: "bg-brand-primary",
      iconWrapClass: "bg-brand-primary/10 text-brand-primary",
      progressClass: "bg-brand-primary",
    };
  }
  return {
    label: kind ? kind.replace(/_/g, " ") : "Quiz session",
    icon: ClipboardList,
    borderClass: "border-brand-accent/20 hover:border-brand-accent/40",
    accentBarClass: "bg-brand-accent",
    iconWrapClass: "bg-brand-accent/10 text-brand-accent",
    progressClass: "bg-brand-accent",
  };
}

function sessionKindValue(session: SessionSummary): string {
  return (session.session_kind ?? session.session_type ?? "").toLowerCase();
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

function groupSessionsByDate(sessions: SessionSummary[]): SessionGroup[] {
  const sorted = sortSessionsRecentFirst(sessions);
  const buckets = new Map<string, SessionSummary[]>();
  const order: string[] = [];

  for (const session of sorted) {
    const label = relativeDateLabel(session);
    if (!buckets.has(label)) {
      buckets.set(label, []);
      order.push(label);
    }
    buckets.get(label)!.push(session);
  }

  return order.map((label) => ({
    label,
    sessions: buckets.get(label) ?? [],
  }));
}

function relativeDateLabel(session: SessionSummary): string {
  const ts = sessionTimestamp(session);
  if (!ts) return "Earlier sessions";

  const now = new Date();
  const date = new Date(ts);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - 7);

  if (ts >= startOfToday.getTime()) return "Today";
  if (ts >= startOfYesterday.getTime()) return "Yesterday";
  if (ts >= startOfWeek.getTime()) return "This week";
  return "Earlier";
}

function summarizeSessions(sessions: SessionSummary[]) {
  let custom = 0;
  let postLesson = 0;
  for (const session of sessions) {
    const kind = sessionKindValue(session);
    if (kind === "customizable") custom += 1;
    else if (kind === "post_lesson") postLesson += 1;
  }
  return { total: sessions.length, custom, postLesson };
}

function sessionProgress(session: SessionSummary): {
  answered: number;
  total: number;
  label: string;
} {
  const answered = session.questions_asked ?? session.total_answered ?? 0;
  const total = session.max_questions ?? answered;
  return {
    answered,
    total,
    label: total > 0 ? `${answered} of ${total} questions` : "",
  };
}

function formatSessionScope(session: SessionSummary): string {
  const raw =
    session.scope_chapter ??
    session.chapter_id ??
    session.scope_chapters?.[0] ??
    session.chapters?.[0];

  if (!raw) return "Quiz session";
  return formatChapterLabel(raw);
}

function formatChapterLabel(id: string): string {
  const match = /^G(\d+)_C(\d+)/i.exec(id.trim());
  if (match) {
    return `Grade ${match[1]} · Chapter ${match[2]}`;
  }
  return id.replace(/_/g, " ");
}

function formatSessionWhen(session: SessionSummary): string {
  if (session.created_at) {
    const date = new Date(session.created_at);
    const now = new Date();
    const sameDay =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (sameDay) {
      return date.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      });
    }

    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
    });
  }
  return `Session ${session.session_id.slice(0, 8)}`;
}
