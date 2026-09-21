import { AssessmentApiError } from "../types";

/**
 * Component 2 (IAE) HTTP client.
 * Browser default: same-origin `/assessment-api` (Next rewrite → IAE :8004).
 * Do NOT call Component 4 from the browser — Component 2 owns those after grading.
 */
const DEFAULT_BASE = "/assessment-api";

/** IAE routes live under /api/v1/assessment-engine. */
export const API_PREFIX = "/api/v1/assessment-engine";

export function getAssessmentApiBase(): string {
  return (
    process.env.NEXT_PUBLIC_IAE_API_BASE?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_ASSESSMENT_API_BASE?.replace(/\/$/, "") ||
    DEFAULT_BASE
  );
}

function formatDetail(detail: unknown): unknown {
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return JSON.stringify(item);
      })
      .join("; ");
  }
  return detail;
}

export async function assessmentFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = `${getAssessmentApiBase()}${normalized}`;

  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (err) {
    throw new AssessmentApiError(
      0,
      err instanceof Error
        ? `Cannot reach Assessment API at ${getAssessmentApiBase()}. Is IAE running on port 8004? Check NEXT_PUBLIC_IAE_API_BASE — do not use User Management (8001).`
        : "Network error talking to Assessment API"
    );
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
    const detail =
      data && typeof data === "object" && data !== null && "detail" in data
        ? formatDetail((data as { detail: unknown }).detail)
        : data ?? response.statusText;
    throw new AssessmentApiError(response.status, detail);
  }

  return data as T;
}

export function toQuery(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (value === false) continue;
    sp.set(key, String(value));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}
