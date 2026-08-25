"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { NextQuestionResponse } from "../types";

interface QuizSessionState {
  lastSessionId: string | null;
  setLastSessionId: (sessionId: string | null) => void;
  /**
   * In-memory cache of the unanswered /next payload (survives QuizPlayer
   * Fast Refresh better than a module-level Map alone). Not persisted.
   */
  pendingNextBySession: Record<string, NextQuestionResponse>;
  setPendingNext: (
    sessionId: string,
    payload: NextQuestionResponse | null
  ) => void;
}

export const useQuizSessionStore = create<QuizSessionState>()(
  persist(
    (set, get) => ({
      lastSessionId: null,
      setLastSessionId: (sessionId) => set({ lastSessionId: sessionId }),
      pendingNextBySession: {},
      setPendingNext: (sessionId, payload) => {
        const current = get().pendingNextBySession;
        if (payload == null) {
          if (!(sessionId in current)) return;
          const next = { ...current };
          delete next[sessionId];
          set({ pendingNextBySession: next });
          return;
        }
        set({
          pendingNextBySession: { ...current, [sessionId]: payload },
        });
      },
    }),
    {
      name: "assessment-engine-last-session",
      // Never persist question payloads — only lastSessionId.
      partialize: (state) => ({ lastSessionId: state.lastSessionId }),
    }
  )
);
