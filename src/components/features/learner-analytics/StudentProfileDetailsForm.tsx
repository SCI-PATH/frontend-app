"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateStudentProfile } from "@/lib/user-management";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";
import type { GradeLevel } from "@/types";

const GRADE_OPTIONS: GradeLevel[] = ["Grade 6", "Grade 7", "Grade 8", "Grade 9"];

const fieldClassName =
  "h-10 border-brand-surface bg-brand-background/70 text-brand-text placeholder:text-brand-text/40 transition-colors focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-brand-primary/25";

export function StudentProfileDetailsForm() {
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
  const [saved, setSaved] = useState(false);

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
    setSaved(false);
    try {
      const nextUser = await updateStudentProfile(token, {
        fullName: name,
        grade: gradeNumber,
        prevYearScienceMarks: parsedMarks,
      });
      setSession({ user: nextUser });
      setSaved(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save your profile."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-brand-primary/20 bg-white p-5 sm:p-6"
    >
      <h2 className="text-lg font-semibold text-brand-text">Profile details</h2>
      <p className="mb-4 text-sm text-brand-text/60">
        Update the name and grade stored in your SCI-PATH account.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-brand-text">Full name</span>
          <Input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={fieldClassName}
            autoComplete="name"
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-brand-text">Email</span>
          <Input
            value={user?.email ?? ""}
            readOnly
            className={cn(fieldClassName, "cursor-not-allowed opacity-80")}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-brand-text">Grade</span>
          <select
            value={grade}
            onChange={(event) => setGrade(event.target.value as GradeLevel)}
            className={cn(
              fieldClassName,
              "w-full rounded-lg border px-2.5 text-sm outline-none"
            )}
          >
            {GRADE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-brand-text">
            Previous-year science marks
          </span>
          <Input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={marks}
            onChange={(event) => setMarks(event.target.value)}
            placeholder="Optional, 0–100"
            className={fieldClassName}
          />
        </label>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-brand-accent" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-3 text-sm font-medium text-brand-secondary">
          Profile saved.
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isSaving}
        className="mt-5 bg-brand-primary text-white hover:bg-brand-primary/90"
      >
        {isSaving ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Save className="size-4" aria-hidden />
        )}
        {isSaving ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
