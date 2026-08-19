import { NextResponse } from "next/server";

import { API_BASE_URL } from "@/lib/api/config";
import { CURRICULUM_TOPIC_IDS, getCurriculumTopic } from "@/lib/curriculum/topics";
import { postgresConfigured, queryRows } from "@/lib/db/postgres";
import type {
  ClassroomSliceResponse,
  ClassroomStudentMeta,
  ClassroomTopicMeta,
  MasteryMatrixResponse,
} from "@/types/educator";
import { buildStudentCatalog } from "@/lib/educator/students";

const CLASS_META_SQL = `
  SELECT class_code, class_name, grade_level, subject, teacher_id
  FROM shared.classes
  WHERE class_code = $1 AND is_active = true
`;

const CLASS_ROSTER_SQL = `
  SELECT
    e.learner_id,
    COALESCE(NULLIF(TRIM(l.display_name), ''), e.learner_id) AS display_name
  FROM shared.class_enrollments e
  LEFT JOIN shared.learners l ON l.learner_id = e.learner_id
  WHERE e.class_code = $1
  ORDER BY e.learner_id
`;

const GRADE_TOPIC_CATALOG_SQL = `
  SELECT
    t.topic_id,
    COALESCE(t.curriculum_reference, t.skill_label, t.topic_id) AS curriculum_title,
    b.prior_p,
    b.learn_p,
    b.guess_p,
    b.slip_p
  FROM shared.topics t
  INNER JOIN learner_analytics.bkt_skill_params b ON b.topic_id = t.topic_id
  WHERE t.topic_id LIKE $1
  ORDER BY t.topic_id
`;

const GRADE_TOPIC_PARAMS_ONLY_SQL = `
  SELECT
    topic_id,
    topic_id AS curriculum_title,
    prior_p,
    learn_p,
    guess_p,
    slip_p
  FROM learner_analytics.bkt_skill_params
  WHERE topic_id LIKE $1
  ORDER BY topic_id
`;

const CLASS_ATTEMPT_MATRIX_SQL = `
  SELECT bm.learner_id, bm.topic_id, bm.attempts
  FROM learner_analytics.bkt_mastery bm
  INNER JOIN shared.class_enrollments e
    ON e.learner_id = bm.learner_id AND e.class_code = $1
  WHERE bm.attempts > 0
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

function fallbackTopicCatalogForGrade(gradeLevel: number): ClassroomTopicMeta[] {
  const prefix = `G${gradeLevel}_`;
  return CURRICULUM_TOPIC_IDS.filter((topicId) => topicId.startsWith(prefix)).map(
    (topicId) => {
      const topic = getCurriculumTopic(topicId);
      return {
        topicId,
        curriculumTitle: topic?.curriculumTitle ?? topicId,
        pL0: topic?.pL0 ?? 0.25,
        pT: topic?.pT ?? 0.15,
        pG: topic?.pG ?? 0.2,
        pS: topic?.pS ?? 0.1,
      };
    }
  );
}

function mapStudentRow(row: Record<string, unknown>): ClassroomStudentMeta {
  return {
    learnerId: String(row.learner_id),
    displayName: String(row.display_name ?? row.learner_id),
  };
}

function buildAttemptMatrix(
  rows: readonly Record<string, unknown>[]
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  for (const row of rows) {
    const learnerId = String(row.learner_id ?? "");
    const topicId = String(row.topic_id ?? "");
    const attempts = Number(row.attempts ?? 0);
    if (!learnerId || !topicId || attempts <= 0) continue;
    matrix[learnerId] ??= {};
    matrix[learnerId][topicId] = attempts;
  }
  return matrix;
}

async function loadSliceForClassFromPostgres(
  classCode: string
): Promise<ClassroomSliceResponse> {
  const metaRows = await queryRows<Record<string, unknown>>(CLASS_META_SQL, [
    classCode,
  ]);
  if (metaRows.length === 0) {
    return {
      success: false,
      source: "error",
      mode: "live_state",
      studentIds: [],
      students: [],
      topicIds: [],
      topics: [],
      learnerCount: 0,
      topicCount: 0,
      error: `Unknown or inactive class code: ${classCode}`,
    };
  }

  const meta = metaRows[0];
  const gradeLevel = Number(meta.grade_level ?? 0);
  const gradePrefix = `G${gradeLevel}_%`;

  let topicRows: Record<string, unknown>[] = [];
  try {
    topicRows = await queryRows(GRADE_TOPIC_CATALOG_SQL, [gradePrefix]);
  } catch {
    topicRows = await queryRows(GRADE_TOPIC_PARAMS_ONLY_SQL, [gradePrefix]);
  }

  if (topicRows.length === 0) {
    const fallbackTopics = fallbackTopicCatalogForGrade(gradeLevel);
    topicRows = fallbackTopics.map((topic) => ({
      topic_id: topic.topicId,
      curriculum_title: topic.curriculumTitle,
      prior_p: topic.pL0,
      learn_p: topic.pT,
      guess_p: topic.pG,
      slip_p: topic.pS,
    }));
  }

  const rosterRows = await queryRows(CLASS_ROSTER_SQL, [classCode]);
  const students = rosterRows.map(mapStudentRow);
  const studentIds = students.map((student) => student.learnerId);
  const topics = topicRows.map(mapTopicRow);

  let attemptMatrix: Record<string, Record<string, number>> = {};
  try {
    const attemptRows = await queryRows(CLASS_ATTEMPT_MATRIX_SQL, [classCode]);
    attemptMatrix = buildAttemptMatrix(attemptRows);
  } catch (error) {
    console.error("[classroom-slice] Could not load class attempt matrix:", error);
  }

  return {
    success: true,
    source: "postgres",
    mode: "live_state",
    classCode: String(meta.class_code ?? classCode),
    className: String(meta.class_name ?? classCode),
    gradeLevel,
    subject: meta.subject ? String(meta.subject) : undefined,
    studentIds,
    students,
    topicIds: topics.map((topic) => topic.topicId),
    topics,
    attemptMatrix,
    learnerCount: studentIds.length,
    topicCount: topics.length,
  };
}

async function loadSliceForClassFromAnalyticsApi(
  classCode: string
): Promise<ClassroomSliceResponse> {
  const matrixPayload = await postJson<MasteryMatrixResponse>(
    "/api/v1/mastery/matrix",
    { class_code: classCode }
  );

  if (!matrixPayload.success) {
    return {
      success: false,
      source: "error",
      mode: "live_state",
      studentIds: [],
      students: [],
      topicIds: [],
      topics: [],
      learnerCount: 0,
      topicCount: 0,
      error: matrixPayload.error ?? `Could not resolve class ${classCode}.`,
    };
  }

  const studentIds = matrixPayload.student_ids ?? [];
  const topicIds = matrixPayload.topic_ids ?? [];
  const gradeLevel = matrixPayload.grade_level;
  const catalog =
    typeof gradeLevel === "number"
      ? fallbackTopicCatalogForGrade(gradeLevel)
      : [];
  const catalogById = new Map(catalog.map((topic) => [topic.topicId, topic]));

  const students = buildStudentCatalog(studentIds);

  return {
    success: true,
    source: "analytics_api",
    mode: "live_state",
    classCode: matrixPayload.class_code ?? classCode,
    className: matrixPayload.class_name,
    gradeLevel: matrixPayload.grade_level,
    subject: matrixPayload.subject,
    studentIds,
    students,
    topicIds,
    topics: topicIds.map(
      (topicId) =>
        catalogById.get(topicId) ?? {
          topicId,
          curriculumTitle: topicId,
          pL0: 0.25,
          pT: 0.15,
          pG: 0.2,
          pS: 0.1,
        }
    ),
    attemptMatrix: {},
    learnerCount: studentIds.length,
    topicCount: topicIds.length,
  };
}

export async function GET(request: Request) {
  const classCode = new URL(request.url).searchParams
    .get("class_code")
    ?.trim()
    .toUpperCase();

  if (!classCode) {
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
        error: "class_code query parameter is required.",
      } satisfies ClassroomSliceResponse,
      { status: 400 }
    );
  }

  try {
    const slice = postgresConfigured()
      ? await loadSliceForClassFromPostgres(classCode)
      : await loadSliceForClassFromAnalyticsApi(classCode);

    if (!slice.success) {
      return NextResponse.json(slice, { status: slice.error ? 404 : 500 });
    }

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
