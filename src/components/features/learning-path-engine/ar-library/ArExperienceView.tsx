"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Download, ScanLine, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { ArExperience } from "@/components/features/learning-path-engine/ar-library/catalog";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

export function ArExperienceView({ experience }: { experience: ArExperience }) {
  const [markerSrc, setMarkerSrc] = useState(experience.markerSrc);
  const [apkReady, setApkReady] = useState(false);
  const [checkingApk, setCheckingApk] = useState(true);

  useEffect(() => {
    setMarkerSrc(experience.markerSrc);
    let cancelled = false;
    setCheckingApk(true);
    void fetch(experience.apkSrc, { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setApkReady(res.ok);
      })
      .catch(() => {
        if (!cancelled) setApkReady(false);
      })
      .finally(() => {
        if (!cancelled) setCheckingApk(false);
      });
    return () => {
      cancelled = true;
    };
  }, [experience.apkSrc, experience.markerSrc]);

  return (
    <div className="relative mx-auto w-full max-w-3xl px-3 py-8 sm:px-5 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_#00A8E814,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#FF6B3512,_transparent_40%)]"
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
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
          <Link href={STUDENT_HOME_PATH}>Dashboard</Link>
        </Button>
      </div>

      <p className="text-sm font-bold uppercase tracking-wider text-brand-primary">
        Marker AR
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-brand-text">
        {experience.title}
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-brand-text/65 sm:text-base">
        {experience.description}
      </p>

      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            step: "1",
            title: "Install the app",
            copy: "Download the APK on an Android phone.",
            icon: Smartphone,
          },
          {
            step: "2",
            title: "Open this marker",
            copy: "Keep this page open or print the marker.",
            icon: ScanLine,
          },
          {
            step: "3",
            title: "Scan & explore",
            copy: "Point the app camera at the marker.",
            icon: Download,
          },
        ].map((item) => (
          <li
            key={item.step}
            className="rounded-2xl border border-brand-surface bg-white p-4 shadow-sm"
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

      <section className="mt-8 rounded-2xl border border-brand-surface bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <ScanLine className="size-5 text-brand-special" aria-hidden />
          <h2 className="text-lg font-bold text-brand-text">Scan this marker</h2>
        </div>
        <p className="mt-1 text-sm text-brand-text/60">
          Display this image full-screen on another device, or print it, then scan with the app.
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-dashed border-brand-special/35 bg-brand-background/80 p-4 sm:p-6">
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
        <p className="mt-3 text-xs text-brand-text/50">
          Drop the real marker at{" "}
          <code className="rounded bg-brand-surface px-1.5 py-0.5">
            public{experience.markerSrc}
          </code>
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-brand-primary/20 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-2">
          <Smartphone className="size-5 text-brand-primary" aria-hidden />
          <h2 className="text-lg font-bold text-brand-text">Android app</h2>
        </div>
        <p className="mt-1 text-sm text-brand-text/60">
          Install this APK, open it, then point the camera at the marker above.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {apkReady ? (
            <Button
              asChild
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
            >
              <a href={experience.apkSrc} download={experience.apkDownloadName}>
                <Download className="size-4" aria-hidden />
                Download {experience.shortTitle} APK
              </a>
            </Button>
          ) : (
            <Button
              type="button"
              disabled
              className="bg-brand-surface text-brand-text/50"
            >
              <Download className="size-4" aria-hidden />
              {checkingApk ? "Checking APK…" : "APK coming soon"}
            </Button>
          )}
        </div>
        <p className="mt-3 text-xs text-brand-text/50">
          Drop the APK at{" "}
          <code className="rounded bg-brand-surface px-1.5 py-0.5">
            public/ar-library/{experience.id}/app.apk
          </code>
        </p>
      </section>
    </div>
  );
}
