import { API_PREFIX, assessmentFetch, toQuery } from "./client";
import { asPromptString, asQuestionType, normalizeQuestion } from "./normalizeQuestion";
import type {
  AmplitudeChaptersResponse,
  AmplitudeEvaluateRequest,
  AmplitudeEvaluateResponse,
  AmplitudeQuizQuestion,
  AmplitudeQuizQuestionRaw,
  AmplitudeQuizResponse,
  AmplitudeQuizResponseRaw,
  AmplitudeSurveyRequest,
  InitialCategoryResponse,
} from "../types";

function normalizeAmplitudeQuestion(
  raw: AmplitudeQuizQuestionRaw
): AmplitudeQuizQuestion {
  const q = normalizeQuestion(raw);
  return {
    question_id: q.question_id,
    prompt: q.prompt,
    options: q.options,
    paragraph: q.paragraph,
    question_type: q.question_type,
    dok_level: q.dok_level,
  };
}

export async function fetchAmplitudeChapters(grade: number) {
  return assessmentFetch<AmplitudeChaptersResponse>(
    `${API_PREFIX}/amplitude/chapters${toQuery({ grade })}`
  );
}

export async function submitAmplitudeSurvey(body: AmplitudeSurveyRequest) {
  return assessmentFetch<unknown>(`${API_PREFIX}/amplitude/survey`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchAmplitudeQuiz(grade: number) {
  const data = await assessmentFetch<AmplitudeQuizResponseRaw>(
    `${API_PREFIX}/amplitude/quiz${toQuery({ grade })}`
  );
  const questions = (data.questions ?? [])
    .map(normalizeAmplitudeQuestion)
    .filter(
      (q) =>
        q.question_type === "MCQ" ||
        q.question_type === "TrueFalse" ||
        !q.question_type
    )
    .map((q) => ({
      ...q,
      question_type:
        q.question_type === "TrueFalse"
          ? ("TrueFalse" as const)
          : ("MCQ" as const),
    }));

  return {
    grade: data.grade,
    count: data.count,
    questions,
  } satisfies AmplitudeQuizResponse;
}

export async function evaluateAmplitude(body: AmplitudeEvaluateRequest) {
  return assessmentFetch<AmplitudeEvaluateResponse>(
    `${API_PREFIX}/amplitude/evaluate`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export async function fetchInitialCategory(studentId: string) {
  return assessmentFetch<InitialCategoryResponse>(
    `${API_PREFIX}/students/${encodeURIComponent(studentId)}/initial-category`
  );
}

export { asPromptString, asQuestionType };
