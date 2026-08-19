"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, Copy, Plus } from "lucide-react";

import { EducatorNavbar } from "@/components/common/educator-home/EducatorNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EDUCATOR_DASHBOARD_PATH, EDUCATOR_HOME_PATH } from "@/lib/auth-routes";
import { createTeacherClass, fetchTeacherClasses } from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";
import type { TeacherClass } from "@/types";

const GRADE_LEVELS = [6, 7, 8, 9] as const;

const fieldClassName =
  "h-10 border-brand-surface bg-brand-background/70 text-brand-text placeholder:text-brand-text/40 transition-colors focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-brand-primary/25";

export function ClassroomsView() {
  const router = useRouter();
  const token = useUserStore((state) => state.token);
  const setActiveClassCode = useUserStore((state) => state.setActiveClassCode);

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [className, setClassName] = useState("");
  const [gradeLevel, setGradeLevel] = useState<number>(7);
  const [subject, setSubject] = useState("Science");
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [created, setCreated] = useState<TeacherClass | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      setListError("Sign in as an educator to manage classrooms.");
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    void fetchTeacherClasses(token)
      .then((rows) => {
        if (cancelled) return;
        setClasses(rows);
        setListError(null);
        setIsLoading(false);
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setListError(
          caught instanceof Error ? caught.message : "Could not load classes."
        );
        setIsLoading(false);
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

  function openInsights(code: string) {
    setActiveClassCode(code);
    router.push(EDUCATOR_DASHBOARD_PATH);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setCreated(null);

    if (!token) {
      setFormError("Sign in as an educator to create a class.");
      return;
    }
    if (!className.trim()) {
      setFormError("Enter a class name.");
      return;
    }

    setIsCreating(true);
    try {
      const nextClass = await createTeacherClass(token, {
        className: className.trim(),
        gradeLevel,
        subject: subject.trim() || "Science",
      });
      setClasses((current) => [nextClass, ...current]);
      setActiveClassCode(nextClass.class_code);
      setCreated(nextClass);
      setClassName("");
    } catch (caught) {
      setFormError(
        caught instanceof Error ? caught.message : "Could not create the class."
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <EducatorNavbar />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-3 py-6 sm:px-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
              Classrooms
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
              Your science classes
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-brand-text/65 sm:text-base">
              Creating a class generates a join code such as{" "}
              <span className="font-mono text-brand-primary">SCI-G7-A4K9ZX</span>.
              Share that code so students can enrol at signup.
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            className="border-brand-surface bg-white text-brand-text hover:bg-brand-background"
          >
            <Link href={EDUCATOR_HOME_PATH}>Back to teacher home</Link>
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <form
            onSubmit={(event) => void handleCreate(event)}
            className="h-fit space-y-4 rounded-2xl border border-brand-special/20 bg-white p-5 sm:p-6"
          >
            <div className="flex items-center gap-2">
              <span className="flex size-9 items-center justify-center rounded-xl bg-brand-special/10 text-brand-special">
                <Plus className="size-4" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold text-brand-text">Create a class</h2>
                <p className="text-xs text-brand-text/55">
                  User Management assigns the class code automatically.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="class-name"
                className="text-sm font-medium text-brand-text"
              >
                Class name
              </label>
              <Input
                id="class-name"
                value={className}
                onChange={(event) => setClassName(event.target.value)}
                placeholder="Grade 7 Science — Section B"
                className={fieldClassName}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="class-grade"
                  className="text-sm font-medium text-brand-text"
                >
                  Grade
                </label>
                <select
                  id="class-grade"
                  value={gradeLevel}
                  onChange={(event) => setGradeLevel(Number(event.target.value))}
                  className="h-10 w-full rounded-lg border border-brand-surface bg-brand-background/70 px-2.5 text-sm text-brand-text outline-none transition-colors focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-brand-primary/25"
                >
                  {GRADE_LEVELS.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label
                  htmlFor="class-subject"
                  className="text-sm font-medium text-brand-text"
                >
                  Subject
                </label>
                <Input
                  id="class-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Science"
                  className={fieldClassName}
                />
              </div>
            </div>

            {formError ? (
              <p
                className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent"
                role="alert"
              >
                {formError}
              </p>
            ) : null}

            {created ? (
              <p
                className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-2 text-sm text-brand-text"
                role="status"
              >
                Class created. Share{" "}
                <span className="font-mono font-semibold text-brand-primary">
                  {created.class_code}
                </span>{" "}
                with your students.
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={isCreating}
              className="w-full bg-brand-special text-white hover:bg-brand-special/90"
            >
              {isCreating ? "Creating…" : "Create class"}
            </Button>
          </form>

          <section className="rounded-2xl border border-brand-surface bg-white p-5 sm:p-6">
            <h2 className="font-semibold text-brand-text">Existing classes</h2>
            <p className="mt-1 text-sm text-brand-text/55">
              Students join with the class code. Analytics uses the class you
              open from here.
            </p>

            {isLoading ? (
              <p className="mt-6 text-sm text-brand-text/55">Loading classes…</p>
            ) : listError ? (
              <p
                className="mt-6 rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent"
                role="alert"
              >
                {listError}
              </p>
            ) : classes.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-brand-surface bg-brand-background px-4 py-8 text-center text-sm text-brand-text/65">
                No classes yet. Create one on the left, then share the code at
                signup.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {classes.map((row) => (
                  <li
                    key={row.class_code}
                    className="flex flex-col gap-3 rounded-xl border border-brand-surface bg-brand-background/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-brand-text">
                        {row.class_name}
                      </p>
                      <p className="text-sm text-brand-text/55">
                        Grade {row.grade_level}
                        {row.subject ? ` · ${row.subject}` : ""}
                      </p>
                      <p className="mt-1 font-mono text-sm text-brand-primary">
                        {row.class_code}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void handleCopy(row.class_code)}
                        className="border-brand-surface bg-white text-brand-text hover:bg-white"
                      >
                        <Copy className="size-3.5" aria-hidden />
                        {copiedCode === row.class_code ? "Copied" : "Copy code"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => openInsights(row.class_code)}
                        className="bg-brand-primary text-white hover:bg-brand-primary/90"
                      >
                        <BarChart3 className="size-3.5" aria-hidden />
                        Insights
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
