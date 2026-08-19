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
            className="m-0 inline-flex w-auto items-center rounded-full border border-white/50 bg-white px-4 py-2 text-sm font-semibold text-brand-primary no-underline hover:bg-brand-background"
          >
            Back to teacher home
          </Link>
        }
      />
    </FeatureShell>
  );
}
