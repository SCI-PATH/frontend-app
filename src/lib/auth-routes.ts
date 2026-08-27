import type { UserRole } from "@/types";

/** Public landing page (`http://localhost:3000/`). */
export const BASE_PATH = "/";

export const LOGIN_PATH = "/login";
export const REGISTER_PATH = "/register";

/** Student homepage — `StudentHome` at `/dashboard`. */
export const STUDENT_HOME_PATH = "/dashboard";

/** Educator workspace homepage at `/educator-home`. */
export const EDUCATOR_HOME_PATH = "/educator-home";

/** Educator analytics dashboard at `/educator-analytics`. */
export const EDUCATOR_DASHBOARD_PATH = "/educator-analytics";

/** Teacher class list + create-class at `/classrooms`. */
export const EDUCATOR_CLASSROOMS_PATH = "/classrooms";

/** Educator content-generation library. */
export const EDUCATOR_CONTENT_GENERATION_PATH = "/content-generation";

/** Educator question bank (Component 2 approve / reject / generate). */
export const EDUCATOR_QUESTION_GENERATION_PATH = "/assessment/question-bank";

/** Educator profile page at `/educator-profile`. */
export const EDUCATOR_PROFILE_PATH = "/educator-profile";

/** Student mastery / focus-areas profile. */
export const STUDENT_PROFILE_PATH = "/profile";

/** Student learning-path / chapter content. */
export const STUDENT_LEARNING_PATH = "/learning-path";

/** Student marker AR library (heart / kidney APKs). */
export const STUDENT_AR_LIBRARY_PATH = "/ar-library";

const PUBLIC_PATHS = new Set([BASE_PATH, LOGIN_PATH, REGISTER_PATH]);

function normalizePath(pathname: string | null | undefined): string {
  if (!pathname) return BASE_PATH;
  const trimmed = pathname.trim() || BASE_PATH;
  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
}

/** Paths anyone can open without a session. */
export function isPublicPath(pathname: string | null | undefined): boolean {
  return PUBLIC_PATHS.has(normalizePath(pathname));
}

export function homePathForRole(role: UserRole | null | undefined): string {
  return role === "educator" ? EDUCATOR_HOME_PATH : STUDENT_HOME_PATH;
}

/**
 * Which role may open this path.
 * `null` = public (or unknown — callers should treat unknown non-public as auth-required).
 */
export function requiredRoleForPath(
  pathname: string | null | undefined
): UserRole | "any" | null {
  const path = normalizePath(pathname);
  if (isPublicPath(path)) return null;

  // Educator-only (check before generic /assessment student routes).
  if (
    path === EDUCATOR_QUESTION_GENERATION_PATH ||
    path.startsWith(`${EDUCATOR_QUESTION_GENERATION_PATH}/`) ||
    path.startsWith("/educator") ||
    path.startsWith("/classroom") ||
    path.startsWith("/content-generation") ||
    path.startsWith("/question-generation") ||
    path.startsWith("/matrix") ||
    path.startsWith("/assessment-engine-dev-hub")
  ) {
    return "educator";
  }

  // Student-only.
  if (
    path.startsWith("/dashboard") ||
    path.startsWith("/learning-path") ||
    path.startsWith("/profile") ||
    path.startsWith("/tutor") ||
    path.startsWith("/assessment") ||
    path.startsWith("/ar-library")
  ) {
    return "student";
  }

  // Any other app page still needs a signed-in session.
  return "any";
}

/** True when a persisted session is allowed to view this path. */
export function canRoleAccessPath(
  role: UserRole | null | undefined,
  pathname: string | null | undefined
): boolean {
  const required = requiredRoleForPath(pathname);
  if (required === null) return true;
  if (!role) return false;
  if (required === "any") return true;
  return role === required;
}
