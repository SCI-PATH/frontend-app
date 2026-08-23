import { API_PREFIX, assessmentFetch, getAssessmentApiBase, toQuery } from "./client";
import { asPromptString, asQuestionType, normalizeQuestion } from "./normalizeQuestion";
import type {
  AmplitudeCategory,
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

const PLACEMENT_CATEGORIES = new Set<AmplitudeCategory>([
  "BASIC",
  "INTERMEDIATE",
  "ADVANCED",
]);

export function resolveInitialCategory(
  data: InitialCategoryResponse
): AmplitudeCategory | null {
  const raw =
    data.initial_category ?? data.placement_category ?? data.category ?? null;
  return raw && PLACEMENT_CATEGORIES.has(raw) ? raw : null;
}

export type PlacementStatus = {
  completed: boolean;
  category: AmplitudeCategory | null;
};

/** IAE expects completed_chapters_count (int), not completed_chapter_ids. */
function toAmplitudeSurveyPayload(body: AmplitudeSurveyRequest) {
  return {
    user_id: body.user_id,
    grade: body.grade,
    completed_chapters_count:
      body.completed_chapters_count ??
      body.completed_chapter_ids?.length ??
      0,
    past_grade_marks_range: body.past_grade_marks_range,
    study_hours_per_week: body.study_hours_per_week,
    self_confidence: body.self_confidence,
  };
}

/**
 * Returns whether the student finished Amplitude placement.
 * 404 or null category → not completed (fail-open for home card).
 */
export async function fetchPlacementStatus(
  studentId: string
): Promise<PlacementStatus> {
  if (!studentId.trim()) {
    return { completed: false, category: null };
  }

  const url = `${getAssessmentApiBase()}${API_PREFIX}/students/${encodeURIComponent(studentId)}/initial-category`;

  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    return { completed: false, category: null };
  }

  if (response.status === 404) {
    return { completed: false, category: null };
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    return { completed: false, category: null };
  }

  const category = resolveInitialCategory(data as InitialCategoryResponse);
  return { completed: category != null, category };
}

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
    body: JSON.stringify(toAmplitudeSurveyPayload(body)),
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
  const { answers, ...survey } = body;
  return assessmentFetch<AmplitudeEvaluateResponse>(
    `${API_PREFIX}/amplitude/evaluate`,
    {
      method: "POST",
      body: JSON.stringify({
        ...toAmplitudeSurveyPayload(survey),
        answers,
      }),
    }
  );
}

export async function fetchInitialCategory(studentId: string) {
  return assessmentFetch<InitialCategoryResponse>(
    `${API_PREFIX}/students/${encodeURIComponent(studentId)}/initial-category`
  );
}

export { asPromptString, asQuestionType };
