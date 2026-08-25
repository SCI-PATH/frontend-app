"use client";

import { useCallback, useEffect } from "react";

import { fetchEnrolledClasses } from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";

let enrolledFetchInFlight: Promise<void> | null = null;

/** Load `/classes/enrolled` once per session refresh; Navbar and home share the store. */
export function useEnrolledClasses() {
  const token = useUserStore((state) => state.token);
  const enrolledClasses = useUserStore((state) => state.enrolledClasses);
  const setEnrolledClasses = useUserStore((state) => state.setEnrolledClasses);

  const refresh = useCallback(async () => {
    if (!token) {
      setEnrolledClasses([]);
      return;
    }

    if (enrolledFetchInFlight) {
      await enrolledFetchInFlight;
      return;
    }

    enrolledFetchInFlight = (async () => {
      try {
        const rows = await fetchEnrolledClasses(token);
        if (rows.length > 0) {
          setEnrolledClasses(rows);
        }
      } catch {
        // Keep any class already stored (e.g. just joined).
      }
    })().finally(() => {
      enrolledFetchInFlight = null;
    });

    await enrolledFetchInFlight;
  }, [setEnrolledClasses, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    enrolledClasses,
    primaryClass: enrolledClasses[0] ?? null,
    refresh,
  };
}
