import { API_PREFIX, assessmentFetch } from "./client";
import type { AnalyzeResponse, SessionDetail, SessionSummary } from "../types";

export async function fetchStudentSessions(studentId: string) {
  const data = await assessmentFetch<
    SessionSummary[] | { sessions: SessionSummary[] }
  >(`${API_PREFIX}/students/${encodeURIComponent(studentId)}/sessions`);
  return Array.isArray(data) ? data : data.sessions ?? [];
}

export async function fetchSessionDetail(studentId: string, sessionId: string) {
  return assessmentFetch<SessionDetail>(
    `${API_PREFIX}/students/${encodeURIComponent(studentId)}/sessions/${encodeURIComponent(sessionId)}`
  );
}

export async function analyzeSession(studentId: string, sessionId: string) {
  return assessmentFetch<AnalyzeResponse>(
    `${API_PREFIX}/student/${encodeURIComponent(studentId)}/sessions/${encodeURIComponent(sessionId)}/analyze`,
    { method: "POST" }
  );
}
