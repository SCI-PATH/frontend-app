"use client";

import Link from "next/link";

import { useUserStore } from "@/store/useUserStore";

import TeacherPanel from "./components/TeacherPanel.jsx";
import FeatureShell from "./FeatureShell";

/**
 * Educator content-generation UI (teacher library / approve).
 * Mounted only from `(educator)` routes — no student role toggle.
 */
export default function TeacherContentGeneration() {
  const userId = useUserStore((s) => s.userId);
  const teacherId = userId || "";

  return (
    <FeatureShell>
      <TeacherPanel
        teacherId={teacherId}
        onBack={undefined}
        backSlot={
          <Link
            href="/matrix"
            className="inline-flex h-7 items-center rounded-lg border border-brand-surface bg-white px-2.5 text-sm text-brand-text hover:bg-brand-surface/60"
          >
            Back to teacher home
          </Link>
        }
      />
    </FeatureShell>
  );
}
