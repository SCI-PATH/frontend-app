import { API_PREFIX, assessmentFetch, toQuery } from "./client";
import { normalizeTeacherQuestion } from "./normalizeQuestion";
import type {
  CreateTeacherQuestionRequest,
  GenerateQuestionsRequest,
  RejectQuestionRequest,
  TeacherQuestion,
  TeacherQuestionRaw,
  TeacherQuestionsQuery,
  TeacherTopic,
} from "../types";

function asQuestionList(
  data: TeacherQuestionRaw[] | { questions: TeacherQuestionRaw[] } | TeacherQuestionRaw
): TeacherQuestionRaw[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "questions" in data) {
    return data.questions ?? [];
  }
  if (data && typeof data === "object" && "id" in data) {
    return [data as TeacherQuestionRaw];
  }
  return [];
}

function normalizeList(
  data: TeacherQuestionRaw[] | { questions: TeacherQuestionRaw[] } | TeacherQuestionRaw
): TeacherQuestion[] {
  return asQuestionList(data).map(normalizeTeacherQuestion);
}

export async function fetchTeacherTopics(grade: number) {
  const data = await assessmentFetch<
    TeacherTopic[] | { topics: TeacherTopic[] }
  >(`${API_PREFIX}/teacher/topics${toQuery({ grade })}`);
  return Array.isArray(data) ? data : data.topics ?? [];
}

export async function generateTeacherQuestions(body: GenerateQuestionsRequest) {
  const data = await assessmentFetch<
    TeacherQuestionRaw[] | { questions: TeacherQuestionRaw[] }
  >(`${API_PREFIX}/teacher/generate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return normalizeList(data);
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
    })}`
  );
  return normalizeList(data);
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
