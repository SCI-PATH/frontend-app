"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useUserStore } from "@/store/useUserStore";
import type { UserRole } from "@/types";

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
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (role !== allowedRole) {
      router.replace(role === "educator" ? "/matrix" : "/dashboard");
    }
  }, [allowedRole, hasHydrated, isAuthenticated, role, router]);

  if (!hasHydrated || !isAuthenticated || role !== allowedRole) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-brand-text/60">
        Loading your workspace…
      </div>
    );
  }

  return children;
}
