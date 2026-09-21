/**
 * Learner Analytics (Component 4) mastery helpers for student lesson content.
 * On later chapters we take the latest mastery_category (level), not the P(L) score.
 */
import {
  getAnalyticsProfile,
  postAnalyticsProfile,
} from "@/components/features/learning-path-engine/api/client.js";
import { API_BASE_URL } from "@/lib/api/config";
import {
  getStudentInitialCategory,
  normalizeAssessmentCategory,
  type LearnerKnowledgeLevel,
} from "@/lib/api/assessment";
import { fetchStudentProfile } from "@/lib/api/educator";

const MASTERY_PATH = "/api/v1/mastery";
const DEFAULT_TIMEOUT_MS = 30_000;

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Map LPE lesson id → shared analytics chapter key.
 * `g6_sci_03` → `G6_C3`, `g8_sci_11` → `G8_C11`.
 */
export function chapterIdFromLessonId(
  lessonId: string | null | undefined
): string | null {
  if (!lessonId) return null;
  const match = lessonId.trim().match(/^g(\d+)_sci_(\d+)$/i);
  if (!match) return null;
  return `G${Number(match[1])}_C${Number(match[2])}`;
}

function chapterIdFromTopicId(topicId: string | null | undefined): string | null {
  if (!topicId) return null;
  const match = topicId.trim().match(/^(G\d+_C\d+)/i);
  return match ? match[1].toUpperCase() : null;
}

async function fetchTopicMasteryLevel(
  userId: string,
  topicId: string
): Promise<LearnerKnowledgeLevel | null> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${API_BASE_URL}${MASTERY_PATH}/${encodeURIComponent(userId)}/${encodeURIComponent(topicId)}`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal,
      }
    );
    const payload = (await response.json().catch(() => ({}))) as {
      mastery_category?: string;
      success?: boolean;
      error?: string;
    };
    if (!response.ok || payload.success === false) return null;
    return normalizeAssessmentCategory(payload.mastery_category);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/**
 * Latest analytics knowledge level after finished chapters (post game/quiz).
 * Uses the most recent attempt's topic → `mastery_category` only.
 * Prefers attempts that belong to finished chapters when that set is known.
 */
export async function fetchLatestAnalyticsKnowledgeLevel(
  userId: string,
  completedLessonIds: string[] = []
): Promise<LearnerKnowledgeLevel | null> {
  const profile = await fetchStudentProfile(userId);
  const finishedChapters = new Set(
    completedLessonIds
      .map((id) => chapterIdFromLessonId(id))
      .filter((id): id is string => Boolean(id))
  );

  const timeline = [
    ...(profile.mastery_timeline_last_10_attempts || []),
    ...(profile.recent_attempts || []),
  ];
  // Walk newest → oldest (arrays are oldest→newest).
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    const topicId = timeline[i]?.topic_id?.trim();
    if (!topicId) continue;

    if (finishedChapters.size) {
      const chapter = chapterIdFromTopicId(topicId);
      if (chapter && !finishedChapters.has(chapter)) continue;
    }

    const fromProfile = normalizeAssessmentCategory(
      profile.bkt_parameters?.find((row) => row.topic_id === topicId)
        ?.mastery_category
    );
    if (fromProfile) return fromProfile;

    const fromMasteryApi = await fetchTopicMasteryLevel(userId, topicId);
    if (fromMasteryApi) return fromMasteryApi;
  }

  // No attempt timeline — use any BKT row that already has a category.
  for (let i = (profile.bkt_parameters?.length || 0) - 1; i >= 0; i -= 1) {
    const level = normalizeAssessmentCategory(
      profile.bkt_parameters?.[i]?.mastery_category
    );
    if (level) return level;
  }

  return null;
}

/**
 * Analytics may lag after a farm game — retry briefly before falling back to stored LPE profile.
 */
export async function fetchLatestAnalyticsKnowledgeLevelWithRetry(
  userId: string,
  completedLessonIds: string[] = [],
  options: { attempts?: number; delayMs?: number } = {}
): Promise<LearnerKnowledgeLevel | null> {
  const attempts = Math.max(1, options.attempts ?? 1);
  const delayMs = Math.max(0, options.delayMs ?? 0);
  for (let i = 0; i < attempts; i += 1) {
    const level = await fetchLatestAnalyticsKnowledgeLevel(userId, completedLessonIds);
    if (level) return level;
    if (i < attempts - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }
  return null;
}

async function readStoredLpeProfile(
  userId: string
): Promise<LearnerKnowledgeLevel | null> {
  try {
    const row = await getAnalyticsProfile(userId);
    return normalizeAssessmentCategory(row?.profile);
  } catch {
    return null;
  }
}

export type ResolveLearnerProfileOptions = {
  lessonId?: string | null;
  completedLessonIds?: string[];
  /** Persist resolved level to LPE `/analytics/profile`. */
  persist?: boolean;
  /** Retry analytics when student has finished at least one chapter. */
  analyticsAttempts?: number;
  analyticsRetryDelayMs?: number;
};

export type ResolveLearnerProfileResult = {
  profile: string | null;
  reason: "ok" | "no_aptitude" | "assessment_unreachable";
  source?:
    | "intelligent_assessment_engine"
    | "learner_analytics"
    | "stored_profile";
};

/**
 * Aptitude (IAE) is required before any lesson.
 * First chapter → IAE category.
 * After game/quiz chapters → latest analytics mastery_category; if analytics is slow/down,
 * keep the last level saved on LPE (not the original aptitude band).
 */
export async function resolveLearnerProfileForLesson(
  userId: string,
  grade: number,
  options: ResolveLearnerProfileOptions = {}
): Promise<ResolveLearnerProfileResult> {
  const {
    lessonId = null,
    completedLessonIds = [],
    persist = true,
    analyticsAttempts = 1,
    analyticsRetryDelayMs = 0,
  } = options;

  let iaeCategory: string | null = null;
  try {
    const fromIae = await getStudentInitialCategory(userId);
    iaeCategory = fromIae.category;
    if (!iaeCategory) {
      return { profile: null, reason: "no_aptitude" };
    }
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 404) {
      return { profile: null, reason: "no_aptitude" };
    }
    return { profile: null, reason: "assessment_unreachable" };
  }

  const storedProfile = await readStoredLpeProfile(userId);
  const hasFinishedChapter = completedLessonIds.length > 0;

  let profile: string = iaeCategory;
  let source: ResolveLearnerProfileResult["source"] =
    "intelligent_assessment_engine";

  if (hasFinishedChapter) {
    const fromAnalytics = await fetchLatestAnalyticsKnowledgeLevelWithRetry(
      userId,
      completedLessonIds,
      {
        attempts: analyticsAttempts,
        delayMs: analyticsRetryDelayMs,
      }
    );
    if (fromAnalytics) {
      profile = fromAnalytics;
      source = "learner_analytics";
    } else if (storedProfile) {
      profile = storedProfile;
      source = "stored_profile";
    }
  }

  if (persist) {
    await postAnalyticsProfile({
      user_id: userId,
      profile,
      source,
      lesson_id: lessonId || null,
      grade,
    }).catch(() => {});
  }

  return { profile, reason: "ok", source };
}
