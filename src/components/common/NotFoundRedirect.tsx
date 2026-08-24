"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { BASE_PATH } from "@/lib/auth-routes";

/**
 * Client redirect for unknown routes.
 * Avoids server `redirect()` in not-found.tsx — that triggers a Next.js/React
 * dev-only performance.measure bug ('NotFound' negative timestamp).
 */
export function NotFoundRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(BASE_PATH);
  }, [router]);

  return (
    <main className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-brand-text">
      <p className="text-sm text-brand-text/70">Page not found.</p>
      <p className="text-xs text-brand-text/50">Taking you home…</p>
    </main>
  );
}
