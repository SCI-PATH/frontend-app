import type { NextQuestionResponse } from "../types";
import { fetchNextQuestion as fetchNextQuestionRaw } from "./quizzes";

/**
 * Backend increments questions_asked on every GET /next. Remounts / duplicate
 * chunk instances must share one gate — use globalThis, not a module Map
 * (Next.js can load this file twice in separate client chunks).
 */
type Gate = {
  unanswered: NextQuestionResponse | null;
  inflight: Promise<NextQuestionResponse> | null;
};

type GateStore = Map<string, Gate>;

const GLOBAL_KEY = "__iaeAssessmentNextQuestionGate_v1";

function store(): GateStore {
  const g = globalThis as typeof globalThis & {
    [GLOBAL_KEY]?: GateStore;
  };
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = new Map();
  return g[GLOBAL_KEY]!;
}

function getGate(sessionId: string): Gate {
  const gates = store();
  let gate = gates.get(sessionId);
  if (!gate) {
    gate = { unanswered: null, inflight: null };
    gates.set(sessionId, gate);
  }
  return gate;
}

export function seedNextQuestion(
  sessionId: string,
  payload: NextQuestionResponse
) {
  const gate = getGate(sessionId);
  gate.unanswered = payload;
  gate.inflight = null;
}

export function peekNextQuestion(
  sessionId: string
): NextQuestionResponse | null {
  return getGate(sessionId).unanswered;
}

export function releaseNextQuestion(sessionId: string) {
  const gate = store().get(sessionId);
  if (!gate) return;
  gate.unanswered = null;
  gate.inflight = null;
}

export function clearNextQuestionGate(sessionId: string) {
  store().delete(sessionId);
}

/**
 * Deduped /next. Without force, returns cached unanswered payload.
 * After /answer, call releaseNextQuestion then fetch with force:true.
 */
export async function fetchNextQuestionGuarded(
  sessionId: string,
  opts?: { force?: boolean }
): Promise<NextQuestionResponse> {
  const gate = getGate(sessionId);
  const force = opts?.force === true;

  if (!force && gate.unanswered) {
    return gate.unanswered;
  }
  if (!force && gate.inflight) {
    return gate.inflight;
  }
  // force: ignore unanswered; still join in-flight force fetch if any
  if (force && gate.inflight) {
    return gate.inflight;
  }

  const promise = fetchNextQuestionRaw(sessionId)
    .then((data) => {
      gate.unanswered = data;
      gate.inflight = null;
      return data;
    })
    .catch((err) => {
      gate.inflight = null;
      throw err;
    });

  gate.inflight = promise;
  return promise;
}
