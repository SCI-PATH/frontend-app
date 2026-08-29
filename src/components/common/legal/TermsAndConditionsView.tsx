import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";

import { TermsDocument, TERMS_LAST_UPDATED } from "@/components/common/legal/TermsDocument";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { BrandLockup } from "@/components/common/BrandLockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LOGIN_PATH, REGISTER_PATH } from "@/lib/auth-routes";
import { APP_NAME } from "@/lib/brand";

export function TermsAndConditionsView() {
  return (
    <div className="relative min-h-full flex-1 overflow-hidden bg-brand-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E822,_transparent_42%),radial-gradient(ellipse_at_top_right,_#7209B716,_transparent_38%),radial-gradient(ellipse_at_bottom,_#70E00018,_transparent_40%)]"
      />

      <header className="sticky top-0 z-40 border-b border-brand-surface/80 bg-white/90 backdrop-blur-md">
        <BrandGradientBar />
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLockup href="/" subtitle="Grades 6–9 Science" size="sm" priority />
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="hidden text-brand-text hover:bg-brand-background sm:inline-flex"
            >
              <Link href={LOGIN_PATH}>Log in</Link>
            </Button>
            <Button
              asChild
              className="bg-brand-primary text-white shadow-sm hover:bg-brand-primary/90"
            >
              <Link href={REGISTER_PATH}>Create account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <Button
            asChild
            variant="ghost"
            className="-ml-2 text-brand-text/70 hover:text-brand-primary"
          >
            <Link href={REGISTER_PATH}>
              <ArrowLeft className="size-4" aria-hidden />
              Back to sign up
            </Link>
          </Button>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-primary via-brand-special to-brand-accent px-6 py-8 text-white shadow-lg shadow-brand-primary/20 sm:px-10 sm:py-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-white/15 blur-2xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/4 size-40 rounded-full bg-brand-secondary/25 blur-3xl"
          />
          <div className="relative">
            <Badge className="mb-4 border-0 bg-white/15 text-white hover:bg-white/15">
              <Scale className="mr-1.5 size-3.5" aria-hidden />
              Legal
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Terms and Conditions
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/90">
              How {APP_NAME} works, what we store, and how students and teachers
              should use this science learning platform.
            </p>
            <p className="mt-4 text-sm font-medium text-white/75">
              Last updated {TERMS_LAST_UPDATED}
            </p>
          </div>
        </section>

        <div className="mt-8">
          <TermsDocument />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-brand-surface bg-white px-5 py-4">
          <p className="text-sm text-brand-text/65">
            Ready to join a science class?
          </p>
          <Button
            asChild
            className="bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            <Link href={REGISTER_PATH}>Return to sign up</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
