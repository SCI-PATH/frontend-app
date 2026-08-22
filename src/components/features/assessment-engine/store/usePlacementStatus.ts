"use client";

import { useEffect, useState } from "react";

import { fetchPlacementStatus } from "../api/amplitude";
import type { AmplitudeCategory } from "../types";
import { useAssessmentUser } from "./useAssessmentUser";

export type PlacementState =
  | { status: "idle" | "loading" }
  | {
      status: "ready";
      needsAmplitude: boolean;
      category: AmplitudeCategory | null;
    };

/**
 * Checks C2 initial-category for the logged-in student.
 * Fail-open: API errors → treat as needs Amplitude (home card stays usable).
 */
export function usePlacementStatus(): PlacementState {
  const { userId, role } = useAssessmentUser();
  const [state, setState] = useState<PlacementState>({ status: "idle" });

  useEffect(() => {
    if (role !== "student" || !userId) {
      setState({ status: "ready", needsAmplitude: false, category: null });
      return;
    }

    let cancelled = false;
    setState({ status: "loading" });

    void fetchPlacementStatus(userId).then((result) => {
      if (cancelled) return;
      setState({
        status: "ready",
        needsAmplitude: !result.completed,
        category: result.category,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [role, userId]);

  return state;
}
