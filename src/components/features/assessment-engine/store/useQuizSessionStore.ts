"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface QuizSessionState {
  lastSessionId: string | null;
  setLastSessionId: (sessionId: string | null) => void;
}

export const useQuizSessionStore = create<QuizSessionState>()(
  persist(
    (set) => ({
      lastSessionId: null,
      setLastSessionId: (sessionId) => set({ lastSessionId: sessionId }),
    }),
    { name: "assessment-engine-last-session" }
  )
);
