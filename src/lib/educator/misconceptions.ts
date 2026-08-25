/** Error-category tags from the question engine — not misconception phrases. */
const ERROR_CATEGORY_LABELS = new Set([
  "near_miss",
  "near miss",
  "complete_miss",
  "complete miss",
  "misconception",
]);

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

/** True when `tag` is an actual wrong-idea phrase, not Near Miss / Complete Miss. */
export function isMisconceptionPhrase(tag: string | null | undefined): boolean {
  const normalized = normalizeLabel(tag ?? "");
  if (!normalized) return false;
  return !ERROR_CATEGORY_LABELS.has(normalized);
}
