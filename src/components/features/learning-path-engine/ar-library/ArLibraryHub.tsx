"use client";

import Link from "next/link";
import { ArrowLeft, Heart, ScanLine, Sparkles } from "lucide-react";

import { AR_EXPERIENCES } from "@/components/features/learning-path-engine/ar-library/catalog";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Button } from "@/components/ui/button";
import { STUDENT_LEARNING_PATH } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

export function ArLibraryHub() {
  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E818,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#70E00016,_transparent_42%),radial-gradient(ellipse_at_top_right,_#7209B712,_transparent_38%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-8 px-3 py-6 sm:px-5 sm:py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <span className="mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-special/15 text-brand-special ring-1 ring-brand-special/25">
              <ScanLine className="size-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-brand-special">
                <Sparkles className="size-3.5" aria-hidden />
                AR Library
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
                Marker experiences
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-brand-text/65 sm:text-base">
                Pick an organ, open its marker, download the matching Android app, then
                scan to explore in AR.
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            className="border-brand-surface bg-white text-brand-text hover:bg-brand-background"
          >
            <Link href={STUDENT_LEARNING_PATH}>
              <ArrowLeft className="size-4" aria-hidden />
              Back to content
            </Link>
          </Button>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          {AR_EXPERIENCES.map((item) => {
            const Icon = item.id === "heart" ? Heart : ScanLine;
            return (
              <Link
                key={item.id}
                href={item.href}
                className="group relative flex min-h-[16rem] flex-col overflow-hidden rounded-3xl border border-brand-surface bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-brand-primary/30 hover:shadow-lg"
              >
                <BrandGradientBar />
                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -right-10 -top-10 size-32 rounded-full blur-2xl",
                    item.id === "heart" ? "bg-brand-accent/20" : "bg-brand-primary/20"
                  )}
                />
                <div className="relative flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                        item.accentClass
                      )}
                    >
                      <ScanLine className="size-3.5" aria-hidden />
                      Marker AR
                    </span>
                    <span
                      className={cn(
                        "flex size-11 items-center justify-center rounded-2xl text-white shadow-md",
                        item.id === "heart"
                          ? "bg-brand-accent shadow-brand-accent/25"
                          : "bg-brand-primary shadow-brand-primary/25"
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-bold text-brand-text group-hover:text-brand-primary sm:text-2xl">
                    {item.title}
                  </h2>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-brand-text/60">
                    {item.description}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-brand-primary">
                    Open marker &amp; APK →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
