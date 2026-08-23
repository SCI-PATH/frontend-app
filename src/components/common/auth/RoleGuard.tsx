"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { BASE_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";
import type { UserRole } from "@/types";

/**
 * Protects student/educator route groups.
 * Missing session, expired session (cleared elsewhere), or wrong role → landing `/`.
 */
export function RoleGuard({
  allowedRole,
  children,
}: {
  allowedRole: UserRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const role = useUserStore((state) => state.role);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated || role !== allowedRole) {
      router.replace(BASE_PATH);
    }
  }, [allowedRole, hasHydrated, isAuthenticated, role, router]);

  if (!hasHydrated || !isAuthenticated || role !== allowedRole) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-brand-text/60">
        Redirecting…
      </div>
    );
  }

  return children;
}
