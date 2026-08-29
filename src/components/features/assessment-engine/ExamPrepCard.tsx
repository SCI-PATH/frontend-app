"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Flag, Loader2 } from "lucide-react";

import { LearningHubCardShell } from "@/components/common/student-home/LearningHubCardShell";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/store/useUserStore";
import { fetchAmplitudeChapters } from "./api/amplitude";
import { chaptersForGrade } from "./data/catalog";

export function ExamPrepCard() {
  const grade = useUserStore((s) => s.grade) ?? 7;
  const [chapterCount, setChapterCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      let count = 0;
      try {
        const res = await fetchAmplitudeChapters(grade);
        count = (res.chapters ?? []).length;
      } catch {
        count = chaptersForGrade(grade).length;
      }

      if (cancelled) return;
      setChapterCount(count);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [grade]);

  return (
    <LearningHubCardShell
      tone="accent"
      eyebrow="Exam preparation"
      title="Build your quiz"
      description="Pick chapters and question types for practice."
      icon={ClipboardCheck}
      footer={
        <Button
          asChild
          className="h-11 w-full rounded-2xl bg-brand-accent text-base font-semibold text-white shadow-md shadow-brand-accent/25 hover:bg-brand-accent/90"
        >
          <Link href="/assessment/custom-quiz">
            Configure &amp; start
            <Flag className="size-4" aria-hidden />
          </Link>
        </Button>
      }
    >
      <div className="flex h-full items-center gap-3 rounded-2xl border border-brand-accent/15 bg-white/85 p-3.5 backdrop-blur-sm">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-brand-text/55">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading…
          </div>
        ) : (
          <>
            <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-brand-accent/20 to-brand-accent/5 ring-1 ring-brand-accent/20">
              <span className="text-2xl font-black leading-none text-brand-accent">
                {chapterCount ?? 0}
              </span>
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-accent/80">
                ch.
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-brand-text">
                Grade {grade} quiz pool
              </p>
              <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-brand-text/55">
                {chapterCount && chapterCount > 0
                  ? `${chapterCount} chapters ready to mix into your test.`
                  : "Open the builder to configure your test."}
              </p>
            </div>
          </>
        )}
      </div>
    </LearningHubCardShell>
  );
}
