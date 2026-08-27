"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  BASE_PATH,
  canRoleAccessPath,
  homePathForRole,
  isPublicPath,
} from "@/lib/auth-routes";
import {
  checkUserSession,
  UserManagementError,
} from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";

const RECHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Keeps the persisted User Management session honest:
 * - Protected URL without a token → landing
 * - Expired / revoked session → clear + landing
 * - Cross-role URL (student↔teacher) → that role's home
 * Re-checks on navigation, tab focus, and a short interval.
 */
export function SessionBootstrap() {
  const validatingRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const token = useUserStore((state) => state.accessToken);
  const role = useUserStore((state) => state.role);
  const isAuthenticated = useUserStore((state) => state.isAuthenticated);
  const login = useUserStore((state) => state.login);
  const clearSession = useUserStore((state) => state.clearSession);

  const bounceUnauthenticated = useCallback(() => {
    clearSession();
    if (!isPublicPath(pathname)) {
      router.replace(BASE_PATH);
    }
  }, [clearSession, pathname, router]);

  const enforceRoleForPath = useCallback(() => {
    if (!isAuthenticated || !role) return;
    if (canRoleAccessPath(role, pathname)) return;
    router.replace(homePathForRole(role));
  }, [isAuthenticated, pathname, role, router]);

  const validateSession = useCallback(async () => {
    if (!hasHydrated || validatingRef.current) return;

    if (!token) {
      if (!isPublicPath(pathname)) {
        router.replace(BASE_PATH);
      }
      return;
    }

    validatingRef.current = true;
    try {
      const session = await checkUserSession(token);
      if (session.authenticated && session.user) {
        const current = useUserStore.getState();
        const next = session.user;
        const changed =
          current.userId !== next.id ||
          current.role !== next.role ||
          current.fullName !== next.name ||
          current.email !== next.email ||
          current.user?.grade !== next.grade ||
          current.accessToken !== token;
        if (changed) {
          login(next, token);
        }
        if (!canRoleAccessPath(next.role, pathname)) {
          router.replace(homePathForRole(next.role));
        }
      } else {
        bounceUnauthenticated();
      }
    } catch (err: unknown) {
      if (isDefinitiveAuthFailure(err)) {
        bounceUnauthenticated();
      }
      // Network / proxy blips: keep local session; RoleGuard still blocks wrong role.
    } finally {
      validatingRef.current = false;
    }
  }, [
    bounceUnauthenticated,
    hasHydrated,
    login,
    pathname,
    router,
    token,
  ]);

  // Hydration + route change: no token on protected path, or role mismatch.
  useEffect(() => {
    if (!hasHydrated) return;

    if (!token) {
      if (!isPublicPath(pathname)) {
        router.replace(BASE_PATH);
      }
      return;
    }

    enforceRoleForPath();
    void validateSession();
  }, [
    enforceRoleForPath,
    hasHydrated,
    pathname,
    router,
    token,
    validateSession,
  ]);

  // Re-check when the tab becomes visible again (expired token while away).
  useEffect(() => {
    if (!hasHydrated || !token) return;

    function onVisibility() {
      if (document.visibilityState === "visible") {
        void validateSession();
      }
    }

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [hasHydrated, token, validateSession]);

  // Periodic re-check while the tab stays open.
  useEffect(() => {
    if (!hasHydrated || !token) return;

    const id = window.setInterval(() => {
      void validateSession();
    }, RECHECK_INTERVAL_MS);

    return () => window.clearInterval(id);
  }, [hasHydrated, token, validateSession]);

  return null;
}

function isDefinitiveAuthFailure(err: unknown): boolean {
  if (!(err instanceof UserManagementError)) return false;
  // Real UM auth rejection. Ignore 0 (network) and filter HTML 403s.
  return err.status === 401;
}
