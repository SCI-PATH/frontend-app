/**
 * Shared Learning Path ↔ farm-level helpers.
 * Chapter N in a grade maps to farm level N. Next chapter unlocks only after
 * that chapter's farm game is passed (stored as LPE quiz_by_lesson).
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

/** `g6_sci_03` → 3. Falls back to 1-based index in the grade list. */
export function farmLevelFromLessonId(
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

/** Chapter 1 is always open; later chapters need the previous chapter's farm game. */
export function isChapterUnlockedForLearning(
  index: number,
  gradeLessons: CurriculumLessonLike[],
  quizByLesson: QuizByLesson,
  completedLessonIds: string[],
): boolean {
  if (index <= 0) return true;
  const prev = gradeLessons[index - 1];
  if (!prev?.lesson_id) return true;
  return isLessonGameCompleteWithLegacy(
    prev.lesson_id,
    quizByLesson,
    completedLessonIds,
    gradeLessons,
  );
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
    const rewardItemId = chapterRewardItemId(levelId);
    return {
      lesson,
      lessonId,
      levelId,
      title: lessonTitleOf(lesson) || `Chapter ${levelId}`,
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
  return {
    lessonId,
    levelId,
    chapterTitle: String(params.get("chapterTitle") || "").trim(),
    nextLessonId: String(params.get("nextLessonId") || "").trim(),
    nextChapterTitle: String(params.get("nextTitle") || params.get("nextChapterTitle") || "").trim(),
    unlockedLabels: unlocked,
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
  ]) {
    url.searchParams.delete(key);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}
