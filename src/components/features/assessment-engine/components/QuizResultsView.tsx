"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  History,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";

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
import type { QuizResults as QuizResultsType } from "../types";

interface QuizResultsProps {
  results: QuizResultsType;
  onAgain?: () => void;
  againLabel?: string;
  footer?: ReactNode;
}

export function QuizResultsView({
  results,
  onAgain,
  againLabel = "Try another quiz",
  footer,
}: QuizResultsProps) {
  const total =
    results.total_answered ??
    results.max_questions ??
    results.items?.length ??
    0;
  const correct = results.correct_count;
  const missed =
    correct != null && total > 0 ? Math.max(0, total - correct) : null;
  const scorePct =
    results.score != null
      ? Math.round(results.score <= 1 ? results.score * 100 : results.score)
      : results.accuracy != null
        ? Math.round(
            results.accuracy <= 1 ? results.accuracy * 100 : results.accuracy
          )
        : correct != null && total > 0
          ? Math.round((correct / total) * 100)
          : null;

  return (
    <Card className="border-brand-surface bg-white shadow-[0_18px_50px_-28px_rgba(0,168,232,0.4)] ring-0 animate-in fade-in zoom-in-95 duration-500">
      <div
        aria-hidden
        className="h-1.5 w-full bg-[linear-gradient(90deg,#00A8E8_0%,#70E000_35%,#FF6B35_70%,#7209B7_100%)]"
      />
      <CardHeader className="items-center text-center">
        <div className="mb-1 flex size-14 items-center justify-center rounded-2xl bg-brand-secondary/15 text-brand-secondary">
          <Trophy className="size-7" aria-hidden />
        </div>
        <Badge className="bg-brand-secondary/15 text-brand-text hover:bg-brand-secondary/15">
          Quiz complete
        </Badge>
        <CardTitle className="text-2xl font-semibold text-brand-text">
          Nice work — you finished!
        </CardTitle>
        <CardDescription className="text-brand-text/65">
          Here is how this session went.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Score"
            value={scorePct != null ? `${scorePct}%` : "—"}
            accent="primary"
          />
          <Stat
            label="Correct"
            value={correct != null ? String(correct) : "—"}
            sub={total ? `of ${total}` : undefined}
            accent="secondary"
          />
          <Stat
            label="Review"
            value={missed != null ? String(missed) : "—"}
            sub={missed === 1 ? "question" : missed ? "questions" : undefined}
            accent="accent"
          />
        </div>

        {results.items && results.items.length > 0 ? (
          <div className="space-y-3">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-brand-text">
              <Sparkles className="size-4 text-brand-special" aria-hidden />
              Question breakdown
            </p>
            <ul className="max-h-80 space-y-3 overflow-y-auto pr-1">
              {results.items.map((item, idx) => (
                <ResultItemCard key={item.question_id || idx} item={item} index={idx} />
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
      {(onAgain || footer) && (
        <CardFooter className="flex-wrap justify-center gap-3 border-brand-surface">
          <Button
            asChild
            variant="outline"
            className="gap-2 border-brand-surface"
          >
            <Link href="/assessment/history">
              <History className="size-4" aria-hidden />
              Past quizzes
            </Link>
          </Button>
          {onAgain ? (
            <Button
              onClick={onAgain}
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              {againLabel}
            </Button>
          ) : null}
          {footer}
        </CardFooter>
      )}
      {!onAgain && !footer ? (
        <CardFooter className="justify-center border-brand-surface">
          <Button
            asChild
            variant="outline"
            className="gap-2 border-brand-surface"
          >
            <Link href="/assessment/history">
              <History className="size-4" aria-hidden />
              Past quizzes
            </Link>
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

function ResultItemCard({
  item,
  index,
}: {
  item: NonNullable<QuizResultsType["items"]>[number];
  index: number;
}) {
  const correct = item.is_correct === true;
  const partial =
    !correct &&
    typeof item.accuracy_score === "number" &&
    item.accuracy_score > 0 &&
    item.accuracy_score < (item.accuracy_score <= 1 ? 1 : 100);
  const variant = correct ? "correct" : partial ? "partial" : "incorrect";

  const styles = {
    correct: {
      border: "border-brand-secondary/30",
      accent: "border-l-brand-secondary bg-brand-secondary/5",
      badge: "bg-brand-secondary/20 text-brand-text",
      icon: CheckCircle2,
      index: "bg-brand-secondary/15 text-brand-secondary",
      label: "Correct",
    },
    partial: {
      border: "border-brand-primary/25",
      accent: "border-l-brand-primary bg-brand-primary/5",
      badge: "bg-brand-primary/15 text-brand-primary",
      icon: AlertCircle,
      index: "bg-brand-primary/10 text-brand-primary",
      label: "Partial",
    },
    incorrect: {
      border: "border-brand-accent/25",
      accent: "border-l-brand-accent bg-brand-accent/5",
      badge: "bg-brand-accent/15 text-brand-accent",
      icon: XCircle,
      index: "bg-brand-accent/10 text-brand-accent",
      label: "Review",
    },
  }[variant];

  const StatusIcon = styles.icon;

  return (
    <li
      className={`overflow-hidden rounded-xl border border-l-[4px] ${styles.border} ${styles.accent}`}
    >
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums ${styles.index}`}
            >
              {index + 1}
            </span>
            <p className="text-sm font-medium leading-snug text-brand-text line-clamp-2">
              {item.prompt ?? `Question ${index + 1}`}
            </p>
          </div>
          <Badge className={`shrink-0 gap-1 px-2 py-0.5 ${styles.badge}`}>
            <StatusIcon className="size-3" aria-hidden />
            {styles.label}
          </Badge>
        </div>

        {(item.student_answer || item.expected_answer) && !correct ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {item.student_answer ? (
              <div className="rounded-lg border border-brand-surface bg-brand-background/60 px-3 py-2">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-brand-text/45">
                  Your answer
                </p>
                <p className="mt-1 text-xs text-brand-text/85">
                  {item.student_answer}
                </p>
              </div>
            ) : null}
            {item.expected_answer ? (
              <div className="rounded-lg border border-brand-secondary/20 bg-brand-secondary/8 px-3 py-2">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-brand-secondary">
                  Correct
                </p>
                <p className="mt-1 text-xs font-medium text-brand-text">
                  {item.expected_answer}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

function Stat({
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
      className={`rounded-xl border border-brand-surface/80 bg-gradient-to-b ${ring} px-2 py-3 text-center`}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-brand-text/50">
        {label}
      </p>
      <p className="mt-1 text-lg font-bold tabular-nums text-brand-text">
        {value}
      </p>
      {sub ? (
        <p className="mt-0.5 text-[0.65rem] text-brand-text/55">{sub}</p>
      ) : null}
    </div>
  );
}
