"use client";

import { useEffect, useRef, useState } from "react";

import { fetchTeacherClasses } from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";

const VALID_GRADES = [6, 7, 8, 9] as const;

function normalizeGrade(value: number | null | undefined): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const g = Math.round(value);
  return VALID_GRADES.includes(g as (typeof VALID_GRADES)[number]) ? g : null;
}

/** Default grade for question-bank filters (educator: profile → active class → 7). */
export function defaultQuestionBankGrade(input: {
  activeClassGrade?: number | null;
  gradesTaught?: number[];
  sessionGrade?: number | null;
}): number {
  return (
    normalizeGrade(input.gradesTaught?.[0]) ??
    normalizeGrade(input.activeClassGrade) ??
    normalizeGrade(input.sessionGrade) ??
    7
  );
}

/**
 * Grade filter state for question bank pages.
 * Resolves educator default from active classroom, then gradesTaught.
 */
export function useQuestionBankGrade() {
  const token = useUserStore((s) => s.token);
  const role = useUserStore((s) => s.role);
  const user = useUserStore((s) => s.user);
  const activeClassCode = useUserStore((s) => s.activeClassCode);
  const sessionGrade = useUserStore((s) => s.grade);

  const gradesTaught = user?.gradesTaught;
  const bootstrapped = useRef(false);

  const [grade, setGrade] = useState(() =>
    defaultQuestionBankGrade({
      gradesTaught,
      sessionGrade: role === "educator" ? null : sessionGrade,
    })
  );

  useEffect(() => {
    if (bootstrapped.current) return;
    if (role !== "educator") {
      bootstrapped.current = true;
      setGrade(
        defaultQuestionBankGrade({
          gradesTaught,
          sessionGrade,
        })
      );
      return;
    }

    if (!token) {
      bootstrapped.current = true;
      setGrade(defaultQuestionBankGrade({ gradesTaught }));
      return;
    }

    let cancelled = false;
    void fetchTeacherClasses(token)
      .then((classes) => {
        if (cancelled) return;
        const active = activeClassCode
          ? classes.find((row) => row.class_code === activeClassCode)
          : undefined;
        setGrade(
          defaultQuestionBankGrade({
            activeClassGrade: active?.grade_level,
            gradesTaught,
          })
        );
        bootstrapped.current = true;
      })
      .catch(() => {
        if (cancelled) return;
        setGrade(defaultQuestionBankGrade({ gradesTaught }));
        bootstrapped.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [token, role, activeClassCode, gradesTaught, sessionGrade]);

  return [grade, setGrade] as const;
}
