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
import { Button } from "@/components/ui/button";
import {
  EDUCATOR_CLASSROOMS_PATH,
  EDUCATOR_CONTENT_GENERATION_PATH,
  EDUCATOR_DASHBOARD_PATH,
  EDUCATOR_QUESTION_GENERATION_PATH,
} from "@/lib/auth-routes";
import { fetchTeacherClasses } from "@/lib/user-management";
import { cn } from "@/lib/utils";
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
    accent: "primary",
    cta: "Open dashboard",
  },
  {
    href: EDUCATOR_CLASSROOMS_PATH,
    title: "Classrooms",
    kicker: "Roster",
    description:
      "View your classes, copy join codes, and create a new class for students to join.",
    icon: Users,
    accent: "special",
    cta: "Manage classes",
  },
  {
    href: EDUCATOR_CONTENT_GENERATION_PATH,
    title: "Content Generation",
    kicker: "Learning path",
    description:
      "Build and approve adaptive lesson content for your Grade 6–9 science classes.",
    icon: BookOpen,
    accent: "secondary",
    cta: "Open library",
  },
  {
    href: EDUCATOR_QUESTION_GENERATION_PATH,
    title: "Question Generation",
    kicker: "Assessment",
    description:
      "Generate quiz items aligned to skills and misconceptions. Coming soon.",
    icon: ClipboardList,
    accent: "accent",
    cta: "Preview workspace",
    comingSoon: true,
  },
] as const;

const accentStyles = {
  primary: {
    kicker: "text-brand-primary",
    icon: "bg-brand-primary/10 text-brand-primary",
    button: "bg-brand-primary text-white hover:bg-brand-primary/90",
    border: "border-brand-primary/20",
  },
  special: {
    kicker: "text-brand-special",
    icon: "bg-brand-special/10 text-brand-special",
    button: "bg-brand-special text-white hover:bg-brand-special/90",
    border: "border-brand-special/20",
  },
  secondary: {
    kicker: "text-brand-secondary",
    icon: "bg-brand-secondary/15 text-brand-text",
    button: "bg-brand-secondary text-brand-text hover:bg-brand-secondary/90",
    border: "border-brand-secondary/25",
  },
  accent: {
    kicker: "text-brand-accent",
    icon: "bg-brand-accent/10 text-brand-accent",
    button: "bg-brand-accent text-white hover:bg-brand-accent/90",
    border: "border-brand-accent/20",
  },
} as const;

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
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <EducatorNavbar />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-3 pt-5 pb-10 sm:gap-10 sm:px-5">
        <EducatorWelcomeBanner />

        <section className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            const styles = accentStyles[tool.accent];
            return (
              <article
                key={tool.href}
                className={cn(
                  "flex min-h-[16.5rem] flex-col gap-4 rounded-2xl border bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5",
                  styles.border
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p
                    className={cn(
                      "text-sm font-bold uppercase tracking-wider",
                      styles.kicker
                    )}
                  >
                    {tool.kicker}
                  </p>
                  <div className="flex items-center gap-2">
                    {"comingSoon" in tool && tool.comingSoon ? (
                      <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-accent">
                        Soon
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-xl",
                        styles.icon
                      )}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-brand-text">
                  {tool.title}
                </h2>
                <p className="text-base leading-snug text-brand-text/65">
                  {tool.description}
                </p>
                <Button asChild className={cn("mt-auto w-full", styles.button)}>
                  <Link href={tool.href}>
                    {tool.cta}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border border-brand-surface bg-white p-6 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
                Your classes
              </p>
              <h2 className="text-lg font-semibold text-brand-text">
                Share a class code so students can join
              </h2>
            </div>
            <Button
              asChild
              className="bg-brand-special text-white hover:bg-brand-special/90"
            >
              <Link href={EDUCATOR_CLASSROOMS_PATH}>
                <Plus className="size-4" aria-hidden />
                Create or view classes
              </Link>
            </Button>
          </div>

          {classes.length === 0 ? (
            <p className="rounded-xl border border-dashed border-brand-surface bg-brand-background px-4 py-6 text-sm text-brand-text/65">
              You have not created a class yet. Teachers get a join code only
              after creating a class — students enter that code at signup.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {classes.slice(0, 4).map((row) => (
                <li
                  key={row.class_code}
                  className="flex items-center justify-between gap-3 rounded-xl border border-brand-surface bg-brand-background/70 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-text">
                      {row.class_name}
                    </p>
                    <p className="text-xs text-brand-text/55">
                      Grade {row.grade_level}
                      {row.subject ? ` · ${row.subject}` : ""}
                    </p>
                    <p className="mt-1 font-mono text-xs text-brand-primary">
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
                      className="h-7 bg-brand-primary text-white hover:bg-brand-primary/90"
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
