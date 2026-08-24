"use client";

import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";

import { EducatorNavbar } from "@/components/common/educator-home/EducatorNavbar";
import { Button } from "@/components/ui/button";
import { EDUCATOR_HOME_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";

import TeacherPanel from "./components/TeacherPanel.jsx";
import FeatureShell from "./FeatureShell";

/**
 * Educator content-generation UI (teacher library / approve).
 * Mounted only from `(educator)` routes — chrome matches other educator pages
 * (navbar + brand tokens from DEVELOPER_README).
 */
export default function TeacherContentGeneration() {
  const userId = useUserStore((s) => s.userId);
  const teacherId = userId || "";

  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <EducatorNavbar />
      <FeatureShell className="flex flex-1 flex-col">
        <div className="relative flex-1 overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E818,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#70E00016,_transparent_42%),radial-gradient(ellipse_at_top_right,_#7209B712,_transparent_38%)]"
          />

          <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-3 py-6 sm:px-5 sm:py-8">
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex min-w-0 items-start gap-4">
                <span className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-secondary/20 text-brand-text ring-1 ring-brand-secondary/30">
                  <BookOpen className="size-6" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-brand-secondary">
                    <Sparkles className="size-3.5 text-brand-text/70" aria-hidden />
                    Learning path
                  </p>
                  <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
                    Content Generation
                  </h1>
                  <p className="mt-1 max-w-2xl text-sm text-brand-text/65 sm:text-base">
                    Build and approve adaptive Grade 6–9 science lessons, attach
                    videos and images, and keep the verified library ready for
                    your classes.
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-brand-surface bg-white text-brand-text hover:bg-brand-background"
              >
                <Link href={EDUCATOR_HOME_PATH}>Back to teacher home</Link>
              </Button>
            </header>

            <TeacherPanel teacherId={teacherId} embedded />
          </div>
        </div>
      </FeatureShell>
    </div>
  );
}
