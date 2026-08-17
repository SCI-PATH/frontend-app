"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getCurriculumTitle,
  getCurriculumTopic,
} from "@/lib/curriculum/topics";
import {
  masteryCellClassName,
  masteryPercent,
} from "@/lib/educator/bkt";
import { cn } from "@/lib/utils";
import { EDUCATOR_AT_RISK } from "@/lib/educator/theme";
import { getStudentDisplayName } from "@/lib/educator/students";
import type { ClassroomStudentMeta, ClassroomTopicMeta } from "@/types/educator";

interface MasteryMatrixProps {
  matrix: Record<string, Record<string, number | null>>;
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

export function MasteryMatrix({
  matrix,
  studentIds,
  students = [],
  topicIds,
  topicCatalog,
  unknownTopicIds,
  showHeader = true,
}: MasteryMatrixProps) {
  const [hover, setHover] = useState<HoverState | null>(null);

  const catalogById = useMemo(
    () => new Map(topicCatalog.map((topic) => [topic.topicId, topic])),
    [topicCatalog]
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
    <section aria-label="Classroom mastery matrix" className="space-y-4">
      {showHeader ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-brand-text">
              Classroom Mastery Matrix
            </h2>
            <p className="text-sm text-brand-text/65">
              Scroll horizontally to inspect all curriculum columns.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={EDUCATOR_AT_RISK.badge}>At Risk &lt; 50%</Badge>
            <Badge className="bg-brand-primary text-white hover:bg-brand-primary">
              Learning 50–79%
            </Badge>
            <Badge className="bg-brand-secondary text-brand-text hover:bg-brand-secondary">
              Mastered ≥ 80%
            </Badge>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pb-1">
          <Badge className={EDUCATOR_AT_RISK.badge}>At Risk &lt; 50%</Badge>
          <Badge className="bg-brand-primary text-white hover:bg-brand-primary">
            Learning 50–79%
          </Badge>
          <Badge className="bg-brand-secondary text-brand-text hover:bg-brand-secondary">
            Mastered ≥ 80%
          </Badge>
        </div>
      )}

      {unknownTopicIds.length > 0 ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-sm text-red-700">
            Some topic IDs are unknown to the BKT model:{" "}
            {unknownTopicIds.join(", ")}
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden border-brand-surface bg-white">
        <CardHeader className="border-b border-brand-surface pb-4">
          <CardTitle className="text-base text-brand-text">
            Mastery grid · {topicIds.length} topics · {studentIds.length}{" "}
            learners
          </CardTitle>
          <CardDescription>
            Hover a cell for curriculum title and fitted guess/slip parameters.
          </CardDescription>
        </CardHeader>
        <CardContent className="relative p-0">
          <div className="overflow-x-auto">
            <table className="min-w-max border-separate border-spacing-1 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 min-w-[9rem] bg-brand-background px-3 py-2 text-left font-semibold text-brand-text shadow-[4px_0_8px_-4px_rgba(0,0,0,0.12)]">
                    Student
                  </th>
                  {topicIds.map((topicId) => (
                    <th
                      key={topicId}
                      className="min-w-[3.25rem] max-w-[3.25rem] bg-brand-background px-1 py-2 text-center align-bottom font-medium text-brand-text/70"
                    >
                      <span
                        className="inline-block max-h-28 overflow-hidden text-[0.62rem] leading-tight [writing-mode:vertical-rl] [transform:rotate(180deg)]"
                        title={resolveTitle(topicId)}
                      >
                        {topicId}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {studentIds.map((studentId) => (
                  <tr key={studentId}>
                    <th className="sticky left-0 z-10 max-w-[11rem] bg-white px-3 py-1 text-left font-medium text-brand-text shadow-[4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                      <span className="block truncate">
                        {getStudentDisplayName(studentId, students)}
                      </span>
                      <span className="block truncate font-mono text-[0.62rem] font-normal text-brand-text/45">
                        {studentId}
                      </span>
                    </th>
                    {topicIds.map((topicId) => {
                      const probability = matrix[studentId]?.[topicId] ?? null;
                      const percent = masteryPercent(probability);
                      return (
                        <td key={`${studentId}-${topicId}`} className="p-0">
                          <button
                            type="button"
                            className={cn(
                              "flex h-8 w-full min-w-[3.1rem] items-center justify-center rounded-md text-[0.72rem] font-semibold transition",
                              masteryCellClassName(probability)
                            )}
                            onMouseEnter={(event) =>
                              setHover({
                                studentId,
                                topicId,
                                probability,
                                x: event.clientX,
                                y: event.clientY,
                              })
                            }
                            onMouseMove={(event) =>
                              setHover((current) =>
                                current
                                  ? {
                                      ...current,
                                      x: event.clientX,
                                      y: event.clientY,
                                    }
                                  : null
                              )
                            }
                            onMouseLeave={() => setHover(null)}
                            onFocus={(event) => {
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
                            aria-label={`${studentId} ${topicId} mastery ${percent ?? "unknown"} percent`}
                          >
                            {percent ?? "—"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
              <p className="font-mono text-[0.62rem] text-brand-text/45">
                {tooltip.studentId}
              </p>
              <p className="mt-1 font-mono text-[0.68rem] text-brand-primary">
                {tooltip.topicId}
              </p>
              <p className="mt-2 text-brand-text/80">{tooltip.title}</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-brand-background px-2 py-1">
                  <p className="text-[0.62rem] uppercase text-brand-text/50">
                    P(L)
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
