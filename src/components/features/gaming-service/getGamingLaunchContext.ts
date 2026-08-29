import { CURRICULUM_TOPICS } from "@/lib/curriculum/topics";
import { useTutorStore } from "@/store/useTutorStore";
import { useUserStore } from "@/store/useUserStore";

import {
  chapterRewardItemId,
  farmLevelFromLessonId,
  lessonTitleOf,
  type CurriculumLessonLike,
} from "./chapterGameProgress";
import type { GamingServiceLaunchParams } from "./buildGamingServiceLaunchUrl";

const FARM_SESSION_PREFIX = "scipath_farm_session__";
const FARM_TOPIC_PREFIX = "scipath_farm_topic__";

/** Login handle for telemetry — email local-part, else stable user id. */
export function usernameFromEmail(
  email: string | null | undefined,
  userId: string,
): string {
  if (email) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return userId;
}

/** One farm play session per browser tab login (reused until tab closes). */
export function getOrCreateFarmSessionId(userId: string): string {
  if (typeof window === "undefined") return `sess_${userId}`;
  const key = `${FARM_SESSION_PREFIX}${userId}`;
  try {
    let id = sessionStorage.getItem(key);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `sess_${Date.now()}`;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}

function readPersistedTopicId(userId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${FARM_TOPIC_PREFIX}${userId}`)?.trim() || null;
  } catch {
    return null;
  }
}

function persistTopicId(userId: string, topicId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${FARM_TOPIC_PREFIX}${userId}`, topicId);
  } catch {
    /* ignore */
  }
}

/** First curriculum skill for the student's grade (stable fallback). */
export function defaultTopicIdForGrade(grade: number | null | undefined): string {
  const g = grade != null && Number.isFinite(Number(grade)) ? Number(grade) : 7;
  const match = CURRICULUM_TOPICS.find((topic) => topic.grade === g);
  return match?.topicId ?? CURRICULUM_TOPICS[0]?.topicId ?? "G7_C1_DEFAULT";
}

/**
 * Always resolve a topicId for the farm:
 * 1) live tutor active topic
 * 2) last topic this student launched with / tutor resolved
 * 3) first curriculum topic for their grade
 */
export function resolveFarmTopicId(
  userId: string,
  grade: number | null | undefined,
): string {
  const live = useTutorStore.getState().activeTopicId?.trim() || null;
  const saved = readPersistedTopicId(userId);
  const topicId = live || saved || defaultTopicIdForGrade(grade);
  persistTopicId(userId, topicId);
  return topicId;
}

/** Read SCI-PATH auth + tutor context for farm launch (non-hook). */
export function readGamingLaunchParams(): GamingServiceLaunchParams | null {
  const { userId, fullName, email, grade } = useUserStore.getState();
  if (!userId || !fullName) return null;

  return {
    studentId: userId,
    username: usernameFromEmail(email, userId),
    displayName: fullName,
    sessionId: getOrCreateFarmSessionId(userId),
    topicId: resolveFarmTopicId(userId, grade),
    grade,
  };
}

export type ChapterGameLaunchInput = {
  lesson: CurriculumLessonLike | null | undefined;
  gradeLessons?: CurriculumLessonLike[];
  cash?: number | null;
};

/**
 * Launch the farm for a specific LPE chapter (level N, chapter topic, reward item).
 */
export function buildChapterGameLaunchParams(
  input: ChapterGameLaunchInput,
): GamingServiceLaunchParams | null {
  const base = readGamingLaunchParams();
  if (!base) return null;
  const lesson = input.lesson;
  const lessonId = String(lesson?.lesson_id || "").trim();
  const gradeLessons = input.gradeLessons || [];
  const levelId = farmLevelFromLessonId(lessonId, gradeLessons);
  const idx = gradeLessons.findIndex((l) => String(l.lesson_id || "") === lessonId);
  const next = idx >= 0 ? gradeLessons[idx + 1] : null;
  const topicId = String(lesson?.topic_id || "").trim() || base.topicId;
  persistTopicId(base.studentId, topicId);

  const returnUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/learning-path`
      : "/learning-path";

  return {
    ...base,
    topicId,
    startLevel: levelId,
    cash: input.cash ?? null,
    lessonId: lessonId || null,
    chapterTitle: lessonTitleOf(lesson) || `Chapter ${levelId}`,
    nextLessonId: next?.lesson_id || null,
    nextChapterTitle: lessonTitleOf(next) || null,
    rewardItem: chapterRewardItemId(levelId),
    returnUrl,
  };
}
