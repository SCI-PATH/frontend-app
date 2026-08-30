import type { MasteryCategory } from "@/types/educator";
import { EDUCATOR_AT_RISK } from "@/lib/educator/theme";

/** Strict BKT mastery boundaries (probability scale). */
export const BKT_MASTERED = 0.8;
export const BKT_LEARNING = 0.5;

export function masteryCategoryFromProbability(
  probability: number | null | undefined
): MasteryCategory | null {
  if (probability === null || probability === undefined || Number.isNaN(probability)) {
    return null;
  }
  if (probability >= BKT_MASTERED) return "mastered";
  if (probability >= BKT_LEARNING) return "learning";
  return "at_risk";
}

export function masteryPercent(probability: number | null | undefined): number | null {
  if (probability === null || probability === undefined || Number.isNaN(probability)) {
    return null;
  }
  return Math.round(probability * 100);
}

export const UNATTEMPTED_CELL_CLASS =
  "bg-slate-100 text-slate-500 hover:bg-slate-100";

export function getCellAttemptCount(
  attemptMatrix: Record<string, Record<string, number>> | undefined,
  studentId: string,
  topicId: string
): number {
  return attemptMatrix?.[studentId]?.[topicId] ?? 0;
}

/** True when P(L) is still at the skill prior with no recorded quiz attempts. */
export function isUnattemptedBaselineCell(
  probability: number | null | undefined,
  pL0: number,
  attempts: number
): boolean {
  if (
    probability === null ||
    probability === undefined ||
    Number.isNaN(probability) ||
    attempts > 0
  ) {
    return false;
  }
  return Math.abs(probability - pL0) < 0.015;
}

export interface MasteryCellStyleOptions {
  pL0?: number;
  attempts?: number;
}

export function masteryCellClassName(
  probability: number | null | undefined,
  options?: MasteryCellStyleOptions
): string {
  const pL0 = options?.pL0 ?? 0.25;
  const attempts = options?.attempts ?? 0;

  if (isUnattemptedBaselineCell(probability, pL0, attempts)) {
    return UNATTEMPTED_CELL_CLASS;
  }

  const category = masteryCategoryFromProbability(probability);
  switch (category) {
    case "mastered":
      return "bg-brand-secondary text-brand-text";
    case "learning":
      return "bg-brand-primary text-white";
    case "at_risk":
      return EDUCATOR_AT_RISK.cell;
    default:
      return "bg-brand-surface text-brand-text/60";
  }
}

export interface MatrixBandCountOptions {
  /** When set, prior-only cells (no quiz attempts) are counted as not started. */
  attemptMatrix?: Record<string, Record<string, number>>;
  priorByTopicId?: Record<string, number>;
  defaultPrior?: number;
}

export interface StudentTopicBandCountOptions {
  attemptsByTopic?: Record<string, number>;
  priorByTopicId?: Record<string, number>;
  defaultPrior?: number;
}

function priorForTopic(
  topicId: string,
  priorByTopicId: Record<string, number> | undefined,
  defaultPrior: number
): number {
  return priorByTopicId?.[topicId] ?? defaultPrior;
}

function tallyBand(
  probability: number | null | undefined,
  pL0: number,
  attempts: number,
  splitUnattempted: boolean,
  buckets: { mastered: number; learning: number; atRisk: number; notStarted: number }
) {
  if (splitUnattempted && isUnattemptedBaselineCell(probability, pL0, attempts)) {
    buckets.notStarted += 1;
    return;
  }
  const category = masteryCategoryFromProbability(probability);
  if (category === "mastered") buckets.mastered += 1;
  else if (category === "learning") buckets.learning += 1;
  else if (category === "at_risk") buckets.atRisk += 1;
}

export function countMatrixBands(
  matrix: Record<string, Record<string, number | null>>,
  studentIds: readonly string[],
  topicIds: readonly string[],
  options?: MatrixBandCountOptions
) {
  const splitUnattempted = options?.attemptMatrix !== undefined;
  const defaultPrior = options?.defaultPrior ?? 0.25;
  const buckets = { mastered: 0, learning: 0, atRisk: 0, notStarted: 0 };

  for (const studentId of studentIds) {
    for (const topicId of topicIds) {
      tallyBand(
        matrix[studentId]?.[topicId],
        priorForTopic(topicId, options?.priorByTopicId, defaultPrior),
        getCellAttemptCount(options?.attemptMatrix, studentId, topicId),
        splitUnattempted,
        buckets
      );
    }
  }

  return {
    ...buckets,
    total: studentIds.length * topicIds.length,
  };
}

export function countStudentTopicBands(
  row: Record<string, number | null> | undefined,
  topicIds: readonly string[],
  options?: StudentTopicBandCountOptions
) {
  const splitUnattempted = options?.attemptsByTopic !== undefined;
  const defaultPrior = options?.defaultPrior ?? 0.25;
  const buckets = { mastered: 0, learning: 0, atRisk: 0, notStarted: 0 };

  for (const topicId of topicIds) {
    tallyBand(
      row?.[topicId],
      priorForTopic(topicId, options?.priorByTopicId, defaultPrior),
      options?.attemptsByTopic?.[topicId] ?? 0,
      splitUnattempted,
      buckets
    );
  }

  return buckets;
}
