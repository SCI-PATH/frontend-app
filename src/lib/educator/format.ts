/** e.g. "Aug 17, 2026 · 9:27 AM" */
export function formatEducatorTimestamp(value: string | null | undefined): string {
  if (!value?.trim()) return "—";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  const datePart = parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timePart = parsed.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePart} · ${timePart}`;
}
