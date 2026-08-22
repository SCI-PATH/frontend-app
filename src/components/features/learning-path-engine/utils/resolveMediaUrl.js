/** Turn /ar-media/... paths into absolute URLs for phone AR textures. */
export function resolveMediaUrl(pathOrUrl) {
  const s = (pathOrUrl || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin.replace(/\/$/, "")
      : "";
  if (s.startsWith("/")) return `${origin}${s}`;
  return `${origin}/${s}`;
}
