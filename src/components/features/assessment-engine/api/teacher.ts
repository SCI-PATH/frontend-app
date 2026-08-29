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
  TeacherQuestionListResult,
  TeacherQuestionsQuery,
  TeacherTopic,
} from "../types";

const QUESTION_BANK_GRADES = [6, 7, 8, 9] as const;

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

function mergeQuestionListResults(
  results: TeacherQuestionListResult[]
): TeacherQuestionListResult {
  const seen = new Set<string>();
  const questions: TeacherQuestion[] = [];
  for (const result of results) {
    for (const question of result.questions) {
      if (seen.has(question.id)) continue;
      seen.add(question.id);
      questions.push(question);
    }
  }
  const total = results.reduce((sum, result) => sum + result.total, 0);
  return { questions, total };
}

export async function fetchTeacherTopicsAllGrades() {
  const lists = await Promise.all(
    QUESTION_BANK_GRADES.map((grade) => fetchTeacherTopics(grade))
  );
  const seen = new Set<string>();
  const topics: TeacherTopic[] = [];
  for (const list of lists) {
    for (const topic of list) {
      if (seen.has(topic.topic_id)) continue;
      seen.add(topic.topic_id);
      topics.push(topic);
    }
  }
  return topics;
}

export async function fetchTeacherQuestionsAllGrades(
  query: Omit<TeacherQuestionsQuery, "grade"> = {}
): Promise<TeacherQuestionListResult> {
  const results = await Promise.all(
    QUESTION_BANK_GRADES.map((grade) =>
      fetchTeacherQuestions({ ...query, grade })
    )
  );
  return mergeQuestionListResults(results);
}

export async function fetchTeacherQuestionsAllStatusesAndGrades(
  query: Omit<TeacherQuestionsQuery, "status" | "all_statuses" | "grade"> = {}
): Promise<TeacherQuestionListResult> {
  const results = await Promise.all(
    QUESTION_BANK_GRADES.map((grade) =>
      fetchTeacherQuestionsAllStatuses({ ...query, grade })
    )
  );
  return mergeQuestionListResults(results);
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

export async function fetchTeacherQuestions(
  query: TeacherQuestionsQuery = {}
): Promise<TeacherQuestionListResult> {
  const data = await assessmentFetch<
    TeacherQuestionRaw[] | { questions?: TeacherQuestionRaw[]; total?: number }
  >(
    `${API_PREFIX}/teacher/questions${toQuery({
      status: query.all_statuses ? undefined : query.status,
      grade: query.grade,
      dok_level: query.dok_level,
      question_type: query.question_type,
      topic_id: query.topic_id,
      topic_id_prefix: query.topic_id_prefix,
      origin: query.origin,
      q: query.q,
      offset: query.offset ?? 0,
      limit: query.limit ?? 12,
      all_statuses: query.all_statuses === true,
    })}`
  );
  const questions = normalizeList(data);
  const total =
    !Array.isArray(data) && typeof data.total === "number"
      ? data.total
      : questions.length;
  return { questions, total };
}

/**
 * Committed IAE defaults to status=approved when status is omitted, and
 * ignores unknown query params such as `all_statuses`. Fetch each bucket
 * so "all" still works without a backend restart.
 */
export async function fetchTeacherQuestionsAllStatuses(
  query: Omit<TeacherQuestionsQuery, "status" | "all_statuses"> = {}
): Promise<TeacherQuestionListResult> {
  const statuses = ["pending", "approved", "rejected"] as const;
  const results = await Promise.all(
    statuses.map((status) =>
      fetchTeacherQuestions({
        ...query,
        status,
        all_statuses: false,
      })
    )
  );
  const seen = new Set<string>();
  const questions: TeacherQuestion[] = [];
  for (const result of results) {
    for (const question of result.questions) {
      if (seen.has(question.id)) continue;
      seen.add(question.id);
      questions.push(question);
    }
  }
  const total = results.reduce((sum, result) => sum + result.total, 0);
  return { questions, total };
}

export async function holdTeacherQuestion(questionId: string) {
  const data = await assessmentFetch<TeacherQuestionRaw>(
    `${API_PREFIX}/teacher/questions/${encodeURIComponent(questionId)}/pending`,
    { method: "POST" }
  );
  return normalizeTeacherQuestion(data);
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
 * Rank bank items by incorrect analytics_events.
 * GET /teacher/insights/most-missed
 */
export async function fetchMostMissedQuestions(query?: {
  grade?: number;
  class_code?: string;
  limit?: number;
}): Promise<MostMissedQuestionInsight[]> {
  try {
    const data = await assessmentFetch<
      MostMissedQuestionInsight[] | { questions?: MostMissedQuestionInsight[] }
    >(
      `${API_PREFIX}/teacher/insights/most-missed${toQuery({
        grade: query?.grade,
        class_code: query?.class_code,
        limit: query?.limit ?? 20,
      })}`
    );
    if (Array.isArray(data)) return data;
    return data.questions ?? [];
  } catch {
    return [];
  }
}
