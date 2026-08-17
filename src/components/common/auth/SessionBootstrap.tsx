"use client";

import { useEffect, useRef } from "react";

import { checkUserSession } from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";

/** Revalidates the persisted User Management token after page refresh. */
export function SessionBootstrap() {
  const checkedToken = useRef<string | null>(null);
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const token = useUserStore((state) => state.accessToken);
  const login = useUserStore((state) => state.login);
  const clearSession = useUserStore((state) => state.clearSession);

  useEffect(() => {
    if (!hasHydrated || !token || checkedToken.current === token) return;
    checkedToken.current = token;
    void checkUserSession(token)
      .then((session) => {
        if (session.authenticated && session.user) {
          login(session.user, token);
        } else {
          clearSession();
        }
      })
      .catch(() => clearSession());
  }, [clearSession, hasHydrated, login, token]);

  return null;
}
