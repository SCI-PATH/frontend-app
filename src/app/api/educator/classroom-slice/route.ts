import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/api/config";
import { CURRICULUM_TOPIC_IDS, getCurriculumTopic } from "@/lib/curriculum/topics";
import { postgresConfigured, queryRows } from "@/lib/db/postgres";
import type {
  AtRiskStudentsResponse,
  ClassroomSliceResponse,
  ClassroomStudentMeta,
  ClassroomTopicMeta,
  StudentProfileResponse,
} from "@/types/educator";
import { buildStudentCatalog } from "@/lib/educator/students";

const LEARNER_CATALOG_SQL = `
  SELECT
    ids.learner_id,
    COALESCE(NULLIF(TRIM(l.display_name), ''), ids.learner_id) AS display_name
  FROM (
    SELECT DISTINCT learner_id
    FROM (
      SELECT learner_id FROM learner_analytics.assessment_attempts
      UNION
      SELECT learner_id FROM learner_analytics.bkt_mastery
      UNION
      SELECT learner_id FROM learner_analytics.tutor_turns
    ) AS activity_ids
  ) AS ids
  LEFT JOIN shared.learners l ON l.learner_id = ids.learner_id
  ORDER BY ids.learner_id
`;

const LEARNER_ROSTER_SQL = `
  SELECT
    learner_id,
    COALESCE(NULLIF(TRIM(display_name), ''), learner_id) AS display_name
  FROM shared.learners
  ORDER BY learner_id
`;

const TOPIC_CATALOG_SQL = `
  SELECT
    t.topic_id,
    COALESCE(t.curriculum_reference, t.skill_label, t.topic_id) AS curriculum_title,
    b.prior_p,
    b.learn_p,
    b.guess_p,
    b.slip_p
  FROM shared.topics t
  INNER JOIN learner_analytics.bkt_skill_params b ON b.topic_id = t.topic_id
  ORDER BY t.topic_id
`;

const TOPIC_PARAMS_ONLY_SQL = `
  SELECT
    topic_id,
    topic_id AS curriculum_title,
    prior_p,
    learn_p,
    guess_p,
    slip_p
  FROM learner_analytics.bkt_skill_params
  ORDER BY topic_id
`;

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(
      typeof payload === "object" &&
        payload !== null &&
        "detail" in payload
        ? JSON.stringify((payload as { detail: unknown }).detail)
        : `Analytics request failed (${response.status})`
    );
  }
  return payload as T;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Analytics request failed (${response.status})`);
  }
  return payload as T;
}

function mapTopicRow(row: Record<string, unknown>): ClassroomTopicMeta {
  return {
    topicId: String(row.topic_id),
    curriculumTitle: String(row.curriculum_title ?? row.topic_id),
    pL0: Number(row.prior_p ?? 0.25),
    pT: Number(row.learn_p ?? 0.15),
    pG: Number(row.guess_p ?? 0.2),
    pS: Number(row.slip_p ?? 0.1),
  };
}

function fallbackTopicCatalog(): ClassroomTopicMeta[] {
  return CURRICULUM_TOPIC_IDS.map((topicId) => {
    const topic = getCurriculumTopic(topicId);
    return {
      topicId,
      curriculumTitle: topic?.curriculumTitle ?? topicId,
      pL0: topic?.pL0 ?? 0.25,
      pT: topic?.pT ?? 0.15,
      pG: topic?.pG ?? 0.2,
      pS: topic?.pS ?? 0.1,
    };
  });
}

function mapStudentRow(row: Record<string, unknown>): ClassroomStudentMeta {
  return {
    learnerId: String(row.learner_id),
    displayName: String(row.display_name ?? row.learner_id),
  };
}

async function loadLearnerRoster(): Promise<ClassroomStudentMeta[]> {
  try {
    const rows = await queryRows(LEARNER_ROSTER_SQL);
    return rows.map(mapStudentRow);
  } catch (error) {
    console.error("[classroom-slice] Could not load shared.learners roster:", error);
    return [];
  }
}

async function loadStudentCatalogFromPostgres(): Promise<ClassroomStudentMeta[]> {
  try {
    const rows = await queryRows(LEARNER_CATALOG_SQL);
    return rows.map(mapStudentRow);
  } catch (error) {
    console.error("[classroom-slice] Could not load learner catalog join:", error);
    return [];
  }
}

async function loadSliceFromPostgres(): Promise<ClassroomSliceResponse> {
  let topicRows: Record<string, unknown>[] = [];
  try {
    topicRows = await queryRows(TOPIC_CATALOG_SQL);
  } catch {
    topicRows = await queryRows(TOPIC_PARAMS_ONLY_SQL);
  }

  const students = await loadStudentCatalogFromPostgres();
  const studentIds = students.map((student) => student.learnerId);
  const topics = topicRows.map(mapTopicRow);

  return {
    success: true,
    source: "postgres",
    mode: "live_state",
    studentIds,
    students,
    topicIds: topics.map((topic) => topic.topicId),
    topics,
    learnerCount: studentIds.length,
    topicCount: topics.length,
  };
}

async function loadSliceFromAnalyticsApi(): Promise<ClassroomSliceResponse> {
  const atRisk = await postJson<AtRiskStudentsResponse>(
    "/api/v1/analytics/at-risk-students",
    {}
  );

  const learnerIds = new Set<string>();
  const topicIds = new Set<string>();

  for (const alert of atRisk.students ?? []) {
    learnerIds.add(alert.student_id);
    topicIds.add(alert.topic_id);
  }

  const profiles = await Promise.all(
    [...learnerIds].map((studentId) =>
      getJson<StudentProfileResponse>(
        `/api/v1/analytics/student-profile/${encodeURIComponent(studentId)}`
      ).catch(() => null)
    )
  );

  for (const profile of profiles) {
    if (!profile?.success) continue;
    learnerIds.add(profile.user_id);
    for (const row of profile.bkt_parameters ?? []) {
      topicIds.add(row.topic_id);
    }
    for (const row of profile.mastery_timeline_last_10_attempts ?? []) {
      if (row.topic_id) topicIds.add(row.topic_id);
    }
  }

  const catalog = fallbackTopicCatalog();
  const catalogById = new Map(catalog.map((topic) => [topic.topicId, topic]));
  const sortedTopicIds = [...topicIds].sort((a, b) => {
    const ai = catalogById.has(a) ? catalog.findIndex((t) => t.topicId === a) : 9999;
    const bi = catalogById.has(b) ? catalog.findIndex((t) => t.topicId === b) : 9999;
    return ai - bi || a.localeCompare(b);
  });

  const sortedStudentIds = [...learnerIds].sort();
  const roster = postgresConfigured() ? await loadLearnerRoster() : [];
  const students = buildStudentCatalog(sortedStudentIds, roster);

  return {
    success: true,
    source: "analytics_api",
    mode: "live_state",
    studentIds: sortedStudentIds,
    students,
    topicIds: sortedTopicIds,
    topics: sortedTopicIds.map(
      (topicId) => catalogById.get(topicId) ?? {
        topicId,
        curriculumTitle: topicId,
        pL0: 0.25,
        pT: 0.15,
        pG: 0.2,
        pS: 0.1,
      }
    ),
    learnerCount: learnerIds.size,
    topicCount: sortedTopicIds.length,
  };
}

export async function GET() {
  try {
    const slice = postgresConfigured()
      ? await loadSliceFromPostgres()
      : await loadSliceFromAnalyticsApi();

    return NextResponse.json(slice);
  } catch (caught) {
    const message =
      caught instanceof Error
        ? caught.message
        : "Could not load classroom slice.";
    return NextResponse.json(
      {
        success: false,
        source: "error",
        mode: "live_state",
        studentIds: [],
        students: [],
        topicIds: [],
        topics: [],
        learnerCount: 0,
        topicCount: 0,
        error: message,
      } satisfies ClassroomSliceResponse,
      { status: 500 }
    );
  }
}
