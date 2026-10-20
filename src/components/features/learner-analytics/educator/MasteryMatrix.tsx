"use client";

import { useMemo, useState, type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCurriculumTitle } from "@/lib/curriculum/topics";
import {
  getCellAttemptCount,
  isUnattemptedBaselineCell,
  masteryCategoryFromProbability,
  masteryCellClassName,
  masteryPercent,
} from "@/lib/educator/bkt";
import { getStudentDisplayName } from "@/lib/educator/students";
import {
  cellMatchesStatusFilter,
  countCellsByStatus,
  filterStudentIdsByStatus,
  MATRIX_STATUS_FILTERS,
  type MatrixStatusFilter,
} from "@/lib/educator/matrixFilters";
import {
  compactTopicLabel,
  filterTopicIdsByGrade,
  type MatrixGradeFilter,
} from "@/lib/educator/topicGrade";
import { cn } from "@/lib/utils";
import type { ClassroomStudentMeta, ClassroomTopicMeta } from "@/types/educator";

interface MasteryMatrixProps {
  matrix: Record<string, Record<string, number | null>>;
  attemptMatrix?: Record<string, Record<string, number>>;
  studentIds: readonly string[];
  students: readonly ClassroomStudentMeta[];
  topicIds: readonly string[];
  topicCatalog: readonly ClassroomTopicMeta[];
  unknownTopicIds: readonly string[];
  showHeader?: boolean;
  gradeLevel?: number;
  onSelectStudent?: (studentId: string) => void;
}

type MatrixCoverage = "attempted" | "all";

interface HoverState {
  studentId: string;
  topicId: string;
  probability: number | null;
  x: number;
  y: number;
}

function MatrixColorKey() {
  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] text-brand-text/60">
      <li className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-red-600" aria-hidden />
        Support &lt;50%
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-brand-primary" aria-hidden />
        Learning 50–79%
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-brand-secondary" aria-hidden />
        Mastered ≥80%
      </li>
      <li className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-slate-200 ring-1 ring-slate-300" aria-hidden />
        Not attempted
      </li>
    </ul>
  );
}

const STATUS_FILTER_STYLES: Record<
  MatrixStatusFilter,
  { idle: string; active: string; swatch: string }
> = {
  all: {
    idle: "border-brand-surface bg-white text-brand-text hover:bg-brand-background",
    active: "border-brand-text bg-brand-text text-white",
    swatch: "bg-brand-primary",
  },
  at_risk: {
    idle: "border-red-200 bg-white text-red-700 hover:bg-red-50",
    active: "border-red-600 bg-red-600 text-white",
    swatch: "bg-red-600",
  },
  learning: {
    idle: "border-brand-primary/25 bg-white text-brand-primary hover:bg-brand-primary/10",
    active: "border-brand-primary bg-brand-primary text-white",
    swatch: "bg-brand-primary",
  },
  mastered: {
    idle: "border-brand-secondary/40 bg-white text-brand-text hover:bg-brand-secondary/15",
    active: "border-brand-secondary bg-brand-secondary text-brand-text",
    swatch: "bg-brand-secondary",
  },
  not_started: {
    idle: "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
    active: "border-slate-500 bg-slate-500 text-white",
    swatch: "bg-slate-300 ring-1 ring-slate-400",
  },
};

function classGradeFilter(gradeLevel?: number): MatrixGradeFilter {
  if (gradeLevel === 6 || gradeLevel === 7 || gradeLevel === 8 || gradeLevel === 9) {
    return String(gradeLevel) as MatrixGradeFilter;
  }
  return "all";
}

function MatrixFilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <p className="shrink-0 text-[0.65rem] font-semibold uppercase tracking-wide text-brand-text/45">
        {label}
      </p>
      {children}
    </div>
  );
}

export function MasteryMatrix({
  matrix,
  attemptMatrix,
  studentIds,
  students = [],
  topicIds,
  topicCatalog,
  unknownTopicIds,
  showHeader = true,
  gradeLevel,
  onSelectStudent,
}: MasteryMatrixProps) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [statusFilter, setStatusFilter] = useState<MatrixStatusFilter>("all");
  const [coverage, setCoverage] = useState<MatrixCoverage>("attempted");
  const gradeFilter = classGradeFilter(gradeLevel);

  const catalogById = useMemo(
    () => new Map(topicCatalog.map((topic) => [topic.topicId, topic])),
    [topicCatalog]
  );

  const priorByTopicId = useMemo(() => {
    const priors: Record<string, number> = {};
    for (const topic of topicCatalog) {
      priors[topic.topicId] = topic.pL0;
    }
    return priors;
  }, [topicCatalog]);

  const statusContext = useMemo(
    () => ({ attemptMatrix, priorByTopicId }),
    [attemptMatrix, priorByTopicId]
  );

  const gradeTopicIds = useMemo(
    () => filterTopicIdsByGrade(topicIds, gradeFilter),
    [topicIds, gradeFilter]
  );

  const topicStats = useMemo(() => {
    return gradeTopicIds.map((topicId, index) => {
      const pL0 = catalogById.get(topicId)?.pL0 ?? 0.25;
      let support = 0;
      let withEvidence = 0;
      for (const studentId of studentIds) {
        const attempts = getCellAttemptCount(attemptMatrix, studentId, topicId);
        const probability = matrix[studentId]?.[topicId] ?? null;
        if (isUnattemptedBaselineCell(probability, pL0, attempts)) continue;
        withEvidence += 1;
        if (masteryCategoryFromProbability(probability) === "at_risk") {
          support += 1;
        }
      }
      return { topicId, index, support, withEvidence };
    });
  }, [attemptMatrix, catalogById, gradeTopicIds, matrix, studentIds]);

  const evidenceCount = useMemo(
    () => topicStats.filter((row) => row.withEvidence > 0).length,
    [topicStats]
  );

  const columnTopicIds = useMemo(() => {
    if (coverage === "all") return gradeTopicIds;
    return topicStats
      .filter((row) => row.withEvidence > 0)
      .sort(
        (a, b) =>
          b.support - a.support ||
          b.withEvidence - a.withEvidence ||
          a.index - b.index
      )
      .map((row) => row.topicId);
  }, [coverage, gradeTopicIds, topicStats]);

  const visibleStudentIds = useMemo(
    () =>
      filterStudentIdsByStatus(
        matrix,
        studentIds,
        columnTopicIds,
        statusFilter,
        statusContext
      ),
    [matrix, studentIds, columnTopicIds, statusFilter, statusContext]
  );

  const matchingCellCount = useMemo(
    () =>
      countCellsByStatus(
        matrix,
        visibleStudentIds,
        columnTopicIds,
        statusFilter,
        statusContext
      ),
    [matrix, visibleStudentIds, columnTopicIds, statusFilter, statusContext]
  );

  const resolveTitle = (topicId: string) =>
    catalogById.get(topicId)?.curriculumTitle ??
    getCurriculumTitle(topicId);

  const tooltip = useMemo(() => {
    if (!hover) return null;
    return {
      studentId: hover.studentId,
      studentName: getStudentDisplayName(hover.studentId, students),
      topicId: hover.topicId,
      title: resolveTitle(hover.topicId),
      mastery: masteryPercent(hover.probability),
    };
  }, [hover, catalogById, students]);

  return (
    <section aria-label="Classroom mastery matrix" className="space-y-3">
      {showHeader ? (
        <div>
          <h2 className="text-xl font-semibold text-brand-text">
            Classroom Mastery Matrix
          </h2>
          <p className="text-sm text-brand-text/65">
            Filter by learning status, then hover a cell for the full skill title.
          </p>
        </div>
      ) : null}

      <div className="space-y-3 rounded-xl border border-brand-surface bg-brand-background/50 px-3 py-3">
        <MatrixFilterGroup label="Skills">
          <Tabs
            value={coverage}
            onValueChange={(value) => setCoverage(value as MatrixCoverage)}
          >
            <TabsList className="h-8 bg-white p-0.5">
              <TabsTrigger
                value="attempted"
                className="h-7 px-2.5 text-xs data-[state=active]:bg-brand-primary data-[state=active]:text-white"
              >
                With evidence
              </TabsTrigger>
              <TabsTrigger
                value="all"
                className="h-7 px-2.5 text-xs data-[state=active]:bg-brand-primary data-[state=active]:text-white"
              >
                Full curriculum
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </MatrixFilterGroup>

        <div
          className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
          role="tablist"
          aria-label="Filter the grid by learning status"
        >
          {MATRIX_STATUS_FILTERS.map(({ value, label }) => {
            const count =
              value === "all"
                ? studentIds.length * columnTopicIds.length
                : countCellsByStatus(
                    matrix,
                    studentIds,
                    columnTopicIds,
                    value,
                    statusContext
                  );
            const selected = statusFilter === value;
            const styles = STATUS_FILTER_STYLES[value];
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
                  selected ? styles.active : styles.idle
                )}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-sm",
                      styles.swatch,
                      selected && "ring-2 ring-white/80"
                    )}
                    aria-hidden
                  />
                  <span className="truncate text-xs font-semibold">{label}</span>
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-brand-text/65">
        {coverage === "attempted" ? (
          <>
            Showing {evidenceCount} of {gradeTopicIds.length} skills with quiz
            evidence.{" "}
            {gradeTopicIds.length - evidenceCount > 0
              ? `${gradeTopicIds.length - evidenceCount} have not been started by anyone in this class. `
              : null}
            Skills that need the most support are on the left.
          </>
        ) : (
          <>
            Showing all {gradeTopicIds.length} skills.{" "}
            {gradeTopicIds.length - evidenceCount} have no quiz evidence yet.
          </>
        )}
      </p>

      {unknownTopicIds.length > 0 ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-sm text-red-700">
            Some topic IDs are unknown to the BKT model:{" "}
            {unknownTopicIds.join(", ")}
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden border-brand-surface bg-white">
        <CardHeader className="border-b border-brand-surface pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <CardTitle className="text-base text-brand-text">
              Mastery grid · {columnTopicIds.length} skills ·{" "}
              {visibleStudentIds.length} learner
              {visibleStudentIds.length === 1 ? "" : "s"}
              {statusFilter !== "all"
                ? ` · ${matchingCellCount} matching cells`
                : null}
            </CardTitle>
            <MatrixColorKey />
          </div>
          {statusFilter !== "all" ? (
            <CardDescription>
              Cells that do not match this status are dimmed. Hover a cell for the
              full skill title.
            </CardDescription>
          ) : null}
        </CardHeader>
        <CardContent className="relative p-0">
          {columnTopicIds.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-brand-text/60">
              {coverage === "attempted"
                ? "No skills in this class have quiz evidence yet. Switch to Full curriculum to see skills nobody has started."
                : "No skills are available for this class."}
            </p>
          ) : visibleStudentIds.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-brand-text/60">
              No learners match this status.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-separate border-spacing-1 text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 min-w-[9rem] bg-white px-3 py-2 text-left font-semibold text-brand-text shadow-sm">
                      Student
                    </th>
                    {columnTopicIds.map((topicId) => (
                      <th
                        key={topicId}
                        className="h-[6rem] min-w-[3.25rem] bg-brand-background px-0.5 align-bottom"
                      >
                        <div className="flex h-full items-end justify-start pb-2 pl-2">
                          <span
                            className="inline-block origin-bottom-left -rotate-45 cursor-default whitespace-nowrap font-mono text-[0.58rem] font-semibold leading-none text-brand-primary"
                            title={`${topicId}\n${resolveTitle(topicId)}`}
                          >
                            {compactTopicLabel(topicId)}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleStudentIds.map((studentId) => (
                    <tr key={studentId}>
                      <th className="sticky left-0 z-20 max-w-[11rem] bg-white px-3 py-1 text-left font-medium text-brand-text shadow-sm">
                        <span className="block truncate">
                          {getStudentDisplayName(studentId, students)}
                        </span>
                      </th>
                      {columnTopicIds.map((topicId) => {
                        const probability =
                          matrix[studentId]?.[topicId] ?? null;
                        const pL0 =
                          catalogById.get(topicId)?.pL0 ?? 0.25;
                        const attempts = getCellAttemptCount(
                          attemptMatrix,
                          studentId,
                          topicId
                        );
                        const percent = masteryPercent(probability);
                        const matchesStatus = cellMatchesStatusFilter(
                          probability,
                          statusFilter,
                          pL0,
                          attempts
                        );
                        const showValue =
                          statusFilter === "all" || matchesStatus;
                        return (
                          <td key={`${studentId}-${topicId}`} className="p-0">
                            <button
                              type="button"
                              className={cn(
                                "flex h-8 w-full min-w-[3.25rem] items-center justify-center rounded-md text-[0.72rem] font-semibold transition",
                                showValue
                                  ? masteryCellClassName(probability, {
                                      pL0,
                                      attempts,
                                    })
                                  : "bg-brand-surface/70 text-brand-text/25"
                              )}
                              onMouseEnter={(event) =>
                                showValue
                                  ? setHover({
                                      studentId,
                                      topicId,
                                      probability,
                                      x: event.clientX,
                                      y: event.clientY,
                                    })
                                  : null
                              }
                              onMouseMove={(event) =>
                                showValue
                                  ? setHover((current) =>
                                      current
                                        ? {
                                            ...current,
                                            x: event.clientX,
                                            y: event.clientY,
                                          }
                                        : null
                                    )
                                  : null
                              }
                              onMouseLeave={() => setHover(null)}
                              onFocus={(event) => {
                                if (!showValue) return;
                                const rect =
                                  event.currentTarget.getBoundingClientRect();
                                setHover({
                                  studentId,
                                  topicId,
                                  probability,
                                  x: rect.left + rect.width / 2,
                                  y: rect.top,
                                });
                              }}
                              onBlur={() => setHover(null)}
                              aria-label={`${getStudentDisplayName(studentId, students)} ${topicId} estimated mastery ${showValue ? (percent ?? "unknown") : "filtered out"} percent. Open learner profile.`}
                              onClick={() => onSelectStudent?.(studentId)}
                            >
                              {showValue ? (percent ?? "—") : "·"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tooltip && hover ? (
            <div
              className="pointer-events-none fixed z-50 w-72 rounded-xl border border-brand-surface bg-white p-3 text-xs shadow-lg"
              style={{
                left: Math.min(
                  hover.x + 12,
                  typeof window !== "undefined" ? window.innerWidth - 300 : hover.x + 12
                ),
                top: Math.max(hover.y - 120, 12),
              }}
            >
              <p className="font-semibold text-brand-text">{tooltip.studentName}</p>
              <p className="mt-1 font-mono text-[0.68rem] text-brand-primary">
                {tooltip.topicId}
              </p>
              <p className="mt-2 text-brand-text/80">{tooltip.title}</p>
              <p className="mt-3 rounded-lg bg-brand-background px-2 py-1.5 text-center">
                <span className="text-[0.62rem] uppercase text-brand-text/50">
                  Mastery
                </span>
                <span className="ml-2 font-bold text-brand-text">
                  {tooltip.mastery ?? "—"}%
                </span>
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
