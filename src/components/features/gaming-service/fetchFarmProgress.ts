export type FarmProgressSnapshot = {
  found: boolean;
  studentId: string;
  currentLevel: number;
  highestCompletedLevel: number;
  cash: number;
  isReturning: boolean;
};

export function getGamingApiBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_GAMING_API_URL?.trim() ||
    // Same default as gaming-service Vite `/api` proxy (engagement DB).
    "http://3.6.20.31:8002";
  return raw.replace(/\/+$/, "");
}

function emptyProgress(studentId: string): FarmProgressSnapshot {
  return {
    found: false,
    studentId,
    currentLevel: 1,
    highestCompletedLevel: 0,
    cash: 0,
    isReturning: false,
  };
}

function fromPayload(
  id: string,
  data: Partial<FarmProgressSnapshot> & {
    you?: { currentLevel?: number; studentId?: string } | null;
  },
): FarmProgressSnapshot | null {
  const you = data.you;
  const currentLevel = Math.max(
    1,
    Number(data.currentLevel ?? you?.currentLevel) || 1,
  );
  const highestCompletedLevel = Math.max(
    0,
    Number(data.highestCompletedLevel) || 0,
  );
  const found =
    data.found === true ||
    Boolean(you?.studentId) ||
    currentLevel > 1 ||
    highestCompletedLevel > 0;
  if (!found && currentLevel <= 1) return null;
  return {
    found,
    studentId: data.studentId || you?.studentId || id,
    currentLevel,
    highestCompletedLevel,
    cash: Math.max(0, Number(data.cash) || 0),
    isReturning:
      data.isReturning === true ||
      currentLevel > 1 ||
      highestCompletedLevel > 0,
  };
}

/** Current farm level for this student. Falls back to level 1 if none. */
export async function fetchFarmProgress(
  studentId: string,
): Promise<FarmProgressSnapshot> {
  const id = String(studentId || "").trim();
  if (!id) return emptyProgress("");

  const base = getGamingApiBaseUrl();
  const headers = { Accept: "application/json" };

  try {
    const studentRes = await fetch(
      `${base}/api/engagement/student?studentId=${encodeURIComponent(id)}`,
      { headers },
    );
    const studentData = (await studentRes.json().catch(() => ({}))) as Partial<FarmProgressSnapshot> & {
      ok?: boolean;
    };
    if (studentRes.ok && studentData?.ok !== false) {
      const parsed = fromPayload(id, studentData);
      if (parsed) return parsed;
      if (studentData.found === false) return emptyProgress(id);
    }
  } catch {
    /* try leaderboard next — live API may not have /student yet */
  }

  try {
    const boardRes = await fetch(
      `${base}/api/engagement/leaderboard?studentId=${encodeURIComponent(id)}&limit=1`,
      { headers },
    );
    const boardData = (await boardRes.json().catch(() => ({}))) as {
      ok?: boolean;
      you?: { currentLevel?: number; studentId?: string } | null;
    };
    if (boardRes.ok && boardData?.ok !== false) {
      return fromPayload(id, boardData) || emptyProgress(id);
    }
  } catch {
    /* ignore */
  }

  return emptyProgress(id);
}
