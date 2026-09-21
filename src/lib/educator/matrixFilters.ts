import type { MasteryCategory } from "@/types/educator";
import {
  getCellAttemptCount,
  isUnattemptedBaselineCell,
  masteryCategoryFromProbability,
} from "@/lib/educator/bkt";

/** UI-only intervention tiers (matches Streamlit `_risk_tier` and BE `risk_score`). */
export const RISK_SCORE_SIGNALS = {
  lowMastery: 40,
  decliningVelocity: 30,
  weakRecentPerformance: 30,
  criticalLowMasteryFloor: 85,
} as const;

export type MatrixStatusFilter = "all" | MasteryCategory | "not_started";

export const MATRIX_STATUS_FILTERS: readonly {
  value: MatrixStatusFilter;
  label: string;
  shortLabel: string;
}[] = [
  { value: "all", label: "All statuses", shortLabel: "All" },
  { value: "at_risk", label: "Needs support", shortLabel: "Support" },
  { value: "learning", label: "Still learning", shortLabel: "Learning" },
  { value: "mastered", label: "Mastered", shortLabel: "Mastered" },
  { value: "not_started", label: "Not started", shortLabel: "Not started" },
];

export interface MatrixStatusContext {
  attemptMatrix?: Record<string, Record<string, number>>;
  priorByTopicId?: Record<string, number>;
}

export function cellMatchesStatusFilter(
  probability: number | null | undefined,
  filter: MatrixStatusFilter,
  pL0 = 0.25,
  attempts = 0
): boolean {
  if (filter === "all") return true;
  const unattempted = isUnattemptedBaselineCell(probability, pL0, attempts);
  if (filter === "not_started") return unattempted;
  if (unattempted) return false;
  return masteryCategoryFromProbability(probability ?? null) === filter;
}

function cellPriorAndAttempts(
  studentId: string,
  topicId: string,
  context?: MatrixStatusContext
) {
  return {
    pL0: context?.priorByTopicId?.[topicId] ?? 0.25,
    attempts: getCellAttemptCount(context?.attemptMatrix, studentId, topicId),
  };
}

export function filterStudentIdsByStatus(
  matrix: Record<string, Record<string, number | null>>,
  studentIds: readonly string[],
  topicIds: readonly string[],
  statusFilter: MatrixStatusFilter,
  context?: MatrixStatusContext
): string[] {
  if (statusFilter === "all") return [...studentIds];

  return studentIds.filter((studentId) =>
    topicIds.some((topicId) => {
      const { pL0, attempts } = cellPriorAndAttempts(
        studentId,
        topicId,
        context
      );
      return cellMatchesStatusFilter(
        matrix[studentId]?.[topicId],
        statusFilter,
        pL0,
        attempts
      );
    })
  );
}

export function countCellsByStatus(
  matrix: Record<string, Record<string, number | null>>,
  studentIds: readonly string[],
  topicIds: readonly string[],
  statusFilter: MatrixStatusFilter,
  context?: MatrixStatusContext
): number {
  let count = 0;
  for (const studentId of studentIds) {
    for (const topicId of topicIds) {
      const { pL0, attempts } = cellPriorAndAttempts(
        studentId,
        topicId,
        context
      );
      if (
        cellMatchesStatusFilter(
          matrix[studentId]?.[topicId],
          statusFilter,
          pL0,
          attempts
        )
      ) {
        count += 1;
      }
    }
  }
  return count;
}
