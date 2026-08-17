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

export function masteryCellClassName(
  probability: number | null | undefined
): string {
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

export function countMatrixBands(
  matrix: Record<string, Record<string, number | null>>,
  studentIds: readonly string[],
  topicIds: readonly string[]
) {
  let mastered = 0;
  let learning = 0;
  let atRisk = 0;

  for (const studentId of studentIds) {
    for (const topicId of topicIds) {
      const value = matrix[studentId]?.[topicId];
      const category = masteryCategoryFromProbability(value ?? null);
      if (category === "mastered") mastered += 1;
      else if (category === "learning") learning += 1;
      else if (category === "at_risk") atRisk += 1;
    }
  }

  return {
    mastered,
    learning,
    atRisk,
    total: studentIds.length * topicIds.length,
  };
}

export function countStudentTopicBands(
  row: Record<string, number | null> | undefined,
  topicIds: readonly string[]
) {
  let mastered = 0;
  let learning = 0;
  let atRisk = 0;

  for (const topicId of topicIds) {
    const category = masteryCategoryFromProbability(row?.[topicId] ?? null);
    if (category === "mastered") mastered += 1;
    else if (category === "learning") learning += 1;
    else if (category === "at_risk") atRisk += 1;
  }

  return { mastered, learning, atRisk };
}
