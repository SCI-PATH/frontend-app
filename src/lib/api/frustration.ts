import { API_BASE_URL } from "@/lib/api/config";
import { useUserStore } from "@/store/useUserStore";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function toUnitScore(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n > 1) return Math.max(0, Math.min(1, n / 100));
  return Math.max(0, Math.min(1, n));
}

/**
 * Sachini's per-student GET, via the Next.js rewrite to gaming-service.
 * Score is 0–100 (or null if none yet).
 */
export async function fetchGamingFrustration(studentId: string): Promise<{
  frustrationScore: number | null;
  frustrationLevel: string | null;
} | null> {
  const id = studentId.trim();
  if (!id) return null;

  const response = await fetch(
    `/api/engagement/frustration?studentId=${encodeURIComponent(id)}`,
    { headers: { Accept: "application/json" } }
  );
  const payload = asRecord(await response.json().catch(() => null));
  if (!response.ok || payload.ok === false || payload.skipped === true) {
    return null;
  }

  const raw = payload.frustrationScore ?? payload.frustration_score;
  if (raw == null || raw === "") {
    return {
      frustrationScore: null,
      frustrationLevel:
        typeof payload.frustrationLevel === "string"
          ? payload.frustrationLevel
          : typeof payload.frustration_level === "string"
            ? payload.frustration_level
            : null,
    };
  }

  return {
    frustrationScore: toUnitScore(raw),
    frustrationLevel:
      typeof payload.frustrationLevel === "string"
        ? payload.frustrationLevel
        : typeof payload.frustration_level === "string"
          ? payload.frustration_level
          : null,
  };
}

const recentCuePosts = new Map<string, number>();
const CUE_DEDUPE_MS = 10_000;

function isDuplicateCue(userId: string, score: number, source: string): boolean {
  const key = `${userId}|${source}|${score.toFixed(4)}`;
  const now = Date.now();
  const prev = recentCuePosts.get(key);
  if (prev != null && now - prev < CUE_DEDUPE_MS) return true;
  recentCuePosts.set(key, now);
  return false;
}

export async function postFrustrationCue(input: {
  userId: string;
  frustrationScore: number;
  source?: string;
}): Promise<boolean> {
  const source = input.source ?? "homepage_socrates_open";
  if (isDuplicateCue(input.userId, input.frustrationScore, source)) {
    return true;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/engagement/frustration-cue`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_id: input.userId,
      frustration_score: input.frustrationScore,
      source,
    }),
  });
  const payload = asRecord(await response.json().catch(() => null));
  return response.ok && payload.success !== false;
}

/**
 * Pull the student's latest farm frustration and store it for Socrates tone.
 * Safe to call on overlay / tutor open; no-ops if gaming has no snapshot yet.
 *
 * @param source Producer tag stored on the cue row
 * @param scoreOverride Optional 0–1 score from farm handoff URL (skips gaming GET)
 */
export async function syncHomepageFrustrationFromGaming(
  source = "homepage_socrates_open",
  scoreOverride?: number | null
): Promise<boolean> {
  const { userId } = useUserStore.getState();
  if (!userId) return false;

  let score =
    typeof scoreOverride === "number" && Number.isFinite(scoreOverride)
      ? Math.max(0, Math.min(1, scoreOverride > 1 ? scoreOverride / 100 : scoreOverride))
      : null;

  if (score == null) {
    const snapshot = await fetchGamingFrustration(userId);
    score = snapshot?.frustrationScore ?? null;
  }
  if (score == null) return false;

  return postFrustrationCue({
    userId,
    frustrationScore: score,
    source,
  });
}

/** Same as homepage sync; used when /tutor opens from the farm Ask Socrates button. */
export async function syncFarmFrustrationFromGaming(
  scoreOverride?: number | null
): Promise<boolean> {
  return syncHomepageFrustrationFromGaming(
    "gaming_socrates_unlock",
    scoreOverride
  );
}
