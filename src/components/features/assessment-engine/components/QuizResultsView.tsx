"use client";

import type { ReactNode } from "react";
import { Sparkles, Trophy } from "lucide-react";

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
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Stat
            label="Score"
            value={scorePct != null ? `${scorePct}%` : "—"}
          />
          <Stat
            label="Correct"
            value={
              correct != null ? `${correct}${total ? ` / ${total}` : ""}` : "—"
            }
          />
          <Stat label="Status" value={results.status ?? "done"} />
        </div>

        {results.items && results.items.length > 0 ? (
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-sm font-medium text-brand-text">
              <Sparkles className="size-4 text-brand-special" aria-hidden />
              Question breakdown
            </p>
            <ul className="max-h-64 space-y-2 overflow-y-auto">
              {results.items.map((item, idx) => (
                <li
                  key={item.question_id || idx}
                  className="rounded-lg border border-brand-surface bg-brand-background/80 px-3 py-2 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-brand-text/80 line-clamp-2">
                      {item.prompt ?? `Question ${idx + 1}`}
                    </p>
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
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
      {(onAgain || footer) && (
        <CardFooter className="justify-center gap-3 border-brand-surface">
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
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-surface bg-brand-background/70 px-2 py-3">
      <p className="text-xs text-brand-text/55">{label}</p>
      <p className="mt-1 text-lg font-semibold text-brand-text">{value}</p>
    </div>
  );
}
