/**
 * User-facing error surface: generic modal + private logging (browser console + POST /client-log).
 * Never put API URLs, HTML, stack traces, or raw FastAPI dumps into UI text.
 */

const apiBase =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_BASE
    ? process.env.NEXT_PUBLIC_API_BASE
    : ""
  ).replace(/\/$/, "");

/** @type {(open: boolean) => void} */
let setModalOpen = () => {};

/** @type {{ kind: 'generic' | 'offline' } | null} */
let lastKind = null;

const GENERIC_MSG = "Something went wrong. Please try again in a moment.";
const OFFLINE_MSG =
  "We could not reach the learning service. Check your connection and that the server is running, then try again.";

export function registerUserErrorModal(setter) {
  setModalOpen = setter;
}

export function getLastErrorKind() {
  return lastKind;
}

/**
 * True if the string looks like technical/backend noise (must not show in UI).
 * @param {string} s
 */
export function isTechnicalErrorText(s) {
  const t = String(s || "").trim();
  if (!t) return true;
  if (t.length > 220) return true;
  if (/https?:\/\//i.test(t)) return true;
  if (/www\./i.test(t)) return true;
  if (/<!DOCTYPE|<html|<body|Traceback|ECONNREFUSED|ENOTFOUND|Failed to fetch|NetworkError|fetch failed/i.test(t))
    return true;
  if (/Internal Server Error|uvicorn|fastapi|SQLAlchemy|psycopg|sqlite3\.|File \"/i.test(t)) return true;
  if (/status code|HTTP\/1\.|TypeError|ReferenceError|SyntaxError/i.test(t)) return true;
  // JSON dumps / FastAPI validation arrays
  if ((t.startsWith("{") || t.startsWith("[")) && t.length > 40) return true;
  if (/\/(lesson|teacher|curriculum|progress|health|api)\//i.test(t)) return true;
  return false;
}

/**
 * Map any error to short, safe, student/teacher-facing copy.
 * @param {unknown} error
 * @param {{ offline?: boolean; fallback?: string }} [opts]
 */
export function toUserFacingMessage(error, opts = {}) {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : error == null
          ? ""
          : String(error);

  const offline =
    opts.offline === true ||
    /Failed to fetch|ECONNREFUSED|NetworkError|fetch failed|Load failed|network/i.test(raw);

  if (offline) return OFFLINE_MSG;

  if (!raw || isTechnicalErrorText(raw)) {
    return opts.fallback || GENERIC_MSG;
  }

  // Trust only short plain product copy from our own backend
  return raw.trim();
}

export function isOfflineError(error) {
  const raw = error instanceof Error ? error.message : String(error ?? "");
  return /Failed to fetch|ECONNREFUSED|NetworkError|fetch failed|Load failed|network/i.test(raw);
}

/**
 * @param {unknown} error
 * @param {string} context
 * @param {{ userId?: string; offline?: boolean; componentStack?: string }} [options]
 */
export function notifyUserFacingError(error, context, options = {}) {
  const { userId, offline = false, componentStack } = options;
  const offlineFinal = offline || isOfflineError(error);
  lastKind = offlineFinal ? "offline" : "generic";

  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const detail =
    error instanceof Error && error.stack ? error.stack.slice(0, 4000) : String(error ?? "");

  // Log technical detail privately — never rely on the modal for this
  console.error("[LearningPath client error]", { context, message, error });

  const payload = {
    context: String(context || "unknown").slice(0, 120),
    message: message.slice(0, 2000),
    detail: detail.slice(0, 8000),
    user_id: userId ?? null,
    offline: offlineFinal,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 512) : "",
    component_stack: componentStack ? componentStack.slice(0, 8000) : null,
  };

  void fetch(`${apiBase}/client-log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* Logging must never throw */
  });

  setModalOpen(true);
}

export function clearErrorKind() {
  lastKind = null;
}
