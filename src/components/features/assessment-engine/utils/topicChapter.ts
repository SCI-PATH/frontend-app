import type { TeacherTopic } from "../types";

/** Derive canonical chapter id from a topic id, e.g. G6_C7_MAG_POLES → G6_C7. */
export function chapterIdFromTopicId(topicId: string | undefined | null): string {
  if (!topicId) return "";
  const match = topicId.trim().match(/^(G\d+_C\d+)/i);
  return match ? match[1].toUpperCase() : "";
}

export function chapterLabelFromTopic(topic: TeacherTopic): string {
  const id = chapterIdFromTopicId(topic.topic_id);
  if (topic.chapter_title && id) return `${id} · ${topic.chapter_title}`;
  if (topic.chapter_title) return topic.chapter_title;
  return id || topic.topic_id;
}

/** Unique chapter options for a grade's topic catalog. */
export function chaptersFromTopics(topics: TeacherTopic[]): {
  id: string;
  label: string;
}[] {
  const seen = new Map<string, string>();
  for (const topic of topics) {
    const id = chapterIdFromTopicId(topic.topic_id);
    if (!id || seen.has(id)) continue;
    seen.set(
      id,
      topic.chapter_title ? `${id} · ${topic.chapter_title}` : id
    );
  }
  return Array.from(seen.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, label]) => ({ id, label }));
}

export function topicsForChapter(
  topics: TeacherTopic[],
  chapterId: string
): TeacherTopic[] {
  if (!chapterId) return topics;
  return topics.filter(
    (t) => chapterIdFromTopicId(t.topic_id) === chapterId.toUpperCase()
  );
}
