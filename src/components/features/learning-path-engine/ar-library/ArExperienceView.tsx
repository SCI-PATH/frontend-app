"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  ScanLine,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Button } from "@/components/ui/button";
import type { ArExperience } from "@/components/features/learning-path-engine/ar-library/catalog";
import { STUDENT_LEARNING_PATH } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

export function ArExperienceView({ experience }: { experience: ArExperience }) {
  const [markerSrc, setMarkerSrc] = useState(experience.markerSrc);

  useEffect(() => {
    setMarkerSrc(experience.markerSrc);
  }, [experience.markerSrc]);

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E818,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#FF6B3514,_transparent_42%),radial-gradient(ellipse_at_top_right,_#7209B712,_transparent_38%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col gap-6 px-3 py-6 sm:px-5 sm:py-8">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            asChild
            variant="outline"
            className="border-brand-surface bg-white text-brand-text hover:bg-brand-background"
          >
            <Link href="/ar-library">
              <ArrowLeft className="size-4" aria-hidden />
              AR Library
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            className="text-brand-text/70 hover:bg-brand-background hover:text-brand-text"
          >
            <Link href={STUDENT_LEARNING_PATH}>Back to content</Link>
          </Button>
        </div>

        <header className="flex min-w-0 items-start gap-4">
          <span
            className={cn(
              "mt-0.5 flex size-12 shrink-0 items-center justify-center rounded-2xl ring-1",
              experience.id === "heart"
                ? "bg-brand-accent/15 text-brand-accent ring-brand-accent/25"
                : "bg-brand-primary/15 text-brand-primary ring-brand-primary/25"
            )}
          >
            <ScanLine className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-brand-primary">
              <Sparkles className="size-3.5" aria-hidden />
              Marker AR
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
              {experience.title}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-brand-text/65 sm:text-base">
              {experience.description}
            </p>
          </div>
        </header>

        <ol className="grid gap-3 sm:grid-cols-3">
          {[
            {
              step: "1",
              title: "Install the app",
              copy: "Download the APK on an Android phone.",
            },
            {
              step: "2",
              title: "Open this marker",
              copy: "Keep this page open or print the marker.",
            },
            {
              step: "3",
              title: "Scan & explore",
              copy: "Point the app camera at the marker.",
            },
          ].map((item) => (
            <li
              key={item.step}
              className="rounded-2xl border border-brand-surface/80 bg-white/95 p-4 shadow-sm ring-1 ring-brand-primary/5"
            >
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-full text-xs font-bold",
                  experience.accentClass
                )}
              >
                {item.step}
              </span>
              <p className="mt-2 text-sm font-semibold text-brand-text">{item.title}</p>
              <p className="mt-1 text-xs text-brand-text/60">{item.copy}</p>
            </li>
          ))}
        </ol>

        <section className="overflow-hidden rounded-3xl border border-brand-special/20 bg-white shadow-sm">
          <BrandGradientBar />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-special/10 text-brand-special">
                <ScanLine className="size-4" aria-hidden />
              </span>
              <h2 className="text-lg font-bold text-brand-text">Scan this marker</h2>
            </div>
            <p className="mt-2 text-sm text-brand-text/60">
              Display this image full-screen on another device, or print it, then scan
              with the app.
            </p>
            <div className="mt-5 overflow-hidden rounded-2xl border border-dashed border-brand-special/35 bg-gradient-to-br from-brand-background to-brand-special/5 p-4 sm:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={markerSrc}
                alt={`${experience.shortTitle} AR marker`}
                className="mx-auto max-h-[min(70vh,32rem)] w-full max-w-lg object-contain"
                onError={() => {
                  if (markerSrc !== experience.markerFallbackSrc) {
                    setMarkerSrc(experience.markerFallbackSrc);
                  }
                }}
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-brand-primary/20 bg-white shadow-sm">
          <BrandGradientBar />
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
                <Smartphone className="size-4" aria-hidden />
              </span>
              <h2 className="text-lg font-bold text-brand-text">Android app</h2>
            </div>
            <p className="mt-2 text-sm text-brand-text/60">
              Install this APK, open it, then point the camera at the marker above.
            </p>
            <div className="mt-5">
              <Button
                asChild
                className="h-11 rounded-2xl bg-brand-primary px-5 text-base text-white shadow-md shadow-brand-primary/20 hover:bg-brand-primary/90"
              >
                <a
                  href={experience.apkSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="size-4" aria-hidden />
                  Download {experience.shortTitle} APK
                </a>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
