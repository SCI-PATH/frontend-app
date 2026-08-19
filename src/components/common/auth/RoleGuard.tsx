"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { homePathForRole, LOGIN_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";
import type { UserRole } from "@/types";

/**
 * User Management login is still in flux. In local `next dev`, skip the
 * redirect so /educator-home, /educator-analytics and /dashboard stay reachable. Set
 * NEXT_PUBLIC_ENFORCE_ROLE_GUARD=true to test the real login gate.
 */
const skipRoleGuard =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_ENFORCE_ROLE_GUARD !== "true";

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
    if (skipRoleGuard || !hasHydrated) return;
    if (!isAuthenticated) {
      router.replace(LOGIN_PATH);
      return;
    }
    if (role !== allowedRole) {
      router.replace(homePathForRole(role));
    }
  }, [allowedRole, hasHydrated, isAuthenticated, role, router]);

  if (skipRoleGuard) {
    return children;
  }

  if (!hasHydrated || !isAuthenticated || role !== allowedRole) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-brand-text/60">
        Loading your workspace…
      </div>
    );
  }

  return children;
}
