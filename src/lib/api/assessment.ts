/**
 * Intelligent Assessment Engine (Component 2) client.
 * Browser calls same-origin `/assessment-api/*` (Next rewrite → IAE).
 *
 * Local default: IAE on :8004 (UM :8001, gaming :8002, analytics :8003).
 * Override with ASSESSMENT_API_PROXY_TARGET / NEXT_PUBLIC_ASSESSMENT_API_BASE.
 */

export type LearnerKnowledgeLevel = "basic" | "intermediate" | "advanced";

type AmplitudeCategoryResponse = {
  student_id: string;
  initial_category?: string | null;
  initial_category_score?: number | null;
  placement_category?: string | null;
};

const assessmentBase =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ASSESSMENT_API_BASE
    ? process.env.NEXT_PUBLIC_ASSESSMENT_API_BASE
    : "/assessment-api"
  ).replace(/\/$/, "");

/** Map IAE BASIC|INTERMEDIATE|ADVANCED (and legacy labels) → LPE profile keys. */
export function normalizeAssessmentCategory(
  raw: string | null | undefined
): LearnerKnowledgeLevel | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (v === "basic" || v === "weak" || v === "beginner" || v === "low") {
    return "basic";
  }
  if (v === "advanced" || v === "strong" || v === "smart" || v === "high") {
    return "advanced";
  }
  if (
    v === "intermediate" ||
    v === "average" ||
    v === "typical" ||
    v === "medium"
  ) {
    return "intermediate";
  }
  return null;
}

async function assessmentFetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${assessmentBase}${path}`, {
    headers: { Accept: "application/json" },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = (payload as { detail?: unknown })?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : response.status === 404
          ? "No aptitude result found yet."
          : "Assessment service could not complete this request.";
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return payload as T;
}

/**
 * Read Amplitude initial category from IAE.
 * `GET /api/v1/assessment-engine/students/{student_id}/initial-category`
 */
export async function getStudentInitialCategory(studentId: string): Promise<{
  studentId: string;
  category: LearnerKnowledgeLevel | null;
  score: number | null;
  raw: AmplitudeCategoryResponse;
}> {
  const raw = await assessmentFetchJson<AmplitudeCategoryResponse>(
    `/api/v1/assessment-engine/students/${encodeURIComponent(studentId)}/initial-category`
  );
  const category = normalizeAssessmentCategory(
    // Prefer placement when present (may be refreshed after post-lesson / game quizzes).
    raw.placement_category || raw.initial_category
  );
  return {
    studentId: raw.student_id || studentId,
    category,
    score:
      typeof raw.initial_category_score === "number"
        ? raw.initial_category_score
        : null,
    raw,
  };
}
