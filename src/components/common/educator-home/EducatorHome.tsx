"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  ClipboardList,
  Copy,
  Plus,
  Users,
} from "lucide-react";

import { EducatorNavbar } from "@/components/common/educator-home/EducatorNavbar";
import { EducatorWelcomeBanner } from "@/components/common/educator-home/EducatorWelcomeBanner";
import { LearningHubCardShell } from "@/components/common/student-home/LearningHubCardShell";
import { Button } from "@/components/ui/button";
import {
  EDUCATOR_CLASSROOMS_PATH,
  EDUCATOR_CONTENT_GENERATION_PATH,
  EDUCATOR_DASHBOARD_PATH,
  EDUCATOR_QUESTION_GENERATION_PATH,
} from "@/lib/auth-routes";
import { fetchTeacherClasses } from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";
import type { TeacherClass } from "@/types";

const TOOLS = [
  {
    href: EDUCATOR_DASHBOARD_PATH,
    title: "Classroom Insights",
    kicker: "Analytics",
    description:
      "Mastery matrix, at-risk learners, and student deep-dives for the selected class.",
    icon: BarChart3,
    tone: "primary" as const,
    cta: "Open dashboard",
    chips: ["Mastery grid", "At-risk alerts", "Deep-dive"],
    button:
      "h-11 w-full rounded-2xl bg-brand-primary text-base font-semibold text-white shadow-md shadow-brand-primary/25 hover:bg-brand-primary/90",
  },
  {
    href: EDUCATOR_CLASSROOMS_PATH,
    title: "Classrooms",
    kicker: "Roster",
    description:
      "View your classes, copy join codes, and create a new class for students to join.",
    icon: Users,
    tone: "special" as const,
    cta: "Manage classes",
    chips: ["Join codes", "Create class", "Roster"],
    button:
      "h-11 w-full rounded-2xl bg-brand-special text-base font-semibold text-white shadow-md shadow-brand-special/25 hover:bg-brand-special/90",
  },
  {
    href: EDUCATOR_CONTENT_GENERATION_PATH,
    title: "Content Generation",
    kicker: "Learning path",
    description:
      "Build and approve adaptive lesson content for your Grade 6–9 science classes.",
    icon: BookOpen,
    tone: "secondary" as const,
    cta: "Open library",
    chips: ["Lessons", "Approve", "Adapt"],
    button:
      "h-11 w-full rounded-2xl bg-brand-secondary text-base font-semibold text-brand-text shadow-md shadow-brand-secondary/25 hover:bg-brand-secondary/90",
  },
  {
    href: EDUCATOR_QUESTION_GENERATION_PATH,
    title: "Question Bank",
    kicker: "Assessment",
    description:
      "Generate quiz items, review pending questions, and approve or reject for your classes.",
    icon: ClipboardList,
    tone: "accent" as const,
    cta: "Open question bank",
    chips: ["Generate", "Review", "Approve"],
    button:
      "h-11 w-full rounded-2xl bg-brand-accent text-base font-semibold text-white shadow-md shadow-brand-accent/25 hover:bg-brand-accent/90",
  },
] as const;

export function EducatorHome() {
  const token = useUserStore((state) => state.token);
  const setActiveClassCode = useUserStore((state) => state.setActiveClassCode);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void fetchTeacherClasses(token)
      .then((rows) => {
        if (!cancelled) setClasses(rows);
      })
      .catch(() => {
        if (!cancelled) setClasses([]);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleCopy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(null), 1800);
    } catch {
      // Clipboard may be unavailable outside a secure context.
    }
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <EducatorNavbar />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E818,_transparent_45%),radial-gradient(ellipse_at_top_right,_#7209B714,_transparent_40%),radial-gradient(ellipse_at_bottom,_#70E00012,_transparent_45%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-3 pt-5 pb-16 sm:gap-12 sm:px-5 sm:pt-6">
        <EducatorWelcomeBanner />

        <section className="space-y-6 sm:space-y-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-special">
              Teacher tools
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
              Insights, classes, content &amp; questions
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-text/60 sm:text-base">
              Pick a workspace and keep your Grade 6–9 science classes moving.
            </p>
          </div>

          <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            {TOOLS.map((tool) => (
              <LearningHubCardShell
                key={tool.href}
                tone={tool.tone}
                eyebrow={tool.kicker}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                footer={
                  <Button asChild className={tool.button}>
                    <Link href={tool.href}>
                      {tool.cta}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                }
              >
                <ul className="flex flex-wrap gap-1.5">
                  {tool.chips.map((chip) => (
                    <li
                      key={chip}
                      className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-brand-text/70 ring-1 ring-black/5"
                    >
                      {chip}
                    </li>
                  ))}
                </ul>
              </LearningHubCardShell>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[1.75rem] border border-brand-special/20 bg-gradient-to-br from-white via-white to-brand-special/8 p-6 shadow-sm sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-special">
                Your classes
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-brand-text sm:text-2xl">
                Share a class code so students can join
              </h2>
            </div>
            <Button
              asChild
              className="rounded-full bg-brand-special text-white hover:bg-brand-special/90"
            >
              <Link href={EDUCATOR_CLASSROOMS_PATH}>
                <Plus className="size-4" aria-hidden />
                Create or view classes
              </Link>
            </Button>
          </div>

          {classes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-brand-special/25 bg-white px-4 py-8 text-center text-sm text-brand-text/65">
              You have not created a class yet. Teachers get a join code only
              after creating a class — students enter that code at signup.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {classes.slice(0, 4).map((row) => (
                <li
                  key={row.class_code}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-brand-primary/15 bg-white px-4 py-4 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-text">
                      {row.class_name}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-brand-text/55">
                      <span className="rounded-full bg-brand-primary/10 px-2 py-0.5 font-semibold text-brand-primary">
                        Grade {row.grade_level}
                      </span>
                      {row.subject ? <span>{row.subject}</span> : null}
                    </p>
                    <p className="mt-2 font-mono text-sm font-semibold text-brand-special">
                      {row.class_code}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      title="Copy class code"
                      onClick={() => void handleCopy(row.class_code)}
                      className="border-brand-surface bg-white"
                    >
                      <Copy className="size-3.5" aria-hidden />
                      <span className="sr-only">
                        {copiedCode === row.class_code
                          ? "Copied"
                          : "Copy class code"}
                      </span>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="h-8 rounded-full bg-brand-primary text-white hover:bg-brand-primary/90"
                    >
                      <Link
                        href={EDUCATOR_DASHBOARD_PATH}
                        onClick={() => setActiveClassCode(row.class_code)}
                      >
                        Insights
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
