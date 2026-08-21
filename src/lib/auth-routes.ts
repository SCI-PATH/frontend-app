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

/** Educator question-generation placeholder. */
export const EDUCATOR_QUESTION_GENERATION_PATH = "/question-generation";

const PUBLIC_PATHS = new Set([BASE_PATH, LOGIN_PATH, REGISTER_PATH]);

/** Paths anyone can open without a session. */
export function isPublicPath(pathname: string | null | undefined): boolean {
  if (!pathname) return true;
  return PUBLIC_PATHS.has(pathname);
}

export function homePathForRole(role: UserRole | null | undefined): string {
  return role === "educator" ? EDUCATOR_HOME_PATH : STUDENT_HOME_PATH;
}
