"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { NextQuestionResponse, QuizResults, ClientQuestionSnapshot } from "../types";

interface CustomQuizReviewState {
  sessionId: string;
  results: QuizResults;
  clientSnapshots: Record<string, ClientQuestionSnapshot>;
  expectedQuestionCount: number;
}

interface QuizSessionState {
  lastSessionId: string | null;
  setLastSessionId: (sessionId: string | null) => void;
  /** Restores custom-quiz results after navigation / refresh. */
  customQuizReview: CustomQuizReviewState | null;
  setCustomQuizReview: (review: CustomQuizReviewState | null) => void;
  clearCustomQuizReview: () => void;
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
      customQuizReview: null,
      setCustomQuizReview: (review) => set({ customQuizReview: review }),
      clearCustomQuizReview: () => set({ customQuizReview: null }),
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
      partialize: (state) => ({
        lastSessionId: state.lastSessionId,
        customQuizReview: state.customQuizReview,
      }),
    }
  )
);
