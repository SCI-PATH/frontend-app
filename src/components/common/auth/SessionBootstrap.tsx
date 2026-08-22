"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

import { BASE_PATH, isPublicPath } from "@/lib/auth-routes";
import { checkUserSession } from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";

/**
 * Revalidates the persisted User Management token after refresh / on interval.
 * Expired or revoked sessions clear local state and send the user to `/`.
 */
export function SessionBootstrap() {
  const checkedToken = useRef<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const token = useUserStore((state) => state.accessToken);
  const login = useUserStore((state) => state.login);
  const clearSession = useUserStore((state) => state.clearSession);

  useEffect(() => {
    if (!hasHydrated) return;

    function sendToBase() {
      clearSession();
      if (!isPublicPath(pathname)) {
        router.replace(BASE_PATH);
      }
    }

    if (!token) {
      if (!isPublicPath(pathname)) {
        router.replace(BASE_PATH);
      }
      return;
    }

    if (checkedToken.current === token) return;
    checkedToken.current = token;

    void checkUserSession(token)
      .then((session) => {
        if (session.authenticated && session.user) {
          login(session.user, token);
        } else {
          checkedToken.current = null;
          sendToBase();
        }
      })
      .catch(() => {
        checkedToken.current = null;
        sendToBase();
      });
  }, [clearSession, hasHydrated, login, pathname, router, token]);

  // Periodic re-check (session lasts ~6h; hourly is enough without hammering /auth/session).
  useEffect(() => {
    if (!hasHydrated || !token) return;

    const id = window.setInterval(() => {
      void checkUserSession(token)
        .then((session) => {
          if (!session.authenticated) {
            clearSession();
            if (!isPublicPath(pathname)) {
              router.replace(BASE_PATH);
            }
          }
        })
        .catch(() => {
          clearSession();
          if (!isPublicPath(pathname)) {
            router.replace(BASE_PATH);
          }
        });
    }, 60 * 60 * 1000);

    return () => window.clearInterval(id);
  }, [clearSession, hasHydrated, pathname, router, token]);

  return null;
}
