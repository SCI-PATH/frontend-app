"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

import { CollapsibleSection } from "@/components/features/learner-analytics/educator/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { countStudentTopicBands } from "@/lib/educator/bkt";
import { getStudentDisplayName } from "@/lib/educator/students";
import { EDUCATOR_AT_RISK } from "@/lib/educator/theme";
import { cn } from "@/lib/utils";
import type { AtRiskStudentAlert, ClassroomStudentMeta } from "@/types/educator";

interface EnrolledStudentsProps {
  students: readonly ClassroomStudentMeta[];
  studentIds: readonly string[];
  topicIds: readonly string[];
  classCode?: string;
  masteryMatrix: Record<string, Record<string, number | null>>;
  attemptMatrix: Record<string, Record<string, number>>;
  atRiskAlerts: readonly AtRiskStudentAlert[];
  selectedStudentId: string | null;
  onSelectStudent: (studentId: string) => void;
}

function attemptCountForLearner(
  attemptMatrix: Record<string, Record<string, number>>,
  learnerId: string
): number {
  const row = attemptMatrix[learnerId];
  if (!row) return 0;
  return Object.values(row).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

export function EnrolledStudents({
  students,
  studentIds,
  topicIds,
  classCode,
  masteryMatrix,
  attemptMatrix,
  atRiskAlerts,
  selectedStudentId,
  onSelectStudent,
}: EnrolledStudentsProps) {
  const [query, setQuery] = useState("");

  const riskCountByLearner = useMemo(() => {
    const counts = new Map<string, number>();
    for (const alert of atRiskAlerts) {
      counts.set(alert.student_id, (counts.get(alert.student_id) ?? 0) + 1);
    }
    return counts;
  }, [atRiskAlerts]);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return studentIds
      .map((learnerId) => {
        const displayName = getStudentDisplayName(learnerId, students);
        const bands = countStudentTopicBands(masteryMatrix[learnerId], topicIds);
        return {
          learnerId,
          displayName,
          bands,
          attempts: attemptCountForLearner(attemptMatrix, learnerId),
          riskFlags: riskCountByLearner.get(learnerId) ?? 0,
        };
      })
      .filter((row) => {
        if (!needle) return true;
        return (
          row.displayName.toLowerCase().includes(needle) ||
          row.learnerId.toLowerCase().includes(needle)
        );
      });
  }, [
    attemptMatrix,
    masteryMatrix,
    query,
    riskCountByLearner,
    studentIds,
    students,
    topicIds,
  ]);

  return (
    <CollapsibleSection
      title="Enrolled students"
      description="Everyone who joined this class with your code. Select a learner to open their deep-dive profile."
      badge={studentIds.length}
      defaultOpen
      accent="special"
    >
      {studentIds.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-brand-surface bg-brand-background px-4 py-10 text-center">
          <Users className="size-8 text-brand-special/50" aria-hidden />
          <p className="font-medium text-brand-text">No students enrolled yet</p>
          <p className="max-w-md text-sm text-brand-text/65">
            Share class code{" "}
            {classCode ? (
              <span className="font-mono font-semibold text-brand-primary">
                {classCode}
              </span>
            ) : (
              "from Classrooms"
            )}{" "}
            so learners can join at signup. The roster fills from class
            enrollments automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-brand-text/40"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or ID"
              className="h-9 border-brand-surface bg-brand-background/70 pl-8 text-sm"
              aria-label="Search enrolled students"
            />
          </div>

          {rows.length === 0 ? (
            <p className="rounded-lg border border-brand-surface bg-brand-background px-3 py-4 text-sm text-brand-text/65">
              No enrolled students match “{query.trim()}”.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-brand-surface">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-brand-background/80 text-xs tracking-wide text-brand-text/60 uppercase">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Student</th>
                    <th className="px-3 py-2 font-semibold">Learner ID</th>
                    <th className="px-3 py-2 font-semibold">Mastered</th>
                    <th className="px-3 py-2 font-semibold">Learning</th>
                    <th className="px-3 py-2 font-semibold">Needs support</th>
                    <th className="px-3 py-2 font-semibold">Quiz attempts</th>
                    <th className="px-3 py-2 font-semibold">
                      <span className="sr-only">Open profile</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const selected = row.learnerId === selectedStudentId;
                    return (
                      <tr
                        key={row.learnerId}
                        className={cn(
                          "border-t border-brand-surface/80",
                          selected
                            ? "bg-brand-special/10"
                            : "bg-white hover:bg-brand-background/60"
                        )}
                      >
                        <td className="px-3 py-2.5 font-medium text-brand-text">
                          {row.displayName}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-brand-text/60">
                          {row.learnerId}
                        </td>
                        <td className="px-3 py-2.5 text-brand-secondary">
                          {row.bands.mastered}
                        </td>
                        <td className="px-3 py-2.5 text-brand-primary">
                          {row.bands.learning}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-2.5",
                            row.riskFlags > 0 || row.bands.atRisk > 0
                              ? EDUCATOR_AT_RISK.text
                              : "text-brand-text/70"
                          )}
                        >
                          {row.bands.atRisk}
                          {row.riskFlags > 0 ? (
                            <span className="ml-1 text-xs">
                              ({row.riskFlags} alert
                              {row.riskFlags === 1 ? "" : "s"})
                            </span>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 text-brand-text/80">
                          {row.attempts}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            className={
                              selected
                                ? "h-7 bg-brand-special text-white hover:bg-brand-special/90"
                                : "h-7 border-brand-surface bg-white text-brand-text hover:bg-brand-background"
                            }
                            onClick={() => onSelectStudent(row.learnerId)}
                          >
                            {selected ? "Viewing" : "View profile"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
