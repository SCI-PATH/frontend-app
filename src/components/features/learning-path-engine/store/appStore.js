import { create } from "zustand";

const READ_ALOUD_KEY = "scipath.readAloudEnabled";

function loadReadAloudPreference() {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(READ_ALOUD_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Global student UI state (Zustand). Ready for dashboard/chat/game drawers.
 * Lesson content still arrives from FastAPI; this only holds session shell state.
 */
export const useAppStore = create((set) => ({
  role: "student", // student | teacher — mirror of route context, not auth
  userId: "demo-1",
  grade: 6,
  /** Student opt-in: when true, lesson steps are read aloud. */
  readAloudEnabled: false,
  setRole: (role) => set({ role }),
  setUserId: (userId) => set({ userId }),
  setGrade: (grade) => set({ grade: Number(grade) }),
  setReadAloudEnabled: (enabled) => {
    const on = Boolean(enabled);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(READ_ALOUD_KEY, on ? "1" : "0");
      }
    } catch {
      /* ignore storage errors */
    }
    set({ readAloudEnabled: on });
  },
  hydrateReadAloudPreference: () => {
    set({ readAloudEnabled: loadReadAloudPreference() });
  },
}));

/**
 * Prefer `@/store/useUserStore` for real auth/session.
 * This store is LPE session shell only (lesson chrome).
 */
