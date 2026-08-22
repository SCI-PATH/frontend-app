"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { homePathForRole } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";

/** Sends an already-signed-in user to their role homepage. */
export function RedirectToHomeIfAuthenticated() {
  const router = useRouter();
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const role = useUserStore((state) => state.role);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    router.replace(homePathForRole(role));
  }, [hasHydrated, isAuthenticated, role, router]);

  return null;
}
