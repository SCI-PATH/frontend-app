"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { BASE_PATH, homePathForRole } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";
import type { UserRole } from "@/types";

/**
 * Protects student/educator route groups.
 * - No session → landing `/`
 * - Wrong role (student↔teacher URL) → that user's own home
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

  const allowed = Boolean(
    hasHydrated && isAuthenticated && role === allowedRole
  );

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated || !role) {
      router.replace(BASE_PATH);
      return;
    }

    if (role !== allowedRole) {
      router.replace(homePathForRole(role));
    }
  }, [allowedRole, hasHydrated, isAuthenticated, role, router]);

  if (!allowed) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-brand-text/60">
        Redirecting…
      </div>
    );
  }

  return children;
}
