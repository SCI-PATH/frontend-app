import { countStudentTopicBands } from "@/lib/educator/bkt";
import type { BktParameterRow, StudentProfileResponse } from "@/types";

function isUserLevelTopic(topicId: string | null | undefined): boolean {
  return String(topicId || "").trim().toUpperCase() === "USER";
}

/** Skills with quiz evidence only — Socrates chat does not update BKT. */
export function quizMasteryRows(
  profile: StudentProfileResponse | null
): BktParameterRow[] {
  const rows = (profile?.bkt_parameters ?? []).filter(
    (row) => row.topic_id && !isUserLevelTopic(row.topic_id)
  );
  const quizIds = new Set<string>();
  for (const attempt of profile?.recent_attempts ?? []) {
    if (attempt.topic_id && !isUserLevelTopic(attempt.topic_id)) {
      quizIds.add(attempt.topic_id);
    }
  }
  for (const point of profile?.mastery_timeline_last_10_attempts ?? []) {
    if (point.topic_id && !isUserLevelTopic(point.topic_id)) {
      quizIds.add(point.topic_id);
    }
  }
  const chatIds = new Set<string>();
  for (const turn of profile?.chat_history_last_5 ?? []) {
    if (turn.topic_id && !isUserLevelTopic(turn.topic_id)) {
      chatIds.add(turn.topic_id);
    }
  }
  for (const turn of profile?.engagement_timeline_last_10_turns ?? []) {
    if (turn.topic_id && !isUserLevelTopic(turn.topic_id)) {
      chatIds.add(turn.topic_id);
    }
  }
  if (quizIds.size === 0 && chatIds.size === 0) return rows;
  return rows.filter(
    (row) => quizIds.has(row.topic_id) || !chatIds.has(row.topic_id)
  );
}

export type StudentProfileMetrics = {
  overallMastery: number | null;
  skillsPractised: number;
  mastered: number;
  learning: number;
  atRisk: number;
  quizAttempts: number;
};

export function buildStudentProfileMetrics(
  profile: StudentProfileResponse | null
): StudentProfileMetrics | null {
  if (!profile) return null;

  const quizSkills = quizMasteryRows(profile);
  const topicIds = quizSkills.map((row) => row.topic_id);
  const row = Object.fromEntries(
    quizSkills.map((entry) => [entry.topic_id, entry.p_l])
  );
  const bands = countStudentTopicBands(row, topicIds);

  const values = quizSkills
    .map((skill) => skill.p_l)
    .filter((value): value is number => typeof value === "number");
  const overallMastery =
    values.length > 0
      ? Math.round(
          (values.reduce((sum, value) => sum + value, 0) / values.length) * 100
        )
      : null;

  const recentAttempts = profile.recent_attempts ?? [];
  const quizAttempts =
    profile.assessment_insights?.attempts_count ?? recentAttempts.length;

  return {
    overallMastery,
    skillsPractised: quizSkills.length,
    mastered: bands.mastered,
    learning: bands.learning,
    atRisk: bands.atRisk,
    quizAttempts,
  };
}
