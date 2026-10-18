"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { updateStudentProfile } from "@/lib/user-management";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import type { GradeLevel } from "@/types";

const GRADE_OPTIONS: GradeLevel[] = ["Grade 6", "Grade 7", "Grade 8", "Grade 9"];

const fieldClassName =
  "h-10 border-brand-surface bg-white text-brand-text placeholder:text-brand-text/35 shadow-none transition-colors focus-visible:border-brand-primary focus-visible:ring-brand-primary/20";

export function StudentProfileDetailsForm({
  onSaved,
}: {
  onSaved?: () => void;
}) {
  const user = useUserStore((state) => state.user);
  const token = useUserStore((state) => state.token);
  const setSession = useUserStore((state) => state.setSession);

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [grade, setGrade] = useState<GradeLevel>(user?.grade ?? "Grade 7");
  const [marks, setMarks] = useState(
    user?.prevYearScienceMarks != null ? String(user.prevYearScienceMarks) : ""
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFullName(user?.name ?? "");
    setGrade(user?.grade ?? "Grade 7");
    setMarks(
      user?.prevYearScienceMarks != null ? String(user.prevYearScienceMarks) : ""
    );
  }, [user?.grade, user?.name, user?.prevYearScienceMarks]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("Sign in to update your profile.");
      return;
    }

    const name = fullName.trim();
    if (!name) {
      setError("Please enter your name.");
      return;
    }

    const gradeNumber = Number(grade.replace(/\D/g, ""));
    let parsedMarks: number | null | undefined = undefined;
    if (marks.trim() === "") {
      parsedMarks = null;
    } else {
      const value = Number(marks);
      if (Number.isNaN(value) || value < 0 || value > 100) {
        setError("Previous-year marks must be a number from 0 to 100.");
        return;
      }
      parsedMarks = value;
    }

    setIsSaving(true);
    setError(null);
    try {
      const nextUser = await updateStudentProfile(token, {
        fullName: name,
        grade: gradeNumber,
        prevYearScienceMarks: parsedMarks,
      });
      setSession({ user: nextUser });
      onSaved?.();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save your profile."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold tracking-wide text-brand-text/55 uppercase">
          Full name
        </span>
        <Input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className={fieldClassName}
          autoComplete="name"
          required
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold tracking-wide text-brand-text/55 uppercase">
          Email
        </span>
        <div className="relative">
          <Input
            value={user?.email ?? ""}
            readOnly
            className={cn(
              fieldClassName,
              "cursor-default bg-brand-background/80 pr-9 text-brand-text/70"
            )}
          />
          <Lock
            className="pointer-events-none absolute top-1/2 right-3 size-3.5 -translate-y-1/2 text-brand-text/35"
            aria-hidden
          />
        </div>
        <p className="text-xs text-brand-text/45">Tied to your login.</p>
      </label>

      <fieldset className="space-y-1.5">
        <legend className="text-xs font-semibold tracking-wide text-brand-text/55 uppercase">
          Grade
        </legend>
        <div className="grid grid-cols-4 gap-2">
          {GRADE_OPTIONS.map((option) => {
            const selected = grade === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setGrade(option)}
                className={cn(
                  "rounded-xl border px-2 py-2 text-sm font-semibold transition-colors",
                  selected
                    ? "border-brand-primary bg-brand-primary text-white shadow-sm"
                    : "border-brand-surface bg-brand-background/60 text-brand-text hover:border-brand-primary/40 hover:bg-white"
                )}
              >
                {option.replace("Grade ", "")}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold tracking-wide text-brand-text/55 uppercase">
          Previous-year science marks
        </span>
        <div className="relative">
          <Input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={marks}
            onChange={(event) => setMarks(event.target.value)}
            placeholder="Optional"
            className={cn(fieldClassName, "pr-14")}
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs font-medium text-brand-text/40">
            / 100
          </span>
        </div>
      </label>

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2 border-t border-brand-surface pt-4">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </DialogClose>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : null}
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
