"use client";

import Link from "next/link";
import { ArrowLeft, ScanLine } from "lucide-react";

import { AR_EXPERIENCES } from "@/components/features/learning-path-engine/ar-library/catalog";
import { Button } from "@/components/ui/button";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

export function ArLibraryHub() {
  return (
    <div className="relative mx-auto w-full max-w-4xl px-3 py-8 sm:px-5 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_#00A8E818,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#70E00014,_transparent_42%)]"
      />

      <Button
        asChild
        variant="outline"
        className="mb-6 border-brand-surface bg-white text-brand-text hover:bg-brand-background"
      >
        <Link href={STUDENT_HOME_PATH}>
          <ArrowLeft className="size-4" aria-hidden />
          Dashboard
        </Link>
      </Button>

      <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
        AR Library
      </p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-brand-text">
        Marker experiences
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-brand-text/65 sm:text-base">
        Pick an organ, open its marker, download the matching Android app, then scan to view in AR.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {AR_EXPERIENCES.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group rounded-2xl border border-brand-surface bg-white p-5 shadow-sm transition hover:border-brand-primary/30 hover:shadow-md"
          >
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                item.accentClass
              )}
            >
              <ScanLine className="size-3.5" aria-hidden />
              Marker AR
            </span>
            <h2 className="mt-3 text-xl font-bold text-brand-text group-hover:text-brand-primary">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-brand-text/60">{item.description}</p>
            <p className="mt-4 text-sm font-semibold text-brand-primary">
              Open marker &amp; APK →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
