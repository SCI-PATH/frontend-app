"use client";

import { useUserStore } from "@/store/useUserStore";
import type { UserRole } from "@/types";

export interface AssessmentUser {
  userId: string;
  displayName: string;
  role: UserRole;
  grade?: number;
  classCode?: string;
  isAuthenticated: boolean;
}

/** Maps the shared auth session into assessment-engine screen props. */
export function useAssessmentUser(): AssessmentUser {
  const userId = useUserStore((s) => s.userId);
  const fullName = useUserStore((s) => s.fullName);
  const role = useUserStore((s) => s.role);
  const grade = useUserStore((s) => s.grade);
  const user = useUserStore((s) => s.user);
  const activeClassCode = useUserStore((s) => s.activeClassCode);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const resolvedRole = role ?? "student";

  return {
    userId: userId ?? "",
    displayName: fullName ?? user?.name ?? "User",
    role: resolvedRole,
    grade: grade ?? undefined,
    classCode:
      resolvedRole === "educator"
        ? activeClassCode ?? undefined
        : user?.classCode ?? undefined,
    isAuthenticated,
  };
}
