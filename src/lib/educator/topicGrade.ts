export type MatrixGradeFilter = "all" | "6" | "7" | "8" | "9";

export const MATRIX_GRADE_FILTERS: readonly {
  value: MatrixGradeFilter;
  label: string;
}[] = [
  { value: "all", label: "All" },
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
  { value: "8", label: "Grade 8" },
  { value: "9", label: "Grade 9" },
];

export function topicMatchesGrade(
  topicId: string,
  filter: MatrixGradeFilter
): boolean {
  if (filter === "all") return true;
  return topicId.startsWith(`G${filter}_`);
}

export function filterTopicIdsByGrade(
  topicIds: readonly string[],
  filter: MatrixGradeFilter
): string[] {
  return topicIds.filter((topicId) => topicMatchesGrade(topicId, filter));
}

export function compactTopicLabel(topicId: string): string {
  const parts = topicId.split("_");
  if (parts.length >= 2) {
    return `${parts[0]}_${parts[1]}`;
  }
  return topicId.length > 10 ? `${topicId.slice(0, 10)}…` : topicId;
}
