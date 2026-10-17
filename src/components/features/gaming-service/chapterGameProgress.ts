/**
 * Shared Learning Path ↔ farm-level helpers.
 * A passed farm opens the next chapter. Later chapters stay locked until the
 * chapter before them is passed. While a farm still needs a replay, that chapter
 * stays open and the next one stays locked.
 */

export const GAME_PASS_THRESHOLD = 0.65;

export type CurriculumLessonLike = {
  lesson_id?: string;
  title?: string;
  display_title?: string;
  topic_id?: string;
};

export type QuizByLesson = Record<
  string,
  { attempts?: number; last_score?: number | null } | undefined
>;

/** Signature farm items granted when a chapter lesson is completed. */
export const CHAPTER_REWARD_ITEMS = [
  "sheep",
  "well",
  "tree_large",
  "tent",
  "cart",
  "windmill",
  "lamb",
  "bushes_large",
  "campfire",
  "chest",
  "rooster",
  "tree_medium",
  "barrel",
  "supplies",
  "piglet",
  "turkey",
  "bull",
] as const;

const REWARD_LABELS: Record<string, string> = {
  sheep: "Sheep",
  well: "Water Well",
  tree_large: "Large Tree",
  tent: "Camp Tent",
  cart: "Wooden Cart",
  windmill: "Windmill",
  lamb: "Lamb",
  bushes_large: "Large Bushes",
  campfire: "Campfire",
  chest: "Treasure Chest",
  rooster: "Rooster",
  tree_medium: "Medium Tree",
  barrel: "Wooden Barrel",
  supplies: "Farm Supplies",
  piglet: "Piglet",
  turkey: "Turkey",
  bull: "Bull",
};

export function lessonTitleOf(lesson: CurriculumLessonLike | null | undefined): string {
  if (!lesson) return "";
  return String(lesson.display_title || lesson.title || lesson.lesson_id || "").trim();
}

/** Chapter order in the grade list. Used for rewards, not the farm level label. */
export function lessonOrdinalFromLessonId(
  lessonId: string | null | undefined,
  gradeLessons: CurriculumLessonLike[] = [],
): number {
  const raw = String(lessonId || "").trim();
  const match = raw.match(/^g\d+_sci_(\d+)$/i);
  if (match) return Math.max(1, Number(match[1]) || 1);
  const idx = gradeLessons.findIndex((l) => String(l.lesson_id || "") === raw);
  if (idx >= 0) return idx + 1;
  return 1;
}

/**
 * Farm level inside the open chapter. A new chapter always starts at Level 1.
 * The chapter number (Chapter 6) is not the game level.
 */
export function farmLevelFromLessonId(
  _lessonId?: string | null,
  _gradeLessons?: CurriculumLessonLike[],
): number {
  return 1;
}

export function chapterRewardItemId(levelId: number): string {
  const i = Math.max(0, Math.floor(Number(levelId) || 1) - 1);
  return CHAPTER_REWARD_ITEMS[i % CHAPTER_REWARD_ITEMS.length];
}

export function chapterRewardLabel(itemId: string | null | undefined): string {
  const id = String(itemId || "").trim();
  return REWARD_LABELS[id] || id;
}

export function isLessonGameComplete(
  lessonId: string | null | undefined,
  quizByLesson: QuizByLesson | null | undefined,
): boolean {
  const lid = String(lessonId || "").trim();
  if (!lid) return false;
  const last = Number(quizByLesson?.[lid]?.last_score);
  return Number.isFinite(last) && last >= GAME_PASS_THRESHOLD;
}

/**
 * Existing students may have later chapters marked complete without a game
 * quiz row. Treat earlier chapters as already passed so we don't lock them out.
 */
export function isLessonGameCompleteWithLegacy(
  lessonId: string,
  quizByLesson: QuizByLesson,
  completedLessonIds: string[],
  gradeLessons: CurriculumLessonLike[],
): boolean {
  if (isLessonGameComplete(lessonId, quizByLesson)) return true;
  const idx = gradeLessons.findIndex((l) => l.lesson_id === lessonId);
  if (idx < 0) return false;
  const done = new Set(completedLessonIds.map(String));
  return gradeLessons.slice(idx + 1).some((l) => done.has(String(l.lesson_id || "")));
}

/**
 * Before any farm pass: a pending farm keeps only that chapter open.
 * After a farm pass: the next chapter opens, and later chapters stay locked
 * until their own previous chapter farm is passed.
 * A chapter that still needs a replay stays open.
 */
export function isChapterUnlockedForLearning(
  index: number,
  gradeLessons: CurriculumLessonLike[],
  quizByLesson: QuizByLesson,
  completedLessonIds: string[],
): boolean {
  if (index <= 0) return true;
  const lesson = gradeLessons[index];
  const lessonId = String(lesson?.lesson_id || "").trim();
  const anyGamePass = gradeLessons.some((row) =>
    isLessonGameComplete(row?.lesson_id, quizByLesson),
  );

  if (anyGamePass) {
    const prevId = gradeLessons[index - 1]?.lesson_id;
    if (isLessonGameComplete(prevId, quizByLesson)) return true;
    const pending = findPendingChapterGame(
      gradeLessons,
      completedLessonIds,
      quizByLesson,
    );
    return Boolean(pending && lessonId === pending.lessonId);
  }

  const pending = findPendingChapterGame(gradeLessons, completedLessonIds, quizByLesson);
  if (!pending) return true;
  return lessonId === pending.lessonId;
}

export type PendingChapterGame = {
  lesson: CurriculumLessonLike;
  lessonId: string;
  levelId: number;
  title: string;
  rewardItemId: string;
  rewardLabel: string;
};

/** First learned chapter whose farm game is not done yet. */
export function findPendingChapterGame(
  gradeLessons: CurriculumLessonLike[],
  completedLessonIds: string[],
  quizByLesson: QuizByLesson,
): PendingChapterGame | null {
  const done = new Set(completedLessonIds.map(String));
  for (let i = 0; i < gradeLessons.length; i += 1) {
    const lesson = gradeLessons[i];
    const lessonId = String(lesson?.lesson_id || "");
    if (!lessonId || !done.has(lessonId)) continue;
    if (
      isLessonGameCompleteWithLegacy(
        lessonId,
        quizByLesson,
        completedLessonIds,
        gradeLessons,
      )
    ) {
      continue;
    }
    const levelId = farmLevelFromLessonId(lessonId, gradeLessons);
    const rewardItemId = chapterRewardItemId(
      lessonOrdinalFromLessonId(lessonId, gradeLessons),
    );
    return {
      lesson,
      lessonId,
      levelId,
      title: lessonTitleOf(lesson) || "this chapter",
      rewardItemId,
      rewardLabel: chapterRewardLabel(rewardItemId),
    };
  }
  return null;
}

export type GameReturnPayload = {
  lessonId: string;
  levelId: number;
  chapterTitle: string;
  nextLessonId: string;
  nextChapterTitle: string;
  unlockedLabels: string[];
  retryLesson: boolean;
  frustrationScore: number | null;
  mastery: number | null;
};

export function parseGameReturnSearch(
  search: string | URLSearchParams | null | undefined,
): GameReturnPayload | null {
  if (search == null) return null;
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;
  const fromGame = params.get("fromGame") || params.get("gameComplete");
  if (!fromGame || fromGame === "0" || fromGame === "false") return null;
  const lessonId = String(params.get("lessonId") || "").trim();
  if (!lessonId) return null;
  const levelId = Math.max(1, Number(params.get("level") || params.get("levelId")) || 1);
  const unlocked = String(params.get("unlocked") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const frustrationRaw = Number(params.get("frustrationScore"));
  const masteryRaw = Number(params.get("mastery"));
  return {
    lessonId,
    levelId,
    chapterTitle: String(params.get("chapterTitle") || "").trim(),
    nextLessonId: String(params.get("nextLessonId") || "").trim(),
    nextChapterTitle: String(params.get("nextTitle") || params.get("nextChapterTitle") || "").trim(),
    unlockedLabels: unlocked,
    retryLesson: params.get("retryLesson") === "1",
    frustrationScore: Number.isFinite(frustrationRaw) ? frustrationRaw : null,
    mastery: Number.isFinite(masteryRaw) ? masteryRaw : null,
  };
}

export function stripGameReturnParams(url: URL): string {
  for (const key of [
    "fromGame",
    "gameComplete",
    "lessonId",
    "level",
    "levelId",
    "chapterTitle",
    "nextLessonId",
    "nextTitle",
    "nextChapterTitle",
    "unlocked",
    "retryLesson",
    "frustrationScore",
    "frustrationLevel",
    "mastery",
  ]) {
    url.searchParams.delete(key);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
