import { API_PREFIX, assessmentFetch } from "./client";
import type {
  AnswerRequest,
  AnswerResponse,
  CreateCustomizableQuizRequest,
  NextQuestionResponse,
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
