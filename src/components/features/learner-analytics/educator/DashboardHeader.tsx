"use client";

import Link from "next/link";
import {
  Copy,
  ChevronDown,
  Download,
  Home,
  RefreshCw,
  Sparkles,
  Zap,
} from "lucide-react";

import { TeacherAvatar } from "@/components/common/TeacherAvatar";
import { WelcomeBannerShell } from "@/components/common/WelcomeBannerShell";
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
import { useUserStore } from "@/store/useUserStore";
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

const ghostBtn =
  "h-9 rounded-full border-white/35 bg-white/12 text-white hover:bg-white/22 hover:text-white";

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
  const user = useUserStore((state) => state.user);
  const firstName = (user?.name || "Teacher").split(" ")[0];

  const handleCopyCode = async () => {
    if (!classMeta?.classCode) return;
    try {
      await navigator.clipboard.writeText(classMeta.classCode);
    } catch {
      // Clipboard may be unavailable outside secure context.
    }
  };

  return (
    <WelcomeBannerShell>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-left">
          <div className="welcome-rise-1 welcome-banner__avatar-wrap shrink-0">
            <div className="welcome-banner__halo" aria-hidden />
            <TeacherAvatar
              size="lg"
              className="relative z-10 ring-2 ring-white/80 shadow-lg shadow-black/20"
            />
          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="welcome-rise-2 welcome-banner__badge inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur-md sm:justify-start">
              <Sparkles className="size-3.5 shrink-0 text-white" aria-hidden />
              Educator
              {classMeta ? (
                <>
                  <span className="font-semibold normal-case tracking-normal">
                    · {classMeta.className}
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopyCode()}
                    title="Copy class code"
                    className="welcome-banner__code rounded-full px-2 py-0.5 font-mono text-[10px] font-bold normal-case tracking-wide"
                  >
                    {classMeta.classCode}
                    <Copy className="ml-1 inline size-3 align-[-0.1em]" aria-hidden />
                  </button>
                </>
              ) : (
                <span className="font-semibold normal-case tracking-normal">
                  · Classroom Insights
                </span>
              )}
            </div>

            <h1 className="welcome-rise-3 welcome-banner__title text-xl font-black tracking-tight drop-shadow-sm sm:text-2xl">
              Welcome back, {firstName}!
            </h1>

            <p className="welcome-rise-4 flex items-start justify-center gap-1.5 text-sm leading-snug text-white/95 sm:justify-start sm:text-[0.95rem]">
              <Zap
                className="mt-0.5 size-4 shrink-0 text-[#ccefff] drop-shadow"
                aria-hidden
              />
              <span>
                {classMeta
                  ? `${learnerCount} learner${learnerCount === 1 ? "" : "s"} · ${topicCount} skill${topicCount === 1 ? "" : "s"}${
                      classMeta.gradeLevel
                        ? ` · Grade ${classMeta.gradeLevel}`
                        : ""
                    }${
                      lastRefreshedAt
                        ? ` · Updated ${new Date(lastRefreshedAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}`
                        : ""
                    }`
                  : "Pick a class to review mastery, at-risk learners, and student deep-dives."}
              </span>
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 lg:justify-end">
          <Button asChild size="sm" variant="outline" className={ghostBtn}>
            <Link href={EDUCATOR_HOME_PATH}>
              <Home className="size-3.5" aria-hidden />
              Home
            </Link>
          </Button>

          {teacherClasses.length > 1 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  "inline-flex h-9 max-w-[13rem] items-center gap-1 rounded-full border border-white/35 bg-white/12 px-3 text-xs font-medium text-white outline-none hover:bg-white/22"
                )}
              >
                <span className="truncate">Switch class</span>
                <ChevronDown className="size-3.5 shrink-0 opacity-80" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuRadioGroup
                  value={classMeta?.classCode}
                  onValueChange={onClassChange}
                >
                  {teacherClasses.map((row) => (
                    <DropdownMenuRadioItem
                      key={row.class_code}
                      value={row.class_code}
                    >
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
            className="h-9 rounded-full bg-white/95 px-4 text-brand-special shadow-sm hover:bg-white"
            onClick={onRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn("size-3.5", isLoading && "animate-spin")} />
            Refresh
          </Button>

          <Button
            size="sm"
            variant="outline"
            className={ghostBtn}
            onClick={onExportCsv}
            disabled={learnerCount === 0 || topicCount === 0}
          >
            <Download className="size-3.5" />
            Export
          </Button>
        </div>
      </div>
    </WelcomeBannerShell>
  );
}
