import { API_PREFIX, assessmentFetch, toQuery } from "./client";
import { normalizeTeacherQuestion } from "./normalizeQuestion";
import type {
  CreateTeacherQuestionRequest,
  GenerateQuestionsRequest,
  GenerateQuestionsResult,
  MostMissedQuestionInsight,
  RejectQuestionRequest,
  TeacherQuestion,
  TeacherQuestionRaw,
  TeacherQuestionsQuery,
  TeacherTopic,
} from "../types";

function asQuestionList(
  data:
    | TeacherQuestionRaw[]
    | { questions?: TeacherQuestionRaw[]; created?: number }
    | TeacherQuestionRaw
): TeacherQuestionRaw[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "questions" in data) {
    return Array.isArray(data.questions) ? data.questions : [];
  }
  if (data && typeof data === "object" && "id" in data) {
    return [data as TeacherQuestionRaw];
  }
  return [];
}

function normalizeList(
  data:
    | TeacherQuestionRaw[]
    | { questions?: TeacherQuestionRaw[]; created?: number }
    | TeacherQuestionRaw
): TeacherQuestion[] {
  return asQuestionList(data).map(normalizeTeacherQuestion);
}

function normalizeTopic(raw: Record<string, unknown>): TeacherTopic {
  const topicId = String(raw.topic_id || "");
  const skill = typeof raw.skill === "string" ? raw.skill : undefined;
  const chapterTitle =
    typeof raw.chapter_title === "string" ? raw.chapter_title : undefined;
  return {
    topic_id: topicId,
    name: skill || chapterTitle || topicId,
    grade: typeof raw.grade === "number" ? raw.grade : undefined,
    chapter_title: chapterTitle,
    skill,
    chapter_number:
      typeof raw.chapter_number === "number" ? raw.chapter_number : null,
    domain: typeof raw.domain === "string" ? raw.domain : undefined,
    concept_code:
      typeof raw.concept_code === "string" ? raw.concept_code : undefined,
  };
}

export async function fetchTeacherTopics(grade: number) {
  const data = await assessmentFetch<
    TeacherTopic[] | { topics: Record<string, unknown>[] }
  >(`${API_PREFIX}/teacher/topics${toQuery({ grade })}`);
  if (Array.isArray(data)) {
    return data.map((t) =>
      normalizeTopic(t as unknown as Record<string, unknown>)
    );
  }
  return (data.topics ?? []).map((t) => normalizeTopic(t));
}

export async function generateTeacherQuestions(
  body: GenerateQuestionsRequest
): Promise<GenerateQuestionsResult> {
  const data = await assessmentFetch<{
    created?: number;
    questions?: TeacherQuestionRaw[];
  }>(`${API_PREFIX}/teacher/generate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const questions = normalizeList(data);
  const created =
    typeof data.created === "number" ? data.created : questions.length;
  return { created, questions };
}

export async function fetchTeacherQuestions(query: TeacherQuestionsQuery = {}) {
  const data = await assessmentFetch<
    TeacherQuestionRaw[] | { questions: TeacherQuestionRaw[] }
  >(
    `${API_PREFIX}/teacher/questions${toQuery({
      status: query.status,
      grade: query.grade,
      class_code: query.class_code,
      dok_level: query.dok_level,
      question_type: query.question_type,
      topic_id: query.topic_id,
      limit: query.limit ?? 100,
    })}`
  );
  return normalizeList(data);
}

/**
 * Backend defaults to status=approved when status is omitted, so "all"
 * must fetch each status bucket explicitly.
 */
export async function fetchTeacherQuestionsAllStatuses(
  query: Omit<TeacherQuestionsQuery, "status"> = {}
) {
  const statuses = ["pending", "approved", "rejected"] as const;
  const batches = await Promise.all(
    statuses.map((status) =>
      fetchTeacherQuestions({ ...query, status, limit: query.limit ?? 100 })
    )
  );
  const byId = new Map<string, TeacherQuestion>();
  for (const batch of batches) {
    for (const q of batch) byId.set(q.id, q);
  }
  return Array.from(byId.values());
}

export async function approveTeacherQuestion(questionId: string) {
  const data = await assessmentFetch<TeacherQuestionRaw>(
    `${API_PREFIX}/teacher/questions/${encodeURIComponent(questionId)}/approve`,
    { method: "POST" }
  );
  return normalizeTeacherQuestion(data);
}

export async function rejectTeacherQuestion(
  questionId: string,
  body: RejectQuestionRequest
) {
  const data = await assessmentFetch<TeacherQuestionRaw>(
    `${API_PREFIX}/teacher/questions/${encodeURIComponent(questionId)}/reject`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return normalizeTeacherQuestion(data);
}

export async function createTeacherQuestion(
  body: CreateTeacherQuestionRequest
) {
  const data = await assessmentFetch<TeacherQuestionRaw>(
    `${API_PREFIX}/teacher/questions`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
  return normalizeTeacherQuestion(data);
}

/**
 * TODO(IAE): Add `POST /api/v1/assessment-engine/teacher/questions/refine`
 * that accepts a draft payload and returns a grammatically improved version.
 * Until then this helper is a no-op stub for the UI "AI Refine" button.
 */
export async function refineTeacherQuestionDraft(_body: {
  question_type: string;
  payload: unknown;
}): Promise<{ payload: unknown; notes?: string }> {
  void _body;
  throw new Error(
    "AI Refine is not available yet — backend endpoint not shipped."
  );
}

/**
 * TODO(IAE): Add `GET /api/v1/assessment-engine/teacher/insights/most-missed`
 * aggregating `question_engine.analytics_events` where is_correct=false.
 * Suggested query params: grade, class_code, limit.
 */
export async function fetchMostMissedQuestions(_query?: {
  grade?: number;
  class_code?: string;
  limit?: number;
}): Promise<MostMissedQuestionInsight[]> {
  void _query;
  // No public insights route in IAE yet — return empty for the UI panel.
  return [];
}
