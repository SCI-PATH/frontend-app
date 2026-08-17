"use client";

import { Download, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  learnerCount: number;
  topicCount: number;
  isLoading: boolean;
  lastRefreshedAt: string | null;
  onRefresh: () => void;
  onExportCsv: () => void;
}

export function DashboardHeader({
  learnerCount,
  topicCount,
  isLoading,
  lastRefreshedAt,
  onRefresh,
  onExportCsv,
}: DashboardHeaderProps) {
  return (
    <header className="rounded-2xl border border-brand-surface bg-white p-5 shadow-sm sm:p-6 lg:p-7">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-special">
            SCI-PATH Educator
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text sm:text-3xl lg:text-4xl">
            Classroom Insight Dashboard
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-brand-text/70 sm:text-base">
            Mastery matrix, at-risk intervention alerts, and conversational
            engagement diagnostics for your classroom.
          </p>
          <p className="text-sm font-medium text-brand-text/55">
            {learnerCount} learner{learnerCount === 1 ? "" : "s"} · {topicCount}{" "}
            skill{topicCount === 1 ? "" : "s"}
          </p>
          {lastRefreshedAt ? (
            <p className="text-xs text-brand-text/45">
              Last refreshed{" "}
              {new Date(lastRefreshedAt).toLocaleString(undefined, {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <Button
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("size-4", isLoading && "animate-spin")} />
            Refresh Data
          </Button>

          <Button
            variant="outline"
            className="border-brand-surface bg-white text-brand-text hover:bg-brand-background"
            onClick={onExportCsv}
            disabled={learnerCount === 0 || topicCount === 0}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>
    </header>
  );
}
