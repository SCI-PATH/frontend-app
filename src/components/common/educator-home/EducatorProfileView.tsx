"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  GraduationCap,
  Loader2,
  Mail,
  Save,
  School,
  Sparkles,
} from "lucide-react";

import { EducatorNavbar } from "@/components/common/educator-home/EducatorNavbar";
import { TeacherAvatarPicker } from "@/components/common/educator-home/TeacherAvatarPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchCurrentUser, updateTeacherProfile } from "@/lib/user-management";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

const GRADE_NUMBERS = [6, 7, 8, 9] as const;

const fieldClassName =
  "h-11 border-brand-surface bg-brand-background/70 text-brand-text placeholder:text-brand-text/40 transition-colors focus-visible:border-brand-special focus-visible:bg-white focus-visible:ring-brand-special/25";

export function EducatorProfileView() {
  const user = useUserStore((state) => state.user);
  const token = useUserStore((state) => state.token);
  const setSession = useUserStore((state) => state.setSession);

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [sectionName, setSectionName] = useState(user?.sectionName ?? "");
  const [gradesTaught, setGradesTaught] = useState<number[]>(
    user?.gradesTaught ?? []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    void fetchCurrentUser(token)
      .then((account) => {
        if (!cancelled) setSession({ user: account });
      })
      .catch(() => {
        // Keep the persisted session if /users/me is unavailable.
      });
    return () => {
      cancelled = true;
    };
  }, [setSession, token]);

  useEffect(() => {
    setFullName(user?.name ?? "");
    setSectionName(user?.sectionName ?? "");
    setGradesTaught(user?.gradesTaught ?? []);
  }, [user?.gradesTaught, user?.name, user?.sectionName]);

  function toggleGrade(grade: number) {
    setGradesTaught((current) =>
      current.includes(grade)
        ? current.filter((value) => value !== grade)
        : [...current, grade].sort((a, b) => a - b)
    );
  }

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

    const sections = sectionName
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    setIsSaving(true);
    setError(null);
    setSaved(false);
    try {
      const nextUser = await updateTeacherProfile(token, {
        fullName: name,
        gradesTaught,
        classSections: sections,
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
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <EducatorNavbar />
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-3 py-6 sm:px-5">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-special via-brand-primary to-brand-accent px-5 py-7 text-white sm:px-8 sm:py-8">
          <div
            className="pointer-events-none absolute -right-12 -top-16 size-56 rounded-full bg-white/20 blur-2xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-8 left-1/3 size-40 rounded-full bg-brand-secondary/30 blur-3xl"
            aria-hidden
          />

          <div className="relative flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-3 text-center lg:text-left">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold uppercase tracking-wide">
                <Sparkles className="size-4" aria-hidden />
                Educator profile
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {user?.name || "Your profile"}
              </h1>
              <p className="max-w-md text-base text-white/90">
                Pick a look, then keep your teaching details up to date for your
                classes.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 lg:justify-start">
                {user?.email ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm">
                    <Mail className="size-3.5" aria-hidden />
                    {user.email}
                  </span>
                ) : null}
                {user?.schoolName ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm">
                    <School className="size-3.5" aria-hidden />
                    {user.schoolName}
                  </span>
                ) : null}
              </div>
            </div>
            <TeacherAvatarPicker />
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-brand-special/15 bg-gradient-to-br from-white to-brand-special/5 p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
                Account
              </p>
              <h2 className="text-xl font-semibold text-brand-text">
                Profile details
              </h2>
              <p className="mt-1 text-sm text-brand-text/60">
                Name, grades, and class sections are saved to User Management.
              </p>
            </div>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-brand-special text-white hover:bg-brand-special/90"
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              {isSaving ? "Saving…" : "Save changes"}
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-sm font-medium text-brand-text">
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
              <span className="text-sm font-medium text-brand-text">Email</span>
              <Input
                value={user?.email ?? ""}
                readOnly
                className={cn(fieldClassName, "cursor-not-allowed opacity-80")}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-brand-text">School</span>
              <Input
                value={user?.schoolName ?? ""}
                readOnly
                placeholder="Set at signup"
                className={cn(fieldClassName, "cursor-not-allowed opacity-80")}
              />
            </label>

            <label className="block space-y-1.5 sm:col-span-2">
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-text">
                <GraduationCap className="size-4 text-brand-special" aria-hidden />
                Class sections
              </span>
              <Input
                value={sectionName}
                onChange={(event) => setSectionName(event.target.value)}
                placeholder="e.g. 7A, 8B"
                className={fieldClassName}
              />
            </label>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-medium text-brand-text">
              Grades taught
            </legend>
            <div className="flex flex-wrap gap-2">
              {GRADE_NUMBERS.map((grade) => {
                const selected = gradesTaught.includes(grade);
                return (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => toggleGrade(grade)}
                    aria-pressed={selected}
                    className={cn(
                      "h-11 min-w-[6.5rem] rounded-2xl border px-4 text-sm font-semibold transition-colors",
                      selected
                        ? "border-brand-special bg-brand-special text-white shadow-sm shadow-brand-special/25"
                        : "border-brand-surface bg-white text-brand-text hover:border-brand-special/40 hover:bg-brand-special/5"
                    )}
                  >
                    Grade {grade}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {error ? (
            <p className="mt-4 text-sm text-brand-accent" role="alert">
              {error}
            </p>
          ) : null}
          {saved ? (
            <p className="mt-4 text-sm font-medium text-brand-secondary">
              Profile saved.
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}
