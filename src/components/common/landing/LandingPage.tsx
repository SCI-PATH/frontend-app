"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  GraduationCap,
  Sparkles,
} from "lucide-react";

import { RedirectToHomeIfAuthenticated } from "@/components/common/auth/RedirectToHomeIfAuthenticated";
import { AppLogo } from "@/components/common/AppLogo";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { BrandLockup } from "@/components/common/BrandLockup";
import { FeaturePreviewPanel } from "@/components/common/landing/FeaturePreviewPanel";
import {
  ACCENT_STYLES,
  LANDING_FEATURES,
  LANDING_STATS,
  type LandingFeatureId,
} from "@/components/common/landing/landing-content";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LOGIN_PATH, REGISTER_PATH } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

function LandingNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-surface/80 bg-white/90 backdrop-blur-md">
      <BrandGradientBar />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLockup href="/" subtitle="Grades 6–9 Science" size="sm" priority />
        <nav className="hidden items-center gap-6 text-sm font-medium text-brand-text/70 md:flex">
          <a href="#features" className="transition-colors hover:text-brand-primary">
            Features
          </a>
          <a href="#how-it-works" className="transition-colors hover:text-brand-primary">
            How it works
          </a>
          <a href="#for-educators" className="transition-colors hover:text-brand-primary">
            For educators
          </a>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            asChild
            variant="ghost"
            className="text-brand-text hover:bg-brand-background"
          >
            <Link href={LOGIN_PATH}>Log in</Link>
          </Button>
          <Button
            asChild
            className="bg-brand-primary text-white shadow-sm hover:bg-brand-primary/90"
          >
            <Link href={REGISTER_PATH}>
              Get started
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 top-0 size-72 rounded-full bg-brand-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 top-20 size-64 rounded-full bg-brand-special/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/3 size-56 rounded-full bg-brand-secondary/20 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Badge className="mb-4 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/10">
            <Sparkles className="mr-1 size-3.5" aria-hidden />
            Adaptive science learning · Sri Lanka Grades 6–9
          </Badge>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-brand-text sm:text-5xl lg:text-[3.25rem] lg:leading-[1.08]">
            One pathway.{" "}
            <span className="bg-[linear-gradient(90deg,#00A8E8_0%,#70E000_45%,#7209B7_100%)] bg-clip-text text-transparent">
              Five intelligent engines.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-brand-text/70">
            SCI-PATH connects Socratic tutoring, gamified practice, adaptive lesson paths,
            smart assessments, and BKT analytics into a single research platform built for
            middle-school science.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-2xl bg-brand-primary px-6 text-base text-white hover:bg-brand-primary/90"
            >
              <Link href={REGISTER_PATH}>
                Create free account
                <ChevronRight className="size-5" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-2xl border-brand-surface bg-white px-6 text-base text-brand-text hover:bg-brand-background"
            >
              <Link href={LOGIN_PATH}>I already have an account</Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {LANDING_STATS.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-2xl border border-brand-surface bg-white/80 px-4 py-3 backdrop-blur-sm"
              >
                <Icon className="mb-2 size-4 text-brand-primary" aria-hidden />
                <p className="text-2xl font-bold text-brand-text">{value}</p>
                <p className="text-xs text-brand-text/55">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-in fade-in slide-in-from-right-6 duration-700 delay-150">
          <div className="relative overflow-hidden rounded-[2rem] border border-brand-surface bg-gradient-to-br from-brand-primary via-brand-special to-brand-accent p-1 shadow-xl shadow-brand-primary/10">
            <div className="rounded-[1.85rem] bg-white p-5 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-brand-background p-1.5 ring-2 ring-brand-primary/20">
                  <AppLogo size="lg" />
                </div>
                <div>
                  <p className="font-semibold text-brand-text">Meet your science stack</p>
                  <p className="text-sm text-brand-text/55">
                    Tutor · Games · Paths · Quizzes · Analytics
                  </p>
                </div>
              </div>
              <div className="space-y-2.5">
                {LANDING_FEATURES.map((feature, index) => {
                  const styles = ACCENT_STYLES[feature.accent];
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.id}
                      className="flex items-center gap-3 rounded-2xl border border-brand-surface bg-brand-background/70 px-3 py-2.5 transition-transform hover:-translate-y-0.5"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-xl",
                          styles.bg,
                          styles.text
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-brand-text">
                          {feature.name}
                        </p>
                        <p className="truncate text-xs text-brand-text/50">{feature.tagline}</p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-brand-text/30" aria-hidden />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureShowcaseSection() {
  const [activeId, setActiveId] = useState<LandingFeatureId>("socrates");
  const activeFeature =
    LANDING_FEATURES.find((feature) => feature.id === activeId) ?? LANDING_FEATURES[0];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveId((current) => {
        const index = LANDING_FEATURES.findIndex((feature) => feature.id === current);
        const next = LANDING_FEATURES[(index + 1) % LANDING_FEATURES.length];
        return next.id;
      });
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section id="features" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <Badge className="mb-3 bg-brand-special/10 text-brand-special hover:bg-brand-special/10">
            Platform modules
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            Built for learners and teachers
          </h2>
          <p className="mt-3 text-base text-brand-text/65 sm:text-lg">
            Explore the five engines that power SCI-PATH. Each module shares the same
            curriculum topic IDs so mastery stays consistent end-to-end.
          </p>
        </div>

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-8">
          <div className="space-y-3">
            {LANDING_FEATURES.map((feature) => {
              const styles = ACCENT_STYLES[feature.accent];
              const Icon = feature.icon;
              const isActive = feature.id === activeId;
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => setActiveId(feature.id)}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-4 text-left transition-all duration-300",
                    isActive
                      ? cn("border-transparent bg-white shadow-md ring-2", styles.ring)
                      : "border-brand-surface bg-white/70 hover:border-brand-primary/20 hover:bg-white"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl",
                        styles.bg,
                        styles.text
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-semibold text-brand-text">{feature.name}</p>
                      <p className="text-sm text-brand-text/55">{feature.tagline}</p>
                      {isActive ? (
                        <p className="mt-2 text-sm leading-relaxed text-brand-text/70">
                          {feature.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {isActive ? (
                    <ul className="mt-3 space-y-1.5 border-t border-brand-surface pt-3">
                      {feature.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="flex items-start gap-2 text-sm text-brand-text/70"
                        >
                          <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", styles.dot)} />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </button>
              );
            })}
          </div>

          <FeaturePreviewPanel key={activeFeature.id} feature={activeFeature} />
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      title: "Join with a class code",
      copy: "Teachers create a classroom and share a code. Learners enroll at signup and stay scoped to their grade.",
      icon: GraduationCap,
      color: "text-brand-primary",
    },
    {
      title: "Learn along an adaptive path",
      copy: "Generated lessons and Socrates hints meet you at your mastery level—basic, intermediate, or advanced.",
      icon: BookOpen,
      color: "text-brand-secondary",
    },
    {
      title: "Practice, play, and prove mastery",
      copy: "Farm & Unlock missions and dynamically tuned quizzes feed the same BKT model your teacher sees.",
      icon: Sparkles,
      color: "text-brand-accent",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 bg-white px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
            How SCI-PATH flows
          </h2>
          <p className="mt-3 text-base text-brand-text/65 sm:text-lg">
            From first login to teacher intervention—every interaction reinforces one shared
            mastery trajectory per learner and topic.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="relative rounded-3xl border border-brand-surface bg-brand-background p-6"
              >
                <span className="mb-4 inline-flex size-10 items-center justify-center rounded-2xl bg-white text-sm font-bold text-brand-text shadow-sm">
                  {index + 1}
                </span>
                <Icon className={cn("mb-3 size-6", step.color)} aria-hidden />
                <h3 className="text-lg font-semibold text-brand-text">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-text/65">{step.copy}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EducatorSection() {
  return (
    <section id="for-educators" className="scroll-mt-24 px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-text via-brand-text to-brand-primary p-8 text-white sm:p-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge className="mb-4 bg-white/10 text-white hover:bg-white/10">
              For educators
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Classroom analytics that act on evidence—not guesswork
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
              Open your educator dashboard to see a grade-scoped mastery matrix, at-risk
              alerts, and learner deep-dives—all filtered by class code so you only see
              your roster.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-white/85">
              <li>· Mastery heatmaps with strict BKT color bands</li>
              <li>· Priority alerts when 2-of-3 risk signals fire</li>
              <li>· Misconception clouds from distractor analytics</li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Learners tracked", value: "28" },
              { label: "Topics this term", value: "38" },
              { label: "At-risk flagged", value: "4" },
              { label: "Class code", value: "SCI-G7" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm"
              >
                <p className="text-xs uppercase tracking-wide text-white/60">{item.label}</p>
                <p className="mt-1 text-2xl font-bold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="px-4 pb-20 pt-4 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-brand-surface bg-white px-6 py-10 text-center shadow-sm sm:px-10">
        <h2 className="text-3xl font-bold tracking-tight text-brand-text">
          Ready to explore science pathways?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base text-brand-text/65">
          Students join with a class code. Teachers create classes in minutes. Everyone
          shares one intelligent mastery model.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-2xl bg-brand-primary px-6 text-base text-white hover:bg-brand-primary/90"
          >
            <Link href={REGISTER_PATH}>Sign up as student or teacher</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 rounded-2xl border-brand-surface px-6 text-base"
          >
            <Link href={LOGIN_PATH}>Log in</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-brand-surface bg-white px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-brand-text">
          <AppLogo size="sm" />
          <span className="font-semibold">SCI PATH</span>
          <span className="text-brand-text/40">·</span>
          <span className="text-sm text-brand-text/55">System for Science Pathways</span>
        </div>
        <p className="text-sm text-brand-text/50">
          R26-SE-003 · Adaptive middle-school science research platform
        </p>
      </div>
      <BrandGradientBar className="mx-auto mt-6 max-w-6xl rounded-full" />
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-full bg-brand-background text-brand-text">
      <RedirectToHomeIfAuthenticated />
      <LandingNavbar />
      <main>
        <HeroSection />
        <FeatureShowcaseSection />
        <HowItWorksSection />
        <EducatorSection />
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
