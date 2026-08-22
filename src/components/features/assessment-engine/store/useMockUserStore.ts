"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { DEFAULT_MOCK_USER_ID, MOCK_USERS } from "../data/catalog";
import type { MockUser } from "../types";

/**
 * Temporary assessment-only mock user picker for Dev Hub / local testing.
 *
 * // TODO: INTEGRATION - Replace useMockUserStore with global useUserStore
 * once the auth team exposes session.user.id / role / grade / classCode.
 */
interface MockUserState {
  userId: string;
  setUserId: (userId: string) => void;
  activeUser: () => MockUser;
}

export const useMockUserStore = create<MockUserState>()(
  persist(
    (set, get) => ({
      userId: DEFAULT_MOCK_USER_ID,
      setUserId: (userId) => set({ userId }),
      activeUser: () => {
        const found = MOCK_USERS.find((u) => u.userId === get().userId);
        return found ?? MOCK_USERS[1];
      },
    }),
    { name: "assessment-engine-mock-user" }
  )
);

export function useActiveMockUser(): MockUser {
  const userId = useMockUserStore((s) => s.userId);
  return MOCK_USERS.find((u) => u.userId === userId) ?? MOCK_USERS[1];
}
