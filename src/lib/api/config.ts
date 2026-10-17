/** Browser talks same-origin; Next rewrites `/analytics-api/*` to Component 4. */
export const ANALYTICS_PROXY_PREFIX = "/analytics-api";

function directAnalyticsUrl(): string {
  return (
    process.env.ANALYTICS_API_PROXY_TARGET?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8003"
  );
}

/**
 * FastAPI origin with no trailing slash.
 * In the browser this is `/analytics-api` so Socrates is not a cross-origin
 * call to :8003 (that 500s without CORS headers and Chrome reports "CORS").
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") return ANALYTICS_PROXY_PREFIX;
  return directAnalyticsUrl();
}

/** Prefer `getApiBaseUrl()` at call time. Kept for existing imports. */
export const API_BASE_URL = getApiBaseUrl();
