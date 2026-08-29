import { API_PREFIX, assessmentFetch } from "./client";
import type {
  AnswerRequest,
  AnswerResponse,
  AttemptRecord,
  ClientQuestionSnapshot,
  CreateCustomizableQuizRequest,
  GradeResultPayload,
  NextQuestionResponse,
  QuestionType,
  QuizResults,
  QuizSession,
  TerminateRequest,
  TriggerPostLessonRequest,
} from "../types";

export async function createCustomizableQuiz(
  body: CreateCustomizableQuizRequest
) {
  return assessmentFetch<QuizSession>(
    `${API_PREFIX}/quizzes/customizable`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function triggerPostLessonQuiz(body: TriggerPostLessonRequest) {
  return assessmentFetch<QuizSession>(`${API_PREFIX}/quizzes/post-lesson`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchNextQuestion(sessionId: string) {
  return assessmentFetch<NextQuestionResponse>(
    `${API_PREFIX}/quizzes/${encodeURIComponent(sessionId)}/next`
  );
}

export async function submitAnswer(sessionId: string, body: AnswerRequest) {
  return assessmentFetch<AnswerResponse>(
    `${API_PREFIX}/quizzes/${encodeURIComponent(sessionId)}/answer`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function fetchQuizResults(sessionId: string) {
  return assessmentFetch<QuizResults>(
    `${API_PREFIX}/quizzes/${encodeURIComponent(sessionId)}/results`
  );
}

function countAnsweredInResults(results: QuizResults): number {
  if (results.history?.length) return results.history.length;
  if (typeof results.total_answered === "number") return results.total_answered;
  if (results.items?.length) return results.items.length;
  return 0;
}

export { countAnsweredInResults };

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

/** Poll until attempt history includes the expected number of graded answers. */
export async function fetchQuizResultsWhenReady(
  sessionId: string,
  expectedCount: number,
  opts?: { maxAttempts?: number; delayMs?: number }
): Promise<QuizResults> {
  const maxAttempts = opts?.maxAttempts ?? 3;
  const delayMs = opts?.delayMs ?? 250;

  let last: QuizResults | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    last = await fetchQuizResults(sessionId);
    if (expectedCount <= 0 || countAnsweredInResults(last) >= expectedCount) {
      return last;
    }
    if (attempt < maxAttempts - 1) {
      await sleep(delayMs);
    }
  }
  return last!;
}

export type LocalSubmittedAttempt = {
  question_id: string;
  question_type: QuestionType;
  prompt: string;
  options?: Record<string, string> | string[];
  student_answer: string;
  answerResponse: AnswerResponse;
};

function gradeFromResponse(res: AnswerResponse): GradeResultPayload | undefined {
  const grade = res.grade;
  if (!grade || typeof grade !== "object") return undefined;
  return grade;
}

function mergeAttemptRecords(
  primary: AttemptRecord,
  secondary: AttemptRecord
): AttemptRecord {
  return {
    ...secondary,
    ...primary,
    distractor_tag: primary.distractor_tag ?? secondary.distractor_tag,
    distractor_label: primary.distractor_label ?? secondary.distractor_label,
    detailed_explanation:
      primary.detailed_explanation ?? secondary.detailed_explanation,
    error_category: primary.error_category ?? secondary.error_category,
    concept_explanation:
      primary.concept_explanation ?? secondary.concept_explanation,
    missed_blanks: primary.missed_blanks ?? secondary.missed_blanks,
    missing_keywords: primary.missing_keywords ?? secondary.missing_keywords,
    feedback: primary.feedback ?? secondary.feedback,
    is_correct: primary.is_correct ?? secondary.is_correct,
    accuracy_score: primary.accuracy_score ?? secondary.accuracy_score,
    student_answer: primary.student_answer ?? secondary.student_answer,
  };
}

function attemptFromLocal(local: LocalSubmittedAttempt): AttemptRecord {
  const grade = gradeFromResponse(local.answerResponse);
  const isCorrect =
    local.answerResponse.is_correct ?? grade?.is_correct;

  return {
    question_id: local.question_id,
    question_type: local.question_type,
    student_answer: local.student_answer,
    is_correct: isCorrect,
    accuracy_score:
      local.answerResponse.accuracy_score ?? grade?.accuracy_score,
    feedback: local.answerResponse.feedback ?? grade?.feedback,
    reasoning: grade?.reasoning,
    error_category: grade?.error_category,
    missing_keywords: grade?.missing_keywords,
    detailed_explanation: grade?.detailed_explanation,
    missed_blanks: grade?.missed_blanks,
    concept_explanation: grade?.concept_explanation,
    distractor_tag: grade?.distractor_tag,
    distractor_label: grade?.distractor_label,
  };
}

/** Merge two result payloads, preferring richer diagnostics per question. */
export function mergeQuizResults(
  primary: QuizResults,
  secondary: QuizResults
): QuizResults {
  const byId = new Map<string, AttemptRecord>();
  for (const item of secondary.history ?? []) {
    if (item.question_id) byId.set(item.question_id, item);
  }
  for (const item of primary.history ?? []) {
    if (!item.question_id) continue;
    const existing = byId.get(item.question_id);
    byId.set(
      item.question_id,
      existing ? mergeAttemptRecords(item, existing) : item
    );
  }

  const order: string[] = [];
  for (const item of primary.history ?? []) {
    if (item.question_id && !order.includes(item.question_id)) {
      order.push(item.question_id);
    }
  }
  for (const item of secondary.history ?? []) {
    if (item.question_id && !order.includes(item.question_id)) {
      order.push(item.question_id);
    }
  }

  const history = order
    .map((id) => byId.get(id))
    .filter((item): item is AttemptRecord => Boolean(item));

  return {
    ...secondary,
    ...primary,
    history,
    total_answered: history.length,
    correct_count:
      primary.correct_count ??
      secondary.correct_count ??
      history.filter((item) => item.is_correct).length,
  };
}

/** Ensure every locally submitted answer appears in results history. */
export function mergeLocalAttemptsIntoResults(
  results: QuizResults,
  localAttempts: LocalSubmittedAttempt[]
): QuizResults {
  if (localAttempts.length === 0) return results;

  const byId = new Map<string, AttemptRecord>();
  for (const item of results.history ?? []) {
    if (item.question_id) byId.set(item.question_id, item);
  }
  for (const local of localAttempts) {
    const fromLocal = attemptFromLocal(local);
    const existing = byId.get(local.question_id);
    byId.set(
      local.question_id,
      existing ? mergeAttemptRecords(existing, fromLocal) : fromLocal
    );
  }

  const history = localAttempts
    .map((local) => byId.get(local.question_id))
    .filter((item): item is AttemptRecord => Boolean(item));

  for (const item of byId.values()) {
    if (!history.some((h) => h.question_id === item.question_id)) {
      history.push(item);
    }
  }

  return {
    ...results,
    history,
    total_answered: history.length,
  };
}

export function localAttemptsToSnapshots(
  localAttempts: LocalSubmittedAttempt[]
): Record<string, ClientQuestionSnapshot> {
  const out: Record<string, ClientQuestionSnapshot> = {};
  for (const local of localAttempts) {
    out[local.question_id] = {
      prompt: local.prompt,
      question_type: local.question_type,
      options: local.options,
    };
  }
  return out;
}

/** Merge a just-submitted answer into results when polling timed out early. */
export function mergePendingAnswerIntoResults(
  results: QuizResults,
  pending: LocalSubmittedAttempt
): QuizResults {
  return mergeLocalAttemptsIntoResults(results, [pending]);
}

export async function terminateQuizSession(
  sessionId: string,
  body: TerminateRequest
) {
  return assessmentFetch<unknown>(
    `${API_PREFIX}/quizzes/${encodeURIComponent(sessionId)}/terminate`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

/**
 * MultiBlank answers are joined with " | " for the API string field.
 * Prefer blank order matching prompt.paragraph placeholders.
 */
export function serializeStudentAnswer(
  value: string | string[] | null | undefined
): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map((v) => v.trim()).join(" | ");
  return value;
}
