import type { GradeLevel, TeacherClass, User, UserRole } from "@/types";

import { getAuthApiBase } from "@/lib/api/auth-config";

type ApiStudentProfile = {
  grade: number;
  prev_year_science_marks?: number | null;
  learner_id?: string | null;
  class_code?: string | null;
  class_codes?: string[];
};

type ApiTeacherProfile = {
  grades_taught?: number[];
  class_sections?: string[];
  school_name?: string | null;
};

type ApiUser = {
  id: string;
  student_id?: string | null;
  full_name: string;
  email: string;
  role: "student" | "teacher";
  student?: ApiStudentProfile | null;
  teacher?: ApiTeacherProfile | null;
};

type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: ApiUser;
};

type SessionResponse = {
  authenticated: boolean;
  action: "login" | "none";
  user?: ApiUser | null;
};

async function requestJson<T>(
  path: string,
  init?: RequestInit,
  token?: string
): Promise<T> {
  const response = await fetch(`/user-api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.detail;
    let message = "User Management could not complete this request.";
    if (typeof detail === "string") {
      message = detail;
    } else if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      message = detail.message || detail.code || message;
    } else if (Array.isArray(detail) && detail.length) {
      const first = detail[0];
      message =
        typeof first === "string"
          ? first
          : first?.msg || first?.message || message;
    }
    throw new Error(message);
  }
  return payload as T;
}

function gradeLabel(grade?: number | null): GradeLevel | undefined {
  return grade && grade >= 6 && grade <= 9 ? (`Grade ${grade}` as GradeLevel) : undefined;
}

export function userFromApi(apiUser: ApiUser): User {
  const role: UserRole = apiUser.role === "teacher" ? "educator" : "student";
  const classCodes = (apiUser.student?.class_codes ?? [])
    .map((code) => String(code).trim().toUpperCase())
    .filter(Boolean);
  const classCode =
    String(apiUser.student?.class_code ?? "").trim().toUpperCase() ||
    classCodes[0] ||
    undefined;
  return {
    id: apiUser.student_id || apiUser.student?.learner_id || apiUser.id,
    name: apiUser.full_name,
    email: apiUser.email,
    role,
    ...(role === "student"
      ? {
          grade: gradeLabel(apiUser.student?.grade),
          classCodes,
        }
      : {
          sectionName: apiUser.teacher?.class_sections?.join(", ") || undefined,
          schoolName: apiUser.teacher?.school_name || undefined,
        }),
  };
}

export async function loginUser(email: string, password: string) {
  const response = await requestJson<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return { user: userFromApi(response.user), token: response.access_token };
}

export async function signupStudent(input: {
  fullName: string;
  email: string;
  password: string;
  grade: number;
  classCode?: string;
}) {
  const response = await requestJson<TokenResponse>("/auth/signup/student", {
    method: "POST",
    body: JSON.stringify({
      full_name: input.fullName,
      email: input.email,
      password: input.password,
      grade: input.grade,
      class_code: input.classCode?.trim() || null,
      prev_year_science_marks: null,
    }),
  });
  return { user: userFromApi(response.user), token: response.access_token };
}

export async function signupTeacher(input: {
  fullName: string;
  email: string;
  password: string;
  sectionName?: string;
  schoolName?: string;
  gradesTaught?: number[];
}) {
  const response = await requestJson<TokenResponse>("/auth/signup/teacher", {
    method: "POST",
    body: JSON.stringify({
      full_name: input.fullName,
      email: input.email,
      password: input.password,
      grades_taught: input.gradesTaught ?? [],
      class_sections: input.sectionName ? [input.sectionName] : [],
      school_name: input.schoolName?.trim() || null,
    }),
  });
  return { user: userFromApi(response.user), token: response.access_token };
}

export async function checkUserSession(token: string) {
  const response = await requestJson<SessionResponse>(
    "/auth/session",
    { method: "GET" },
    token
  );
  return {
    authenticated: response.authenticated,
    user: response.user ? userFromApi(response.user) : null,
  };
}

function normalizeTeacherClass(row: Record<string, unknown>): TeacherClass {
  return {
    class_code: String(row.class_code ?? "").trim().toUpperCase(),
    class_name: String(row.class_name ?? "Class"),
    grade_level: Number(row.grade_level ?? 0),
    subject: row.subject ? String(row.subject) : undefined,
    teacher_id: row.teacher_id ? String(row.teacher_id) : undefined,
    is_active:
      row.is_active === undefined ? true : Boolean(row.is_active),
  };
}

/** Teacher creates a class; User Management returns the generated class code. */
export async function createTeacherClass(
  token: string,
  input: { className: string; gradeLevel: number; subject?: string }
): Promise<TeacherClass> {
  const response = await requestJson<TeacherClass>(
    "/classes",
    {
      method: "POST",
      body: JSON.stringify({
        class_name: input.className.trim(),
        grade_level: input.gradeLevel,
        subject: input.subject?.trim() || "Science",
      }),
    },
    token
  );
  return normalizeTeacherClass(response as unknown as Record<string, unknown>);
}

/** Classes owned by the logged-in teacher (User Management API). */
export async function fetchTeacherClasses(token: string): Promise<TeacherClass[]> {
  const response = await requestJson<TeacherClass[] | { classes?: TeacherClass[] }>(
    "/classes/mine",
    { method: "GET" },
    token
  );
  const rows = Array.isArray(response)
    ? response
    : Array.isArray(response.classes)
      ? response.classes
      : [];
  return rows
    .map((row) =>
      normalizeTeacherClass(row as unknown as Record<string, unknown>)
    )
    .filter((row) => row.class_code.length > 0);
}

type ClassJoinApiResponse = {
  message: string;
  class_info: TeacherClass;
};

/** Learner enrolls with a teacher-issued class code (User Management `POST /classes/join`). */
export async function joinClass(
  token: string,
  classCode: string
): Promise<{ message: string; classInfo: TeacherClass }> {
  const response = await requestJson<ClassJoinApiResponse>(
    "/classes/join",
    {
      method: "POST",
      body: JSON.stringify({
        class_code: classCode.trim().toUpperCase(),
      }),
    },
    token
  );
  return {
    message: response.message,
    classInfo: normalizeTeacherClass(
      response.class_info as unknown as Record<string, unknown>
    ),
  };
}

/** Classes this learner is enrolled in (User Management `GET /classes/enrolled`). */
export async function fetchEnrolledClasses(token: string): Promise<TeacherClass[]> {
  const response = await requestJson<TeacherClass[] | { classes?: TeacherClass[] }>(
    "/classes/enrolled",
    { method: "GET" },
    token
  );
  const rows = Array.isArray(response)
    ? response
    : Array.isArray(response.classes)
      ? response.classes
      : [];
  return rows
    .map((row) =>
      normalizeTeacherClass(row as unknown as Record<string, unknown>)
    )
    .filter((row) => row.class_code.length > 0);
}
