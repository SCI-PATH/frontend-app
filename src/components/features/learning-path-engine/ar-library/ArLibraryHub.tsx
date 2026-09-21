"use client";

import Link from "next/link";
import { ArrowLeft, Heart, Rocket, ScanLine, Sparkles } from "lucide-react";

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
                Marker Experiences
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

          <article
            aria-label="More AR models coming soon"
            className="relative flex min-h-[14rem] flex-col overflow-hidden rounded-3xl border border-dashed border-brand-special/30 bg-gradient-to-br from-white via-brand-background/50 to-brand-special/8 shadow-sm sm:col-span-2"
          >
            <BrandGradientBar />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-8 bottom-0 size-40 rounded-full bg-brand-primary/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 size-36 rounded-full bg-brand-accent/15 blur-2xl"
            />
            <div className="relative flex flex-1 flex-col items-center justify-center px-6 py-8 text-center sm:flex-row sm:gap-8 sm:px-10 sm:py-10 sm:text-left">
              <span className="flex size-16 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-primary to-brand-special text-white shadow-lg shadow-brand-special/20">
                <Rocket className="size-8" aria-hidden />
              </span>
              <div className="mt-5 max-w-xl sm:mt-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-special/25 bg-brand-special/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-special">
                  <Sparkles className="size-3.5" aria-hidden />
                  Coming soon
                </span>
                <h2 className="mt-3 text-xl font-bold tracking-tight text-brand-text sm:text-2xl">
                  New AR models are on the way
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-brand-text/65 sm:text-base">
                  We&apos;re building more marker AR experiences for the SCI PATH library.
                  Try the models available today — and check back soon for new ones.
                </p>
                <p className="mt-4 text-sm font-semibold text-brand-primary">
                  Stay tuned — more AR models are on the way.
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
