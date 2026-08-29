/**
 * Build launch URL for the SCI_PATH farm (Vite app under this folder).
 * Default local dev: http://localhost:5173
 *
 * Set in `.env.local`:
 *   NEXT_PUBLIC_GAMING_SERVICE_URL=http://localhost:5173
 */
export type GamingServiceLaunchParams = {
  /** Stable user id from user-management / JWT */
  studentId: string;
  /** Login handle (email local-part or id) */
  username: string;
  /** Shown in farm UI */
  displayName: string;
  /** Platform session id — ties engagement rows to SCI-PATH login */
  sessionId: string;
  /** Science topic id — always required for farm launch */
  topicId: string;
  grade?: number | null;
  /** Next playable farm level (1 if new) */
  startLevel?: number | null;
  /** Wallet / farm cash to resume with */
  cash?: number | null;
  /** LPE lesson id this farm level belongs to */
  lessonId?: string | null;
  chapterTitle?: string | null;
  nextLessonId?: string | null;
  nextChapterTitle?: string | null;
  /** Farm catalog item granted for completing this chapter lesson */
  rewardItem?: string | null;
  /** Absolute URL back to /learning-path */
  returnUrl?: string | null;
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
  url.searchParams.set("username", params.username);
  url.searchParams.set("displayName", params.displayName);
  url.searchParams.set("sessionId", params.sessionId);
  url.searchParams.set("topicId", params.topicId.trim());
  if (params.grade != null && Number.isFinite(params.grade)) {
    url.searchParams.set("grade", String(params.grade));
  }
  const startLevel = Math.max(1, Number(params.startLevel) || 1);
  url.searchParams.set("startLevel", String(startLevel));
  if (params.cash != null && Number.isFinite(params.cash)) {
    url.searchParams.set("cash", String(Math.max(0, Number(params.cash))));
  }
  if (params.lessonId) url.searchParams.set("lessonId", params.lessonId);
  if (params.chapterTitle) url.searchParams.set("chapterTitle", params.chapterTitle);
  if (params.nextLessonId) url.searchParams.set("nextLessonId", params.nextLessonId);
  if (params.nextChapterTitle) url.searchParams.set("nextTitle", params.nextChapterTitle);
  if (params.rewardItem) url.searchParams.set("rewardItem", params.rewardItem);
  if (params.returnUrl) url.searchParams.set("returnUrl", params.returnUrl);
  url.searchParams.set("source", "frontend-app");

  return url.toString();
}
