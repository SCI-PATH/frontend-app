"use client";

import Link from "next/link";
import { ClipboardList } from "lucide-react";

import { EducatorNavbar } from "@/components/common/educator-home/EducatorNavbar";
import { Button } from "@/components/ui/button";
import { EDUCATOR_HOME_PATH } from "@/lib/auth-routes";

export function QuestionGenerationPlaceholder() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <EducatorNavbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-brand-accent/10 text-brand-accent">
          <ClipboardList className="size-7" aria-hidden />
        </span>
        <p className="text-sm font-bold uppercase tracking-wider text-brand-accent">
          Assessment engine
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-text">
          Question generation
        </h1>
        <p className="mt-3 max-w-lg text-base text-brand-text/65">
          This workspace will let teachers generate skill-aligned quiz items.
          The assessment-engine screens are not wired yet — this page is a
          placeholder so the teacher homepage can link here.
        </p>
        <Button
          asChild
          className="mt-6 bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          <Link href={EDUCATOR_HOME_PATH}>Back to teacher home</Link>
        </Button>
      </main>
    </div>
  );
}
