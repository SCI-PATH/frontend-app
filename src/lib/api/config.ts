/** FastAPI origin only (no trailing slash). Paths are appended by feature clients. */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:8003";
