/**
 * Build launch URL for the SCI_PATH farm (gaming-service Vite app).
 * Default local dev: http://localhost:5173
 *
 * Set in `.env.local`:
 *   NEXT_PUBLIC_GAMING_SERVICE_URL=http://localhost:5173
 */
export type GamingServiceLaunchParams = {
  studentId: string;
  displayName: string;
  grade?: number | null;
  /** Platform session id; generated if omitted */
  sessionId?: string;
};

export function getGamingServiceBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_GAMING_SERVICE_URL?.trim() ||
    "http://localhost:5173";
  return raw.replace(/\/+$/, "");
}

export function buildGamingServiceLaunchUrl(
  params: GamingServiceLaunchParams,
): string {
  const base = getGamingServiceBaseUrl();
  const url = new URL(base.endsWith("/") ? base : `${base}/`);

  url.searchParams.set("studentId", params.studentId);
  url.searchParams.set("displayName", params.displayName);
  url.searchParams.set(
    "sessionId",
    params.sessionId ||
      (typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess_${Date.now()}`),
  );
  if (params.grade != null && Number.isFinite(params.grade)) {
    url.searchParams.set("grade", String(params.grade));
  }
  url.searchParams.set("source", "sci-path");

  return url.toString();
}
