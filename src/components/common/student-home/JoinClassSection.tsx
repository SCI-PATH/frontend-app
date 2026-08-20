"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, KeyRound, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinClass } from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";

const fieldClassName =
  "h-11 border-brand-surface bg-brand-background/70 font-mono uppercase tracking-wide text-brand-text placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-brand-text/40 transition-colors focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-brand-primary/25";

export function JoinClassSection() {
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

  const joinedCode = success?.code || user?.classCode;

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
        setSession({
          user: { ...user, classCode: result.classInfo.class_code },
        });
      }
      setClassCode("");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not join that class."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-brand-primary/20 bg-gradient-to-r from-brand-primary/8 via-white to-brand-secondary/10 px-6 py-6 sm:px-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-primary">
            <Users className="size-4" aria-hidden />
            Classroom
          </p>
          <h2 className="text-lg font-semibold text-brand-text sm:text-xl">
            Join your teacher&apos;s class
          </h2>
          <p className="max-w-xl text-sm text-brand-text/65 sm:text-base">
            Ask your teacher for a code like{" "}
            <span className="font-mono text-brand-primary">SCI-G7-A4K9ZX</span>
            . Your grade must match the class grade to enrol.
          </p>
          {joinedCode ? (
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-secondary">
              <CheckCircle2 className="size-4" aria-hidden />
              Linked class:{" "}
              <span className="font-mono text-brand-text">{joinedCode}</span>
              {success?.className ? (
                <span className="font-sans font-normal text-brand-text/60">
                  · {success.className}
                </span>
              ) : null}
            </p>
          ) : null}
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
              Class code
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
            className="h-11 shrink-0 bg-brand-primary text-white hover:bg-brand-primary/90 sm:min-w-[7.5rem]"
          >
            {isSubmitting ? "Joining..." : "Join class"}
          </Button>
        </form>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          className="mt-4 rounded-lg border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-2 text-sm text-brand-text"
          role="status"
        >
          {success.message} You&apos;re in{" "}
          <span className="font-semibold">{success.className}</span>.
        </p>
      ) : null}
    </section>
  );
}
