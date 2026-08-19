import type { GradeLevel, User, UserRole } from "@/types";

type ApiStudentProfile = {
  grade: number;
  prev_year_science_marks?: number | null;
};

type ApiTeacherProfile = {
  grades_taught?: number[];
  class_sections?: string[];
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

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/user-api${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = payload?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message || "User Management could not complete this request.";
    throw new Error(message);
  }
  return payload as T;
}

function gradeLabel(grade?: number | null): GradeLevel | undefined {
  return grade && grade >= 6 && grade <= 9 ? (`Grade ${grade}` as GradeLevel) : undefined;
}

export function userFromApi(apiUser: ApiUser): User {
  const role: UserRole = apiUser.role === "teacher" ? "educator" : "student";
  return {
    id: apiUser.student_id || apiUser.id,
    name: apiUser.full_name,
    email: apiUser.email,
    role,
    ...(role === "student"
      ? { grade: gradeLabel(apiUser.student?.grade) }
      : {
          sectionName: apiUser.teacher?.class_sections?.join(", ") || undefined,
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
}) {
  const response = await requestJson<TokenResponse>("/auth/signup/teacher", {
    method: "POST",
    body: JSON.stringify({
      full_name: input.fullName,
      email: input.email,
      password: input.password,
      grades_taught: [],
      class_sections: input.sectionName ? [input.sectionName] : [],
    }),
  });
  return { user: userFromApi(response.user), token: response.access_token };
}

export async function checkUserSession(token: string) {
  const response = await requestJson<SessionResponse>("/auth/session", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return {
    authenticated: response.authenticated,
    user: response.user ? userFromApi(response.user) : null,
  };
}
