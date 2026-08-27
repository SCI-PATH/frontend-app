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
import {
  getCurriculumTitle,
  getCurriculumTopic,
} from "@/lib/curriculum/topics";
import {
  getCellAttemptCount,
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
  MATRIX_GRADE_FILTERS,
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
}

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
}: MasteryMatrixProps) {
  const [hover, setHover] = useState<HoverState | null>(null);
  const [gradeFilter, setGradeFilter] = useState<MatrixGradeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<MatrixStatusFilter>("all");

  const catalogById = useMemo(
    () => new Map(topicCatalog.map((topic) => [topic.topicId, topic])),
    [topicCatalog]
  );

  const visibleTopicIds = useMemo(
    () => filterTopicIdsByGrade(topicIds, gradeFilter),
    [topicIds, gradeFilter]
  );

  const visibleStudentIds = useMemo(
    () =>
      filterStudentIdsByStatus(
        matrix,
        studentIds,
        visibleTopicIds,
        statusFilter
      ),
    [matrix, studentIds, visibleTopicIds, statusFilter]
  );

  const matchingCellCount = useMemo(
    () =>
      countCellsByStatus(
        matrix,
        visibleStudentIds,
        visibleTopicIds,
        statusFilter
      ),
    [matrix, visibleStudentIds, visibleTopicIds, statusFilter]
  );

  const resolveTitle = (topicId: string) =>
    catalogById.get(topicId)?.curriculumTitle ??
    getCurriculumTitle(topicId);

  const tooltip = useMemo(() => {
    if (!hover) return null;
    const live = catalogById.get(hover.topicId);
    const fallback = getCurriculumTopic(hover.topicId);
    return {
      studentId: hover.studentId,
      studentName: getStudentDisplayName(hover.studentId, students),
      topicId: hover.topicId,
      title: resolveTitle(hover.topicId),
      mastery: masteryPercent(hover.probability),
      pG: live?.pG ?? fallback?.pG ?? null,
      pS: live?.pS ?? fallback?.pS ?? null,
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
            Filter by grade or learning status, then hover a cell for the full skill title.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 rounded-xl border border-brand-surface bg-brand-background/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
          <MatrixFilterGroup label="Grade">
            <Tabs
              value={gradeFilter}
              onValueChange={(value) =>
                setGradeFilter(value as MatrixGradeFilter)
              }
            >
              <TabsList className="h-8 max-w-full overflow-x-auto bg-white p-0.5">
                {MATRIX_GRADE_FILTERS.map(({ value, shortLabel }) => {
                  const count =
                    value === "all"
                      ? topicIds.length
                      : filterTopicIdsByGrade(topicIds, value).length;
                  return (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="h-7 min-w-8 px-2 text-xs data-[state=active]:bg-brand-primary data-[state=active]:text-white"
                    >
                      {shortLabel}
                      <span className="text-[0.6rem] tabular-nums opacity-70">
                        {count}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </MatrixFilterGroup>

          <MatrixFilterGroup label="Status">
            <Tabs
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as MatrixStatusFilter)
              }
            >
              <TabsList className="h-8 max-w-full overflow-x-auto bg-white p-0.5">
                {MATRIX_STATUS_FILTERS.map(({ value, shortLabel }) => {
                  const count =
                    value === "all"
                      ? studentIds.length * visibleTopicIds.length
                      : countCellsByStatus(
                          matrix,
                          studentIds,
                          visibleTopicIds,
                          value
                        );
                  return (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className="h-7 px-2 text-xs data-[state=active]:bg-brand-text data-[state=active]:text-white"
                    >
                      {shortLabel}
                      <span className="text-[0.6rem] tabular-nums opacity-70">
                        {count}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </MatrixFilterGroup>
        </div>
      </div>

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
              Mastery grid · {visibleTopicIds.length} skills ·{" "}
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
          {visibleTopicIds.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-brand-text/60">
              No topics match this grade filter.
            </p>
          ) : visibleStudentIds.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-brand-text/60">
              No learners have skills in this grade + status combination.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-max border-separate border-spacing-1 text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-20 min-w-[9rem] bg-white px-3 py-2 text-left font-semibold text-brand-text shadow-sm">
                      Student
                    </th>
                    {visibleTopicIds.map((topicId) => (
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
                      {visibleTopicIds.map((topicId) => {
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
                          statusFilter
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
                              aria-label={`${getStudentDisplayName(studentId, students)} ${topicId} estimated mastery ${showValue ? (percent ?? "unknown") : "filtered out"} percent`}
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
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-brand-background px-2 py-1">
                  <p className="text-[0.62rem] uppercase text-brand-text/50">
                    Mastery
                  </p>
                  <p className="font-bold text-brand-text">
                    {tooltip.mastery ?? "—"}%
                  </p>
                </div>
                <div className="rounded-lg bg-brand-background px-2 py-1">
                  <p className="text-[0.62rem] uppercase text-brand-text/50">
                    P(G)
                  </p>
                  <p className="font-bold text-brand-text">
                    {tooltip.pG !== null ? tooltip.pG.toFixed(2) : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-brand-background px-2 py-1">
                  <p className="text-[0.62rem] uppercase text-brand-text/50">
                    P(S)
                  </p>
                  <p className="font-bold text-brand-text">
                    {tooltip.pS !== null ? tooltip.pS.toFixed(2) : "—"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
}
