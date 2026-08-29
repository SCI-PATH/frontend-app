"use client";

import Link from "next/link";
import {
  Check,
  Library,
  Pause,
  PenLine,
  RefreshCw,
  Search,
  TrendingDown,
  X,
} from "lucide-react";

import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  EDUCATOR_QUESTION_BANK_BROWSE_PATH,
  EDUCATOR_QUESTION_GENERATION_PATH,
} from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

import { normalizeOptions } from "../QuestionRenderer";
import type {
  MostMissedQuestionInsight,
  QuestionType,
  RejectReason,
  TeacherQuestion,
} from "../../types";
import { chapterIdFromTopicId } from "../../utils/topicChapter";

export { EDUCATOR_QUESTION_BANK_BROWSE_PATH };

export const REJECT_REASONS: {
  value: RejectReason;
  label: string;
  highlight?: boolean;
}[] = [
  { value: "FACTUAL_ERROR", label: "Factual error", highlight: true },
  { value: "OUT_OF_SCOPE", label: "Out of scope" },
  { value: "POOR_PHRASING", label: "Poor phrasing" },
  { value: "TOO_EASY", label: "Too easy" },
  { value: "TOO_HARD", label: "Too hard" },
  { value: "OTHER", label: "Other" },
];

export const Q_TYPES: QuestionType[] = [
  "MCQ",
  "TrueFalse",
  "ShortAnswer",
  "MultiBlank",
];

export function originLabel(origin: string, status: string): string {
  if (origin === "teacher") {
    return status === "pending" ? "Your draft" : "Yours";
  }
  return "Bank";
}

export function isTeacherOrigin(origin: string | undefined): boolean {
  return (origin || "").toLowerCase() === "teacher";
}

export function toTeacherQuestion(
  q: TeacherQuestion | MostMissedQuestionInsight,
  fromList: TeacherQuestion[] = []
): TeacherQuestion {
  const id = "id" in q ? q.id : q.question_id;
  const existing = fromList.find((item) => item.id === id);
  if (existing) return existing;
  return {
    id,
    prompt: q.prompt || "",
    question_type:
      "question_type" in q && q.question_type
        ? (q.question_type as QuestionType)
        : "MCQ",
    status: ("status" in q && q.status
      ? q.status
      : "approved") as TeacherQuestion["status"],
    topic_id: q.topic_id,
    chapter_name: "chapter_name" in q ? q.chapter_name : undefined,
    options: "options" in q ? q.options : undefined,
    expected_answer: "correct_answer" in q ? q.correct_answer : undefined,
  };
}

export function QuestionBankNav({
  current,
}: {
  current: "yours" | "browse";
}) {
  return (
    <nav
      className="grid gap-3 sm:grid-cols-2"
      aria-label="Question bank sections"
    >
      <Link
        href={EDUCATOR_QUESTION_GENERATION_PATH}
        aria-current={current === "yours" ? "page" : undefined}
        className={cn(
          "group relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all sm:p-6",
          current === "yours"
            ? "border-brand-special/25 bg-gradient-to-br from-white to-brand-special/12 ring-2 ring-brand-special/20"
            : "border-brand-surface bg-white hover:border-brand-special/25 hover:bg-gradient-to-br hover:from-white hover:to-brand-special/6"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-brand-special/15 blur-2xl"
        />
        <div className="relative flex items-start gap-3.5">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-md",
              current === "yours"
                ? "bg-brand-special text-white shadow-brand-special/25"
                : "bg-brand-special/12 text-brand-special"
            )}
          >
            <PenLine className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-brand-special">
              Workspace
            </span>
            <span className="block text-lg font-semibold tracking-tight text-brand-text">
              Your questions
            </span>
            <span className="block text-sm leading-snug text-brand-text/70">
              Draft or add items here. Approve a draft before students can
              receive it.
            </span>
          </span>
        </div>
      </Link>
      <Link
        href={EDUCATOR_QUESTION_BANK_BROWSE_PATH}
        aria-current={current === "browse" ? "page" : undefined}
        className={cn(
          "group relative overflow-hidden rounded-3xl border p-5 shadow-sm transition-all sm:p-6",
          current === "browse"
            ? "border-brand-primary/25 bg-gradient-to-br from-white to-brand-primary/12 ring-2 ring-brand-primary/20"
            : "border-brand-surface bg-white hover:border-brand-primary/25 hover:bg-gradient-to-br hover:from-white hover:to-brand-primary/6"
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-brand-primary/15 blur-2xl"
        />
        <div className="relative flex items-start gap-3.5">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-md",
              current === "browse"
                ? "bg-brand-primary text-white shadow-brand-primary/25"
                : "bg-brand-primary/12 text-brand-primary"
            )}
          >
            <Library className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-brand-primary">
              Library
            </span>
            <span className="block text-lg font-semibold tracking-tight text-brand-text">
              Browse bank
            </span>
            <span className="block text-sm leading-snug text-brand-text/70">
              Shared catalog for every student, plus{" "}
              <span className="font-semibold text-brand-text">
                most missed
              </span>{" "}
              — items they get wrong most often.
            </span>
          </span>
        </div>
      </Link>
    </nav>
  );
}

function BrowseViewPills({
  value,
  onChange,
}: {
  value: "bank" | "missed";
  onChange: (v: "bank" | "missed") => void;
}) {
  return (
    <div
      className="grid gap-2 sm:grid-cols-2"
      role="group"
      aria-label="What to review"
    >
      <button
        type="button"
        onClick={() => onChange("bank")}
        aria-pressed={value === "bank"}
        className={cn(
          "rounded-2xl border px-4 py-3 text-left transition-all duration-200",
          value === "bank"
            ? "border-brand-primary/30 bg-brand-primary/8 text-brand-text ring-2 ring-brand-primary/20"
            : "border-brand-surface bg-brand-background/50 text-brand-text hover:border-brand-primary/20 hover:bg-white"
        )}
      >
        <span className="block text-sm font-semibold">All questions</span>
        <span className="mt-0.5 block text-xs leading-snug text-brand-text/60">
          Shared catalog
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("missed")}
        aria-pressed={value === "missed"}
        className={cn(
          "rounded-2xl border px-4 py-3 text-left transition-all duration-200",
          value === "missed"
            ? "border-brand-accent/35 bg-brand-accent/8 text-brand-text ring-2 ring-brand-accent/20"
            : "border-brand-surface bg-brand-background/50 text-brand-text hover:border-brand-accent/25 hover:bg-white"
        )}
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          <TrendingDown className="size-3.5 text-brand-accent" aria-hidden />
          Most missed
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-brand-text/60">
          What students get wrong most often
        </span>
      </button>
    </div>
  );
}

export function QuestionBankPageHeader({
  current,
  onRefresh,
}: {
  current: "yours" | "browse";
  onRefresh: () => void;
}) {
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-accent">
            Assessment
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
            Question bank
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="rounded-xl border-brand-surface"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Refresh
        </Button>
      </div>
      <QuestionBankNav current={current} />
    </header>
  );
}

export type QuestionBankGradeFilter = number | "all";

export const QUESTION_BANK_GRADES = [6, 7, 8, 9] as const;

export function FilterToolbar({
  search,
  onSearch,
  searchPlaceholder = "Search questions…",
  grade,
  onGrade,
  status,
  onStatus,
  chapterId,
  onChapter,
  chapterOptions,
  view,
  onViewChange,
}: {
  search: string;
  onSearch: (v: string) => void;
  searchPlaceholder?: string;
  grade: QuestionBankGradeFilter;
  onGrade: (g: QuestionBankGradeFilter) => void;
  status?: string;
  onStatus?: (v: string) => void;
  chapterId: string;
  onChapter: (v: string) => void;
  chapterOptions: { value: string; label: string }[];
  view?: "bank" | "missed";
  onViewChange?: (v: "bank" | "missed") => void;
}) {
  const selectClass =
    "h-10 w-full rounded-xl border border-brand-surface bg-white px-3 text-sm text-brand-text";
  return (
    <section className="overflow-hidden rounded-3xl border border-brand-surface bg-white shadow-sm">
      <BrandGradientBar />
      {view && onViewChange ? (
        <div className="space-y-3 border-b border-brand-surface px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
            Review
          </p>
          <BrowseViewPills value={view} onChange={onViewChange} />
        </div>
      ) : null}
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-3 sm:p-4">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-brand-text/40"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="h-10 rounded-xl border-brand-surface pl-10"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <select
            aria-label="Grade"
            value={grade === "all" ? "all" : String(grade)}
            onChange={(e) =>
              onGrade(
                e.target.value === "all" ? "all" : Number(e.target.value)
              )
            }
            className={cn(selectClass, "sm:w-[9.5rem]")}
          >
            <option value="all">All grades</option>
            {QUESTION_BANK_GRADES.map((g) => (
              <option key={g} value={g}>
                Grade {g}
              </option>
            ))}
          </select>
          {onStatus ? (
            <select
              aria-label="Status"
              value={status}
              onChange={(e) => onStatus(e.target.value)}
              className={cn(selectClass, "sm:w-[9.5rem]")}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          ) : null}
          <select
            aria-label="Chapter"
            value={chapterId}
            onChange={(e) => onChapter(e.target.value)}
            className={cn(
              selectClass,
              onStatus ? "col-span-2 sm:w-[14rem]" : "sm:w-[14rem]"
            )}
          >
            <option value="">All chapters</option>
            {chapterOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}

export function QuestionListHeader({
  title,
  countLabel,
}: {
  title: string;
  countLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <h2 className="text-lg font-semibold text-brand-text">{title}</h2>
      <p className="text-xs font-medium tabular-nums text-brand-text/45">
        {countLabel}
      </p>
    </div>
  );
}

export type StatusConfirmKind = "approve" | "hold";

export function QuestionBankActionDialogs({
  rejectOpen,
  onRejectOpenChange,
  rejectReason,
  onRejectReasonChange,
  rejectNotes,
  onRejectNotesChange,
  onRejectConfirm,
  statusConfirm,
  onStatusConfirmChange,
  onStatusConfirm,
  busyId,
}: {
  rejectOpen: boolean;
  onRejectOpenChange: (open: boolean) => void;
  rejectTarget: TeacherQuestion | null;
  rejectReason: RejectReason;
  onRejectReasonChange: (reason: RejectReason) => void;
  rejectNotes: string;
  onRejectNotesChange: (notes: string) => void;
  onRejectConfirm: () => void;
  statusConfirm: { kind: StatusConfirmKind; question: TeacherQuestion } | null;
  onStatusConfirmChange: (
    value: { kind: StatusConfirmKind; question: TeacherQuestion } | null
  ) => void;
  onStatusConfirm: () => void;
  busyId: string | null;
}) {
  return (
    <>
      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          onRejectOpenChange(open);
          if (!open) onRejectNotesChange("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject question</DialogTitle>
            <DialogDescription>
              Status becomes rejected. The question stays in the bank — it is
              never deleted. Students will not receive it. If you choose{" "}
              <strong>Factual error</strong>, the system may run an automatic
              review and add a note to the record (your decision still stands).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex flex-wrap gap-2">
              {REJECT_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => onRejectReasonChange(r.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium",
                    rejectReason === r.value
                      ? r.highlight
                        ? "border-brand-accent bg-brand-accent text-white"
                        : "border-brand-primary bg-brand-primary text-white"
                      : "border-brand-surface bg-white text-brand-text"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <Input
              value={rejectNotes}
              onChange={(e) => onRejectNotesChange(e.target.value)}
              placeholder="Notes (optional)"
              className="border-brand-surface"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onRejectOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={onRejectConfirm}
              className="bg-brand-accent text-white hover:bg-brand-accent/90"
            >
              Confirm reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={statusConfirm !== null}
        onOpenChange={(open) => {
          if (!open) onStatusConfirmChange(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusConfirm?.kind === "approve"
                ? statusConfirm.question.status === "rejected"
                  ? "Approve this question again?"
                  : "Approve this question?"
                : "Hold this question?"}
            </DialogTitle>
            <DialogDescription>
              {statusConfirm?.kind === "approve"
                ? statusConfirm.question.status === "rejected"
                  ? "Rejected status is cleared. Students can receive it in quizzes again. The question stays in the bank — nothing is deleted."
                  : "Students can receive it in quizzes. The question stays in the bank — nothing is deleted."
                : "Status becomes pending. Students will not see it until you approve again. The question stays in the bank — nothing is deleted."}
            </DialogDescription>
          </DialogHeader>
          {statusConfirm?.question.prompt ? (
            <p className="line-clamp-4 text-sm text-brand-text/80">
              {statusConfirm.question.prompt}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onStatusConfirmChange(null)}
            >
              Cancel
            </Button>
            <Button
              disabled={busyId === statusConfirm?.question.id}
              onClick={onStatusConfirm}
              className={
                statusConfirm?.kind === "approve"
                  ? "bg-brand-secondary text-brand-text hover:bg-brand-secondary/90"
                  : "bg-brand-primary text-white hover:bg-brand-primary/90"
              }
            >
              {statusConfirm?.kind === "approve"
                ? "Confirm approve"
                : "Confirm hold"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "approved") {
    return (
      <Badge className="bg-brand-secondary/20 text-brand-text hover:bg-brand-secondary/20">
        approved
      </Badge>
    );
  }
  if (status === "rejected") {
    return (
      <Badge className="bg-brand-text/10 text-brand-text/70 hover:bg-brand-text/10">
        rejected
      </Badge>
    );
  }
  return (
    <Badge className="bg-brand-special/15 text-brand-special hover:bg-brand-special/15">
      pending
    </Badge>
  );
}

export function ChipRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onChange(o.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                on
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-brand-surface bg-white text-brand-text hover:border-brand-primary/30"
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-brand-text/55">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-brand-surface bg-white px-3 text-sm text-brand-text"
      >
        {options.length === 0 ? (
          <option value="">None</option>
        ) : (
          options.map((o) => (
            <option key={o.value || `${label}-all`} value={o.value}>
              {o.label}
            </option>
          ))
        )}
      </select>
    </div>
  );
}

export function QuestionCard({
  question,
  insight,
  pinned = false,
  busyId,
  onHold,
  onApprove,
  onReject,
}: {
  question: TeacherQuestion;
  insight?: MostMissedQuestionInsight;
  pinned?: boolean;
  busyId: string | null;
  onHold: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const missPct =
    insight && typeof insight.miss_rate === "number"
      ? Math.round(insight.miss_rate * 100)
      : insight?.attempt_count
        ? Math.round((insight.incorrect_count / insight.attempt_count) * 100)
        : 0;
  const options = question.options || insight?.options;
  const correct = insight?.correct_answer || question.expected_answer;
  return (
    <article
      className={cn(
        "rounded-[1.75rem] border bg-white p-5 shadow-sm sm:p-6",
        pinned ? "border-brand-special/40" : "border-brand-surface"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {pinned ? (
              <Badge className="bg-brand-special/15 text-brand-special hover:bg-brand-special/15">
                Just added
              </Badge>
            ) : null}
            <Badge className="bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
              {question.question_type}
            </Badge>
            {question.dok_level != null ? (
              <Badge variant="outline">DOK {question.dok_level}</Badge>
            ) : null}
            {chapterIdFromTopicId(question.topic_id) ? (
              <Badge variant="outline">
                {chapterIdFromTopicId(question.topic_id)}
              </Badge>
            ) : null}
            <StatusBadge status={question.status} />
            {question.origin ? (
              <Badge variant="outline">
                {originLabel(question.origin, question.status)}
              </Badge>
            ) : null}
            {insight ? (
              <Badge variant="outline">
                {insight.incorrect_count}/{insight.attempt_count} missed
                {missPct ? ` · ${missPct}%` : ""}
              </Badge>
            ) : null}
          </div>
          <h3 className="text-base font-semibold leading-snug text-brand-text">
            {question.prompt}
          </h3>
          {options ? (
            <ul className="space-y-1 text-sm text-brand-text/75">
              {normalizeOptions(options).map((opt) => (
                <li key={opt.key}>
                  <span className="font-semibold text-brand-primary">
                    {opt.key}.
                  </span>{" "}
                  {opt.label}
                </li>
              ))}
            </ul>
          ) : null}
          {question.paragraph && question.paragraph !== question.prompt ? (
            <p className="text-sm whitespace-pre-wrap text-brand-text/70">
              {question.paragraph}
            </p>
          ) : null}
          {correct ? (
            <p className="text-sm text-brand-text/70">Correct: {correct}</p>
          ) : null}
          {insight?.most_selected ? (
            <p className="text-sm text-brand-text/70">
              Students picked: {insight.most_selected.answer} (
              {insight.most_selected.count})
            </p>
          ) : null}
          {question.status === "rejected" && question.rejection_reason ? (
            <p className="text-xs text-brand-text/45">
              Rejected · {question.rejection_reason.replace(/_/g, " ")}
              {question.rejection_notes ? ` — ${question.rejection_notes}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {question.status === "pending" || question.status === "rejected" ? (
            <Button
              size="sm"
              disabled={busyId === question.id}
              onClick={onApprove}
              className="rounded-xl bg-brand-secondary text-brand-text hover:bg-brand-secondary/90"
            >
              <Check className="size-3.5" aria-hidden />
              {question.status === "rejected" ? "Approve again" : "Approve"}
            </Button>
          ) : null}
          {question.status !== "pending" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busyId === question.id}
              onClick={onHold}
              className="rounded-xl"
            >
              <Pause className="size-3.5" aria-hidden />
              Hold
            </Button>
          ) : null}
          {question.status !== "rejected" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={busyId === question.id}
              onClick={onReject}
              className="rounded-xl border-brand-accent/40 text-brand-accent hover:bg-brand-accent/10"
            >
              <X className="size-3.5" aria-hidden />
              Reject
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
