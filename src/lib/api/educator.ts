import { API_BASE_URL } from "@/lib/api/config";
import type {
  AtRiskStudentsRequest,
  AtRiskStudentsResponse,
  ClassSummaryResponse,
  ClassroomDashboardResponse,
  ClassroomSliceResponse,
  MasteryMatrixRequest,
  MasteryMatrixResponse,
  StudentProfileResponse,
} from "@/types/educator";
import { buildStudentCatalog, normalizeStudentCatalog } from "@/lib/educator/students";

const DEFAULT_TIMEOUT_MS = 180_000;

const MASTERY_MATRIX_PATH = "/api/v1/mastery/matrix";
const AT_RISK_PATH = "/api/v1/analytics/at-risk-students";
const STUDENT_PROFILE_PATH = "/api/v1/analytics/student-profile";
const CLASS_SUMMARY_PATH = "/api/v1/analytics/class-summary";
const CLASSROOM_DASHBOARD_PATH = "/api/v1/analytics/classroom-dashboard";
const CLASSROOM_SLICE_PATH = "/api/educator/classroom-slice";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function formatApiError(payload: unknown, status: number): string {
  const record = asRecord(payload);
  const detail = record.detail;

  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        const entry = asRecord(item);
        return pickString(entry.msg, entry.message);
      })
      .filter((message): message is string => Boolean(message));
    if (messages.length > 0) return messages.join(" ");
  }

  return (
    pickString(record.error, record.message) ??
    `Analytics service returned ${status}. Please try again.`
  );
}

async function postJson<T>(
  path: string,
  body: unknown,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(formatApiError(payload, response.status));
    }

    return payload as T;
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === "AbortError") {
      throw new Error("The analytics request timed out. Please try again.");
    }
    throw caught;
  } finally {
    window.clearTimeout(timer);
  }
}

async function getAnalyticsJson<T>(
  path: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      signal: controller.signal,
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(formatApiError(payload, response.status));
    }

    return payload as T;
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === "AbortError") {
      throw new Error("The analytics request timed out.");
    }
    throw caught;
  } finally {
    window.clearTimeout(timer);
  }
}

async function getAppJson<T>(
  path: string,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path, {
      method: "GET",
      signal: controller.signal,
    });

    const payload: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(formatApiError(payload, response.status));
    }

    return payload as T;
  } catch (caught) {
    if (caught instanceof DOMException && caught.name === "AbortError") {
      throw new Error("The classroom slice request timed out.");
    }
    throw caught;
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchClassroomSlice(
  classCode: string
): Promise<ClassroomSliceResponse> {
  const code = classCode.trim().toUpperCase();
  const payload = await getAppJson<ClassroomSliceResponse>(
    `${CLASSROOM_SLICE_PATH}?class_code=${encodeURIComponent(code)}`
  );
  if (payload.success === false) {
    throw new Error(payload.error ?? "Could not load classroom slice.");
  }

  const studentIds = payload.studentIds ?? [];
  return {
    ...payload,
    studentIds,
    students: normalizeStudentCatalog(studentIds, payload.students),
  };
}

export async function fetchMasteryMatrix(
  request: MasteryMatrixRequest
): Promise<MasteryMatrixResponse> {
  const body = request.class_code
    ? { class_code: request.class_code.trim().toUpperCase() }
    : {
        student_ids: request.student_ids ?? [],
        topic_ids: request.topic_ids ?? [],
      };

  const payload = await postJson<MasteryMatrixResponse>(
    MASTERY_MATRIX_PATH,
    body
  );
  if (payload.success === false) {
    throw new Error(payload.error ?? "Mastery matrix request failed.");
  }
  return payload;
}

export async function fetchAtRiskStudents(
  request: AtRiskStudentsRequest = {}
): Promise<AtRiskStudentsResponse> {
  const body = request.class_code
    ? { class_code: request.class_code.trim().toUpperCase() }
    : {
        student_ids: request.student_ids,
        topic_ids: request.topic_ids,
      };

  const payload = await postJson<AtRiskStudentsResponse>(AT_RISK_PATH, body);
  if (payload.success === false) {
    throw new Error(payload.error ?? "At-risk analytics request failed.");
  }
  return payload;
}

export async function fetchStudentProfile(
  userId: string,
  classCode?: string
): Promise<StudentProfileResponse> {
  const query = classCode
    ? `?class_code=${encodeURIComponent(classCode.trim().toUpperCase())}`
    : "";
  const payload = await getAnalyticsJson<StudentProfileResponse>(
    `${STUDENT_PROFILE_PATH}/${encodeURIComponent(userId)}${query}`
  );
  if (payload.success === false) {
    throw new Error(payload.error ?? "Student profile request failed.");
  }
  return payload;
}

export async function fetchClassSummary(
  classCode: string
): Promise<ClassSummaryResponse> {
  const code = classCode.trim().toUpperCase();
  const payload = await getAnalyticsJson<ClassSummaryResponse>(
    `${CLASS_SUMMARY_PATH}?class_code=${encodeURIComponent(code)}`
  );
  if (payload.success === false) {
    throw new Error(payload.error ?? "Class summary request failed.");
  }
  return payload;
}

/** One-pass matrix + at-risk + class-summary for Classroom Insights. */
export async function fetchClassroomDashboard(
  classCode: string
): Promise<ClassroomDashboardResponse> {
  const code = classCode.trim().toUpperCase();
  const payload = await getAnalyticsJson<ClassroomDashboardResponse>(
    `${CLASSROOM_DASHBOARD_PATH}?class_code=${encodeURIComponent(code)}`
  );
  if (payload.success === false) {
    throw new Error(payload.error ?? "Classroom dashboard request failed.");
  }
  return payload;
}
