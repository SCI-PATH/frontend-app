"use client";

import { useEffect } from "react";

import { revokeUserSession } from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";

/**
 * Farm logout lands here after Postgres has the in-progress farm.
 * Revoke the login token, clear this browser's session, then open `/`.
 */
export default function LogoutPage() {
  const token = useUserStore((state) => state.accessToken || state.token);
  const logout = useUserStore((state) => state.logout);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (token) await revokeUserSession(token);
      } catch {
        /* still clear the local session */
      }
      if (cancelled) return;
      logout();
      window.location.replace("/");
    })();
    return () => {
      cancelled = true;
    };
  }, [logout, token]);

  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center gap-2 px-4 text-brand-text">
      <p className="text-sm font-medium">Signing out…</p>
      <p className="text-xs text-brand-text/60">Your farm progress is saved.</p>
    </main>
  );
}
