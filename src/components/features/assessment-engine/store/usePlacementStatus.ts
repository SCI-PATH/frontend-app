"use client";

import { useEffect, useState } from "react";

import { fetchPlacementStatus } from "../api/amplitude";
import type { AmplitudeCategory } from "../types";
import { useAssessmentUser } from "./useAssessmentUser";
import { useUserStore } from "@/store/useUserStore";

export type PlacementState =
  | { status: "idle" | "loading" }
  | {
      status: "ready";
      needsAmplitude: boolean;
      category: AmplitudeCategory | null;
      /** IAE placement check timed out or failed — fail-open for quiz routes. */
      unreachable?: boolean;
    };

/** True when Amplitude placement is finished (student has an IAE category). */
export function isPlacementComplete(state: PlacementState): boolean {
  if (state.status !== "ready") return false;
  if (state.unreachable) return true;
  return !state.needsAmplitude;
}

/**
 * Checks IAE initial-category for the logged-in student.
 * New / unknown students → needsAmplitude until IAE returns a category.
 */
export function usePlacementStatus(): PlacementState {
  const { userId, role, isAuthenticated } = useAssessmentUser();
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const [state, setState] = useState<PlacementState>({ status: "idle" });

  useEffect(() => {
    if (!hasHydrated) {
      setState({ status: "loading" });
      return;
    }

    if (role !== "student" || !isAuthenticated) {
      setState({ status: "ready", needsAmplitude: false, category: null });
      return;
    }

    if (!userId) {
      setState({ status: "ready", needsAmplitude: true, category: null });
      return;
    }

    let cancelled = false;

    async function load() {
      setState({ status: "loading" });
      const result = await fetchPlacementStatus(userId);
      if (cancelled) return;
      setState({
        status: "ready",
        needsAmplitude: !result.completed,
        category: result.category,
        unreachable: result.unreachable,
      });
    }

    void load();

    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [role, userId, hasHydrated, isAuthenticated]);

  return state;
}
