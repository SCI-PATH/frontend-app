import { create } from "zustand";

/**
 * Shared auth/session client state for SCI-PATH frontend-app.
 * Auth screens (when built) should call setSession / clearSession here.
 * Feature modules read userId, grade, role — do not invent parallel auth stores.
 */
export type UserRole = "student" | "teacher";

export type UserSession = {
  userId: string | null;
  fullName: string | null;
  email: string | null;
  role: UserRole | null;
  grade: number | null;
  accessToken: string | null;
};

type UserStore = UserSession & {
  setSession: (partial: Partial<UserSession>) => void;
  clearSession: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  userId: null,
  fullName: null,
  email: null,
  role: null,
  grade: null,
  accessToken: null,
  setSession: (partial) => set((s) => ({ ...s, ...partial })),
  clearSession: () =>
    set({
      userId: null,
      fullName: null,
      email: null,
      role: null,
      grade: null,
      accessToken: null,
    }),
}));
