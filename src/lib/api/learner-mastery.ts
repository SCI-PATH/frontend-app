/**
 * Learner Analytics (Component 4) mastery helpers for student lesson content.
 * On later chapters we take the latest mastery_category (level), not the P(L) score.
 */
import { API_BASE_URL } from "@/lib/api/config";
import {
  normalizeAssessmentCategory,
  type LearnerKnowledgeLevel,
} from "@/lib/api/assessment";
import { fetchStudentProfile } from "@/lib/api/educator";

const MASTERY_PATH = "/api/v1/mastery";
const DEFAULT_TIMEOUT_MS = 30_000;

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
