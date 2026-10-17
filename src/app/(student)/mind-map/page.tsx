"use client";

import Link from "next/link";

import { Navbar } from "@/components/common/Navbar";
import FeatureShell from "@/components/features/learning-path-engine/FeatureShell";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";

export default function MindMapPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <Navbar />
      <FeatureShell className="flex flex-1 flex-col">
        <section className="mx-auto max-w-xl rounded-3xl border border-brand-primary/15 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-primary">
            Sage mind map
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-brand-text">
            Maps appear after a miss
          </h1>
          <p className="mt-3 text-base leading-relaxed text-brand-text/70">
            You cannot build a mind map on your own. When a farm Science
            question is answered incorrectly, Sage opens a textbook-grounded
            map for that question.
          </p>
          <Link
            href={STUDENT_HOME_PATH}
            className="mt-6 inline-flex rounded-2xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
          >
            Back to dashboard
          </Link>
        </section>
      </FeatureShell>
    </div>
  );
}
