"use client";

import Link from "next/link";
import { Copy, ChevronDown, Download, GraduationCap, Home, RefreshCw } from "lucide-react";

import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Button } from "@/components/ui/button";
import { EDUCATOR_HOME_PATH } from "@/lib/auth-routes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ClassScopeMeta, TeacherClass } from "@/types/educator";

interface DashboardHeaderProps {
  classMeta: ClassScopeMeta | null;
  teacherClasses: readonly TeacherClass[];
  learnerCount: number;
  topicCount: number;
  isLoading: boolean;
  lastRefreshedAt: string | null;
  onClassChange: (classCode: string) => void;
  onRefresh: () => void;
  onExportCsv: () => void;
}

export function DashboardHeader({
  classMeta,
  teacherClasses,
  learnerCount,
  topicCount,
  isLoading,
  lastRefreshedAt,
  onClassChange,
  onRefresh,
  onExportCsv,
}: DashboardHeaderProps) {
  const handleCopyCode = async () => {
    if (!classMeta?.classCode) return;
    try {
      await navigator.clipboard.writeText(classMeta.classCode);
    } catch {
      // Clipboard may be unavailable outside secure context.
    }
  };

  return (
    <header className="overflow-hidden rounded-xl border border-brand-surface bg-white shadow-sm">
      <BrandGradientBar />

      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#00A8E8_0%,#7209B7_100%)] text-white shadow-sm shadow-brand-primary/20">
            <GraduationCap className="size-5" aria-hidden />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-bold tracking-tight text-brand-text sm:text-xl">
                Classroom Insights
              </h1>
              <span className="rounded-md bg-brand-special/10 px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-brand-special">
                Educator
              </span>
            </div>

            {classMeta ? (
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                <span className="font-medium text-brand-text">
                  {classMeta.className}
                </span>
                <span className="text-brand-text/35">·</span>
                <button
                  type="button"
                  onClick={() => void handleCopyCode()}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-background px-1.5 py-0.5 font-mono text-[0.68rem] text-brand-primary hover:bg-brand-primary/10 sm:text-xs"
                  title="Copy class code for learners"
                >
                  {classMeta.classCode}
                  <Copy className="size-3" aria-hidden />
                </button>
                {classMeta.gradeLevel ? (
                  <>
                    <span className="text-brand-text/35">·</span>
                    <span className="text-brand-text/60">
                      Grade {classMeta.gradeLevel}
                      {classMeta.subject ? ` ${classMeta.subject}` : ""}
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}

            <p className="truncate text-xs text-brand-text/60 sm:text-sm">
              {learnerCount} learner{learnerCount === 1 ? "" : "s"} · {topicCount}{" "}
              skill{topicCount === 1 ? "" : "s"}
              {lastRefreshedAt ? (
                <span className="hidden text-brand-text/45 sm:inline">
                  {" "}
                  · Updated{" "}
                  {new Date(lastRefreshedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-8 border-brand-surface bg-white text-brand-text hover:bg-brand-background"
          >
            <Link href={EDUCATOR_HOME_PATH}>
              <Home className="size-3.5" aria-hidden />
              Home
            </Link>
          </Button>

          {teacherClasses.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex h-8 max-w-[12rem] items-center gap-1 rounded-md border border-brand-surface bg-brand-background px-2.5 text-xs font-medium text-brand-text outline-none hover:bg-white">
                <span className="truncate">Switch class</span>
                <ChevronDown className="size-3.5 shrink-0 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuRadioGroup
                  value={classMeta?.classCode}
                  onValueChange={onClassChange}
                >
                  {teacherClasses.map((row) => (
                    <DropdownMenuRadioItem key={row.class_code} value={row.class_code}>
                      <span className="flex flex-col gap-0.5">
                        <span>{row.class_name}</span>
                        <span className="font-mono text-[0.65rem] text-brand-text/45">
                          {row.class_code}
                        </span>
                      </span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <Button
            size="sm"
            className="h-8 bg-brand-primary text-white hover:bg-brand-primary/90"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-8 border-brand-surface bg-white text-brand-text hover:bg-brand-background"
            onClick={onExportCsv}
            disabled={learnerCount === 0 || topicCount === 0}
          >
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      </div>
    </header>
  );
}
