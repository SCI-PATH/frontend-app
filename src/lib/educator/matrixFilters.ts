import type { MasteryCategory } from "@/types/educator";
import { masteryCategoryFromProbability } from "@/lib/educator/bkt";

/** UI-only intervention tiers (matches Streamlit `_risk_tier` and BE `risk_score`). */
export const RISK_SCORE_SIGNALS = {
  lowMastery: 40,
  decliningVelocity: 30,
  weakRecentPerformance: 30,
  criticalLowMasteryFloor: 85,
} as const;

export type MatrixStatusFilter = "all" | MasteryCategory;

export const MATRIX_STATUS_FILTERS: readonly {
  value: MatrixStatusFilter;
  label: string;
  shortLabel: string;
}[] = [
  { value: "all", label: "All statuses", shortLabel: "All" },
  { value: "at_risk", label: "Needs support", shortLabel: "Support" },
  { value: "learning", label: "Still learning", shortLabel: "Learning" },
  { value: "mastered", label: "Mastered", shortLabel: "Mastered" },
];

export function cellMatchesStatusFilter(
  probability: number | null | undefined,
  filter: MatrixStatusFilter
): boolean {
  if (filter === "all") return true;
  return masteryCategoryFromProbability(probability ?? null) === filter;
}

export function filterStudentIdsByStatus(
  matrix: Record<string, Record<string, number | null>>,
  studentIds: readonly string[],
  topicIds: readonly string[],
  statusFilter: MatrixStatusFilter
): string[] {
  if (statusFilter === "all") return [...studentIds];

  return studentIds.filter((studentId) =>
    topicIds.some((topicId) =>
      cellMatchesStatusFilter(matrix[studentId]?.[topicId], statusFilter)
    )
  );
}

export function countCellsByStatus(
  matrix: Record<string, Record<string, number | null>>,
  studentIds: readonly string[],
  topicIds: readonly string[],
  statusFilter: MatrixStatusFilter
): number {
  let count = 0;
  for (const studentId of studentIds) {
    for (const topicId of topicIds) {
      if (cellMatchesStatusFilter(matrix[studentId]?.[topicId], statusFilter)) {
        count += 1;
      }
    }
  }
  return count;
}
