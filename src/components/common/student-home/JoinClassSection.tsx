"use client";

import { FormEvent, useState } from "react";
import { BookOpen, CheckCircle2, KeyRound, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinClass } from "@/lib/user-management";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import type { TeacherClass } from "@/types";

const fieldClassName =
  "h-11 border-brand-surface bg-white font-mono uppercase tracking-wide text-brand-text placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-brand-text/40 transition-colors focus-visible:border-brand-primary focus-visible:ring-brand-primary/25";

interface JoinClassSectionProps {
  enrolledClasses?: readonly TeacherClass[];
  onJoined?: () => void;
}

export function JoinClassSection({
  enrolledClasses = [],
  onJoined,
}: JoinClassSectionProps) {
  const token = useUserStore((state) => state.token);
  const user = useUserStore((state) => state.user);
  const setSession = useUserStore((state) => state.setSession);

  const [classCode, setClassCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message: string;
    className: string;
    code: string;
  } | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const code = classCode.trim().toUpperCase();
    if (!token) {
      setError("Sign in as a student to join a class.");
      return;
    }
    if (code.length < 6) {
      setError("Enter the full class code from your teacher.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await joinClass(token, code);
      setSuccess({
        message: result.message,
        className: result.classInfo.class_name,
        code: result.classInfo.class_code,
      });
      if (user) {
        const nextCodes = Array.from(
          new Set(
            [...(user.classCodes ?? []), result.classInfo.class_code].filter(
              Boolean
            )
          )
        );
        setSession({
          user: {
            ...user,
            classCode: result.classInfo.class_code,
            classCodes: nextCodes,
          },
        });
      }
      setClassCode("");
      onJoined?.();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not join that class."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-3xl border border-brand-primary/15 bg-gradient-to-br from-white to-brand-primary/8 px-6 py-6 shadow-sm sm:px-7 sm:py-7">
      <div
        className="pointer-events-none absolute -right-10 -top-12 size-36 rounded-full bg-brand-primary/15 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 left-1/3 size-28 rounded-full bg-brand-secondary/20 blur-2xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-primary">
              <span className="flex size-8 items-center justify-center rounded-xl bg-brand-primary text-white shadow-md shadow-brand-primary/25">
                <Users className="size-4" aria-hidden />
              </span>
              Classroom
            </p>
            <h2 className="text-lg font-semibold text-brand-text sm:text-xl">
              {enrolledClasses.length > 0
                ? "Your enrolled class"
                : "Join your teacher's class"}
            </h2>
            <p className="max-w-xl text-sm text-brand-text/65 sm:text-base">
              {enrolledClasses.length > 0
                ? "This is the class your teacher created. Analytics and quizzes use this roster."
                : "Ask your teacher for a code like "}
              {enrolledClasses.length === 0 ? (
                <span className="font-mono text-brand-primary">SCI-G7-A4K9ZX</span>
              ) : null}
              {enrolledClasses.length === 0
                ? ". Your grade must match the class grade to enrol."
                : null}
            </p>
          </div>

          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <label
                htmlFor="join-class-code"
                className="text-sm font-medium text-brand-text"
              >
                {enrolledClasses.length > 0 ? "Join another class" : "Class code"}
              </label>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-brand-primary/70"
                  aria-hidden
                />
                <Input
                  id="join-class-code"
                  value={classCode}
                  onChange={(event) =>
                    setClassCode(event.target.value.toUpperCase())
                  }
                  placeholder="SCI-G7-XXXXXX"
                  autoComplete="off"
                  spellCheck={false}
                  className={`${fieldClassName} pl-9`}
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-11 shrink-0 rounded-2xl bg-brand-primary text-white shadow-md shadow-brand-primary/20 hover:bg-brand-primary/90 sm:min-w-[7.5rem]"
            >
              {isSubmitting ? "Joining..." : "Join class"}
            </Button>
          </form>
        </div>

        {enrolledClasses.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2">
            {enrolledClasses.map((row) => (
              <li
                key={row.class_code}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border border-brand-secondary/25 bg-white/90 px-4 py-3.5 shadow-sm"
                )}
              >
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-secondary text-brand-text shadow-md shadow-brand-secondary/25">
                  <BookOpen className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-semibold text-brand-text">
                    <CheckCircle2
                      className="size-4 text-brand-secondary"
                      aria-hidden
                    />
                    {row.class_name}
                  </p>
                  <p className="text-sm text-brand-text/60">
                    Grade {row.grade_level}
                    {row.subject ? ` · ${row.subject}` : ""}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-brand-primary">
                    {row.class_code}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {error ? (
        <p
          className="relative mt-4 rounded-xl border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          className="relative mt-4 rounded-xl border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-2 text-sm text-brand-text"
          role="status"
        >
          {success.message} You&apos;re in{" "}
          <span className="font-semibold">{success.className}</span>.
        </p>
      ) : null}
    </section>
  );
}
