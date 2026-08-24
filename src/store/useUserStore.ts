import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { GradeLevel, User, UserRole } from "@/types";

/**
 * Shared auth/session client state for SCI-PATH frontend-app.
 * Auth screens call login/logout; learning-path screens also read
 * flattened fields (userId, fullName, grade, accessToken).
 */
type UserStore = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  userId: string | null;
  fullName: string | null;
  email: string | null;
  role: UserRole | null;
  grade: number | null;
  accessToken: string | null;
  /** Selected classroom for educator analytics (persisted). */
  activeClassCode: string | null;
  /** Student avatar choice keyed by user id (User Management has no avatar field). */
  studentAvatarByUserId: Record<string, string>;
  /** Teacher avatar choice keyed by user id. */
  teacherAvatarByUserId: Record<string, string>;
  hasHydrated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  setStudentAvatar: (userId: string, avatarId: string) => void;
  setTeacherAvatar: (userId: string, avatarId: string) => void;
  setSession: (partial: {
    user?: User | null;
    token?: string | null;
    userId?: string | null;
    fullName?: string | null;
    email?: string | null;
    role?: UserRole | null;
    grade?: number | null;
    accessToken?: string | null;
  }) => void;
  clearSession: () => void;
  setActiveClassCode: (classCode: string | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
};

function gradeLabelToNumber(grade?: GradeLevel): number | null {
  if (!grade) return null;
  const match = grade.match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

function sessionFromUser(user: User | null, token: string | null) {
  return {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    userId: user?.id ?? null,
    fullName: user?.name ?? null,
    email: user?.email ?? null,
    role: user?.role ?? null,
    grade: gradeLabelToNumber(user?.grade),
    accessToken: token,
  };
}

const emptySession = sessionFromUser(null, null);

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      ...emptySession,
      activeClassCode: null,
      studentAvatarByUserId: {},
      teacherAvatarByUserId: {},
      hasHydrated: false,
      login: (userData, token) =>
        set({ ...sessionFromUser(userData, token), hasHydrated: true }),
      logout: () =>
        set({ ...emptySession, activeClassCode: null, hasHydrated: true }),
      setStudentAvatar: (userId, avatarId) =>
        set((state) => {
          const id = userId.trim();
          if (!id) return state;
          return {
            studentAvatarByUserId: {
              ...state.studentAvatarByUserId,
              [id]: avatarId,
            },
          };
        }),
      setTeacherAvatar: (userId, avatarId) =>
        set((state) => {
          const id = userId.trim();
          if (!id) return state;
          return {
            teacherAvatarByUserId: {
              ...state.teacherAvatarByUserId,
              [id]: avatarId,
            },
          };
        }),
      setSession: (partial) =>
        set((state) => {
          const nextUser =
            partial.user !== undefined
              ? partial.user
              : state.user
                ? {
                    ...state.user,
                    ...(partial.userId !== undefined
                      ? { id: partial.userId || state.user.id }
                      : {}),
                    ...(partial.fullName !== undefined
                      ? { name: partial.fullName || state.user.name }
                      : {}),
                    ...(partial.email !== undefined
                      ? { email: partial.email || state.user.email }
                      : {}),
                    ...(partial.role !== undefined
                      ? { role: partial.role || state.user.role }
                      : {}),
                  }
                : state.user;
          const nextToken =
            partial.token !== undefined
              ? partial.token
              : partial.accessToken !== undefined
                ? partial.accessToken
                : state.token;
          const base = sessionFromUser(nextUser, nextToken);
          return {
            ...base,
            ...(partial.userId !== undefined ? { userId: partial.userId } : {}),
            ...(partial.fullName !== undefined ? { fullName: partial.fullName } : {}),
            ...(partial.email !== undefined ? { email: partial.email } : {}),
            ...(partial.role !== undefined ? { role: partial.role } : {}),
            ...(partial.grade !== undefined ? { grade: partial.grade } : {}),
            ...(partial.accessToken !== undefined
              ? { accessToken: partial.accessToken }
              : {}),
          };
        }),
      clearSession: () =>
        set({ ...emptySession, activeClassCode: null, hasHydrated: true }),
      setActiveClassCode: (classCode) =>
        set({ activeClassCode: classCode?.trim().toUpperCase() ?? null }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: "sci-path-user-session",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
        fullName: state.fullName,
        email: state.email,
        role: state.role,
        grade: state.grade,
        accessToken: state.accessToken,
        activeClassCode: state.activeClassCode,
        studentAvatarByUserId: state.studentAvatarByUserId,
        teacherAvatarByUserId: state.teacherAvatarByUserId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
