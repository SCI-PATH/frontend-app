export function buildMatrixCsv(
  matrix: Record<string, Record<string, number | null>>,
  studentIds: readonly string[],
  topicIds: readonly string[]
): string {
  const header = ["student_id", ...topicIds].join(",");
  const rows = studentIds.map((studentId) => {
    const cells = topicIds.map((topicId) => {
      const value = matrix[studentId]?.[topicId];
      if (value === null || value === undefined || Number.isNaN(value)) {
        return "";
      }
      return String(Math.round(value * 100));
    });
    return [studentId, ...cells].join(",");
  });
  return [header, ...rows].join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
