/**
 * Same-origin in browser (Next rewrites → FastAPI).
 * Optional full origin: NEXT_PUBLIC_API_BASE=http://127.0.0.1:8000
 *
 * Errors expose safe messages for UI; technical body stays in console via notifyUserFacingError.
 */
import { isTechnicalErrorText, isOfflineError } from "../errors.js";

const apiBase =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE
    ? process.env.NEXT_PUBLIC_API_BASE
    : ""
  ).replace(/\/$/, "");

function friendlyFromHttp(status, rawText, data) {
  const detail = data?.detail;
  let candidate =
    typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((d) => d?.msg || "").filter(Boolean).join("; ")
        : typeof data?.message === "string"
          ? data.message
          : "";

  // Map common backend technical lines to product copy
  if (/Unknown lesson_id|Unknown topic|Unknown content_id/i.test(candidate || rawText || "")) {
    return "That chapter could not be found. Pick one from the list.";
  }
  if (/Chroma collection missing|ingest\.py/i.test(candidate || rawText || "")) {
    return "Lesson content is not available yet. Ask your teacher to check setup.";
  }
  if (/GROQ_API_KEY|XAI_API_KEY|GROK_API_KEY|API key/i.test(candidate || rawText || "")) {
    return "Generation is not available right now. Ask your teacher to check setup.";
  }
  if (/AR generation failed|No AR asset|No generated topic/i.test(candidate || "")) {
    return "Diagrams are not ready for this topic yet.";
  }

  if (candidate && !isTechnicalErrorText(candidate)) {
    return candidate.trim();
  }

  if (status === 404) return "That content could not be found.";
  if (status === 422) return "Some of the request details look invalid. Check and try again.";
  if (status === 401 || status === 403) return "You don’t have permission for that action.";
  if (status >= 500) return "The learning service hit a problem. Please try again in a moment.";
  if (status === 0 || !status) return "We could not reach the learning service. Is the server running?";
  return "Something went wrong. Please try again.";
}

async function fetchJson(path, options) {
  const url = `${apiBase}${path}`;
  let res;
  try {
    res = await fetch(url, options);
  } catch (err) {
    const e = new Error(
      isOfflineError(err)
        ? "We could not reach the learning service. Check your connection and that the server is running, then try again."
        : "Something went wrong. Please try again.",
    );
    e.cause = err;
    e.status = 0;
    throw e;
  }

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    if (!res.ok) {
      const e = new Error(friendlyFromHttp(res.status, text, null));
      e.status = res.status;
      e.raw = text?.slice?.(0, 500);
      throw e;
    }
    const e = new Error("Unexpected response from the learning service.");
    e.status = res.status;
    throw e;
  }

  if (!res.ok) {
    const e = new Error(friendlyFromHttp(res.status, text, data));
    e.status = res.status;
    e.payload = data;
    throw e;
  }
  return data;
}

export function postAnalyticsProfile({ user_id, profile, source, lesson_id, grade } = {}) {
  return fetchJson("/analytics/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id,
      profile,
      source: source || "learner_profile_analytics",
      lesson_id: lesson_id || null,
      grade: grade ?? null,
    }),
  });
}

export function getAnalyticsProfile(userId) {
  return fetchJson(`/analytics/profile/${encodeURIComponent(userId)}`);
}

/** @deprecated Prefer postAnalyticsProfile with weak|average|strong|smart */
export function postAnalyticsMastery({ user_id, mastery_score, source, lesson_id } = {}) {
  return fetchJson("/analytics/mastery", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id,
      mastery_score,
      source: source || "learner_profile_analytics",
      lesson_id: lesson_id || null,
    }),
  });
}

/** @deprecated Prefer getAnalyticsProfile */
export function getAnalyticsMastery(userId) {
  return fetchJson(`/analytics/mastery/${encodeURIComponent(userId)}`);
}

export function postLesson(body) {
  return fetchJson("/lesson", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function teacherGenerate(body) {
  return fetchJson("/teacher/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function teacherPublish(body) {
  return fetchJson("/teacher/library", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getTeacherLibrary({ grade, profile, lesson_id, event } = {}) {
  const q = new URLSearchParams();
  if (grade != null && grade !== "") q.set("grade", String(grade));
  if (profile) q.set("profile", profile);
  if (lesson_id) q.set("lesson_id", lesson_id);
  if (event) q.set("event", event);
  const qs = q.toString();
  return fetchJson(`/teacher/library${qs ? `?${qs}` : ""}`);
}

export function updateTeacherLibrary(contentId, body) {
  return fetchJson(`/teacher/library/${encodeURIComponent(contentId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteTeacherLibrary(contentId) {
  return fetchJson(`/teacher/library/${encodeURIComponent(contentId)}`, {
    method: "DELETE",
  });
}

export function regenerateTeacherLibrary(contentId, teacherId = "teacher-1") {
  const q = new URLSearchParams({ teacher_id: teacherId });
  return fetchJson(`/teacher/library/${encodeURIComponent(contentId)}/regenerate?${q}`, {
    method: "POST",
  });
}

export function getCurriculum(grade) {
  const q = grade != null ? `?grade=${encodeURIComponent(grade)}` : "";
  return fetchJson(`/curriculum${q}`);
}

export function getProgress(userId) {
  const q = new URLSearchParams({ user_id: userId });
  return fetchJson(`/progress?${q}`);
}

export function postProgress(body) {
  return fetchJson("/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getCurrentLesson(userId) {
  const q = new URLSearchParams({ user_id: userId });
  return fetchJson(`/lesson/current?${q}`);
}

export function getHealth() {
  return fetchJson("/health");
}

export function getLessonAr(lessonId, { force = false, generate = false } = {}) {
  const q = new URLSearchParams();
  if (force) q.set("force", "true");
  if (generate) q.set("generate", "true");
  const qs = q.toString();
  return fetchJson(`/lesson/${encodeURIComponent(lessonId)}/ar${qs ? `?${qs}` : ""}`);
}

export function regenerateTeacherAr(lessonId) {
  return fetchJson(`/teacher/ar/${encodeURIComponent(lessonId)}/regenerate`, {
    method: "POST",
  });
}

export function getTeacherAr({ grade } = {}) {
  const q = new URLSearchParams();
  if (grade != null && grade !== "") q.set("grade", String(grade));
  const qs = q.toString();
  return fetchJson(`/teacher/ar${qs ? `?${qs}` : ""}`);
}

export function putTeacherAr(lessonId, body) {
  return fetchJson(`/teacher/ar/${encodeURIComponent(lessonId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function deleteTeacherAr(lessonId) {
  return fetchJson(`/teacher/ar/${encodeURIComponent(lessonId)}`, {
    method: "DELETE",
  });
}

export function getLessonMedia(lessonId, { preview = false } = {}) {
  const q = preview ? "?preview=true" : "";
  return fetchJson(`/lesson/${encodeURIComponent(lessonId)}/media${q}`);
}

export function getTeacherLessonMedia(lessonId) {
  return fetchJson(`/teacher/media/${encodeURIComponent(lessonId)}`);
}

export function putTeacherLessonYoutube(lessonId, { youtube_url, teacher_id = "teacher-1" } = {}) {
  return fetchJson(`/teacher/media/${encodeURIComponent(lessonId)}/youtube`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ youtube_url: youtube_url || "", teacher_id }),
  });
}

export function putTeacherLessonVideos(lessonId, { videos, teacher_id = "teacher-1" } = {}) {
  return fetchJson(`/teacher/media/${encodeURIComponent(lessonId)}/videos`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videos: Array.isArray(videos) ? videos : [], teacher_id }),
  });
}

export function generateTeacherLessonSummary(lessonId, teacherId = "teacher-1") {
  const q = new URLSearchParams({ teacher_id: teacherId });
  return fetchJson(
    `/teacher/media/${encodeURIComponent(lessonId)}/summary/generate?${q}`,
    { method: "POST" },
  );
}

export function approveTeacherLessonSummary(lessonId, teacherId = "teacher-1") {
  const q = new URLSearchParams({ teacher_id: teacherId });
  return fetchJson(`/teacher/media/${encodeURIComponent(lessonId)}/summary/approve?${q}`, {
    method: "POST",
  });
}

export function addTeacherLessonImage(lessonId, { image_url, caption = "", teacher_id = "teacher-1" } = {}) {
  return fetchJson(`/teacher/media/${encodeURIComponent(lessonId)}/images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url, caption, teacher_id }),
  });
}

export function uploadTeacherLessonImage(lessonId, { file, caption = "", teacher_id = "teacher-1" } = {}) {
  const body = new FormData();
  body.append("file", file);
  body.append("caption", caption);
  body.append("teacher_id", teacher_id);
  return fetchJson(`/teacher/media/${encodeURIComponent(lessonId)}/images/upload`, {
    method: "POST",
    body,
  });
}

export function deleteTeacherLessonImage(lessonId, imageId) {
  return fetchJson(
    `/teacher/media/${encodeURIComponent(lessonId)}/images/${encodeURIComponent(imageId)}`,
    { method: "DELETE" },
  );
}

// Topic-level AR packs (teacher-approved, generalized diagrams)
export function getTeacherTopicArPacks() {
  return fetchJson("/teacher/ar-topics");
}

export function getTeacherTopicAr(topicKey) {
  return fetchJson(`/teacher/ar-topic/${encodeURIComponent(topicKey)}`);
}

export function generateTeacherTopicAr(topicKey) {
  return fetchJson(`/teacher/ar-topic/${encodeURIComponent(topicKey)}/generate`, {
    method: "POST",
  });
}

export function approveTeacherTopicAr(topicKey) {
  return fetchJson(`/teacher/ar-topic/${encodeURIComponent(topicKey)}/approve`, {
    method: "POST",
  });
}
