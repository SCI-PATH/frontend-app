"use client";

import Link from "next/link";
import { Brain, Sparkles, Zap } from "lucide-react";

import { LearningHubCardShell } from "@/components/common/student-home/LearningHubCardShell";
import { Button } from "@/components/ui/button";

/** Aptitude / Amplitude placement — slot 1 until initial-category exists. */
export function AmplitudePlacementCard() {
  return (
    <LearningHubCardShell
      tone="gold"
      eyebrow="First mission"
      title="Aptitude placement"
      description="Quick survey + quiz to find your science level."
      icon={Brain}
      footer={
        <Button
          asChild
          className="h-11 w-full rounded-2xl bg-brand-gold text-base font-semibold text-brand-text shadow-md shadow-brand-gold/25 hover:bg-brand-gold/90"
        >
          <Link href="/assessment/amplitude">
            Begin aptitude test
            <Sparkles className="size-4" aria-hidden />
          </Link>
        </Button>
      }
    >
      <div className="flex h-full flex-col justify-center gap-2 rounded-2xl border border-brand-gold/20 bg-white/80 p-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-xs font-bold text-brand-gold">
            1
          </span>
          <p className="line-clamp-1 text-xs font-medium text-brand-text/80">
            Share your science background
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-xs font-bold text-brand-gold">
            2
          </span>
          <p className="line-clamp-1 text-xs font-medium text-brand-text/80">
            Take a short adaptive quiz
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-brand-gold/15 text-xs font-bold text-brand-gold">
            3
          </span>
          <p className="inline-flex items-center gap-1 text-xs font-semibold text-brand-gold">
            <Zap className="size-3.5 shrink-0" aria-hidden />
            Unlock your hub
          </p>
        </div>
      </div>
    </LearningHubCardShell>
  );
}
