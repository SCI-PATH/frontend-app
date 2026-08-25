/**
 * Score / correctness helpers for quiz AttemptRecords.
 * Matches IAE grading: MCQ & TrueFalse are binary; ShortAnswer & MultiBlank
 * use accuracy_score with pass threshold 0.8.
 */

import type { AttemptRecord, QuizResults, SessionDetail } from "../types";

/** Same pass bar as intelligent-assessment-engine grading._PASS_THRESHOLD */
export const PASS_THRESHOLD = 0.8;

export type AttemptStats = {
  answered: number;
  correctCount: number;
  missedCount: number;
  /** 0–100, mean of per-attempt accuracy (works for all four types). */
  scorePct: number;
};

function asRecord(value: unknown): AttemptRecord | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const questionId = obj.question_id ?? obj.questionId;
  if (typeof questionId !== "string" || !questionId) return null;
  return value as AttemptRecord;
}

/** Normalize loose API values into a 0–1 accuracy. */
export function attemptAccuracy(attempt: AttemptRecord): number {
  const raw = attempt.accuracy_score;
  if (typeof raw === "number" && Number.isFinite(raw)) {
    if (raw < 0) return 0;
    // Some payloads may send 0–100 instead of 0–1
    if (raw > 1 && raw <= 100) return raw / 100;
    if (raw > 100) return 1;
    return raw;
  }

  const passed = coercePassedFlag(attempt.is_correct);
  if (passed === true) return 1;
  if (passed === false) return 0;
  return 0;
}

/** Coerce is_correct from bool | 0/1 | "true"/"false". */
export function coercePassedFlag(value: unknown): boolean | null {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
  }
  return null;
}

/**
 * Whether an attempt counts as correct for the Correct card.
 * Prefer explicit is_correct; fall back to accuracy_score >= 0.8
 * (ShortAnswer / MultiBlank).
 */
export function attemptIsCorrect(attempt: AttemptRecord): boolean {
  const flag = coercePassedFlag(attempt.is_correct);
  if (flag !== null) return flag;
  return attemptAccuracy(attempt) >= PASS_THRESHOLD;
}

/** Incorrect or partial — shown in the review list. */
export function attemptNeedsReview(attempt: AttemptRecord): boolean {
  return !attemptIsCorrect(attempt);
}

export function computeAttemptStats(history: AttemptRecord[]): AttemptStats {
  const answered = history.length;
  if (answered === 0) {
    return { answered: 0, correctCount: 0, missedCount: 0, scorePct: 0 };
  }

  let correctCount = 0;
  let accuracySum = 0;
  for (const attempt of history) {
    if (attemptIsCorrect(attempt)) correctCount += 1;
    accuracySum += attemptAccuracy(attempt);
  }

  return {
    answered,
    correctCount,
    missedCount: answered - correctCount,
    // Mean accuracy × 100 — fair for binary (MCQ/TF) and partial (SA/MultiBlank)
    scorePct: Math.round((accuracySum / answered) * 100),
  };
}

/**
 * Collect the attempt trail from results and/or session detail,
 * de-duplicated by question_id (first wins, preferring results.history).
 */
export function collectAttemptHistory(
  results: QuizResults | null | undefined,
  detail: SessionDetail | null | undefined
): AttemptRecord[] {
  const byId = new Map<string, AttemptRecord>();

  const push = (raw: unknown) => {
    const attempt = asRecord(raw);
    if (!attempt) return;
    if (!byId.has(attempt.question_id)) {
      byId.set(attempt.question_id, attempt);
    }
  };

  for (const item of results?.history ?? []) push(item);

  const sessionHistory = detail?.session?.history;
  if (Array.isArray(sessionHistory)) {
    for (const item of sessionHistory) push(item);
  }

  const detailItems = (detail?.items ?? detail?.answers ?? []) as unknown[];
  for (const item of detailItems) {
    if (item && typeof item === "object" && "attempt" in item) {
      push((item as { attempt?: unknown }).attempt);
      continue;
    }
    const flat = item as Record<string, unknown> | null;
    if (flat && typeof flat.question_id === "string") {
      push({
        question_id: flat.question_id,
        question_type: flat.question_type as AttemptRecord["question_type"],
        student_answer:
          typeof flat.student_answer === "string"
            ? flat.student_answer
            : undefined,
        is_correct: flat.is_correct as boolean | undefined,
        accuracy_score:
          typeof flat.accuracy_score === "number"
            ? flat.accuracy_score
            : undefined,
      });
    }
  }

  // Preserve results order when available; otherwise insertion order
  if (results?.history?.length) {
    const ordered: AttemptRecord[] = [];
    const seen = new Set<string>();
    for (const item of results.history) {
      const id = item?.question_id;
      if (!id || seen.has(id)) continue;
      const resolved = byId.get(id);
      if (resolved) {
        ordered.push(resolved);
        seen.add(id);
      }
    }
    for (const [id, attempt] of byId) {
      if (!seen.has(id)) ordered.push(attempt);
    }
    return ordered;
  }

  return Array.from(byId.values());
}
