import type { ClassroomStudentMeta } from "@/types/educator";

/** Human-readable fallback when no roster name exists in Postgres. */
export function formatLearnerIdFallback(learnerId: string): string {
  const trimmed = learnerId.trim();
  const userMatch = /^user_(\d+)$/i.exec(trimmed);
  if (userMatch) {
    return `Learner ${Number.parseInt(userMatch[1], 10)}`;
  }
  const studentMatch = /^student_(\d+)$/i.exec(trimmed);
  if (studentMatch) {
    return `Student ${Number.parseInt(studentMatch[1], 10)}`;
  }
  return trimmed.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function normalizeStudentCatalog(
  studentIds: readonly string[],
  rawStudents: unknown
): ClassroomStudentMeta[] {
  if (!Array.isArray(rawStudents) || rawStudents.length === 0) {
    return buildStudentCatalog(studentIds);
  }

  const roster = rawStudents
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const learnerId = String(record.learnerId ?? record.learner_id ?? "").trim();
      const displayName = String(
        record.displayName ?? record.display_name ?? ""
      ).trim();
      if (!learnerId) return null;
      return {
        learnerId,
        displayName: displayName || formatLearnerIdFallback(learnerId),
      };
    })
    .filter((entry): entry is ClassroomStudentMeta => entry !== null);

  return buildStudentCatalog(studentIds.length > 0 ? studentIds : roster.map((s) => s.learnerId), roster);
}

export function buildStudentCatalog(
  studentIds: readonly string[],
  roster: readonly ClassroomStudentMeta[] = []
): ClassroomStudentMeta[] {
  const rosterById = new Map(
    roster.map((entry) => [entry.learnerId, entry.displayName])
  );

  return studentIds.map((learnerId) => ({
    learnerId,
    displayName:
      rosterById.get(learnerId)?.trim() ||
      formatLearnerIdFallback(learnerId),
  }));
}

export function getStudentDisplayName(
  learnerId: string,
  students: readonly ClassroomStudentMeta[] = []
): string {
  return (
    students.find((student) => student.learnerId === learnerId)?.displayName ??
    formatLearnerIdFallback(learnerId)
  );
}
