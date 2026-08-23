"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { GraduationCap, School } from "lucide-react";

import { RedirectToHomeIfAuthenticated } from "@/components/common/auth/RedirectToHomeIfAuthenticated";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LOGIN_PATH } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";
import { signupStudent, signupTeacher } from "@/lib/user-management";
import type { GradeLevel, UserRole } from "@/types";

const GRADE_OPTIONS: GradeLevel[] = [
  "Grade 6",
  "Grade 7",
  "Grade 8",
  "Grade 9",
];

const fieldClassName =
  "h-10 border-brand-surface bg-brand-background/70 text-brand-text placeholder:text-brand-text/40 transition-colors focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-brand-primary/25";

export function SignupForm() {
  const router = useRouter();

  const [role, setRole] = useState<UserRole>("student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [grade, setGrade] = useState<GradeLevel>("Grade 7");
  const [classCode, setClassCode] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [sectionName, setSectionName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!acceptedTerms) {
      setError("Please accept the Terms and Conditions.");
      return;
    }

    if (role === "educator" && (!schoolName.trim() || !sectionName.trim())) {
      setError("Please enter your school and section details.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session =
        role === "student"
          ? await signupStudent({
              fullName: fullName.trim(),
              email: email.trim(),
              password,
              grade: Number(grade.replace(/\D/g, "")),
              classCode: classCode.trim() || undefined,
            })
          : await signupTeacher({
              fullName: fullName.trim(),
              email: email.trim(),
              password,
              sectionName: sectionName.trim(),
              schoolName: schoolName.trim(),
            });
      void session;
      router.push(`${LOGIN_PATH}?registered=1`);
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : "Could not create account.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500"
    >
      <RedirectToHomeIfAuthenticated />
      <div
        className="grid grid-cols-2 gap-1 rounded-xl bg-brand-surface p-1"
        role="tablist"
        aria-label="Account role"
      >
        <button
          type="button"
          role="tab"
          aria-selected={role === "student"}
          onClick={() => setRole("student")}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            role === "student"
              ? "bg-brand-primary text-white shadow-sm shadow-brand-primary/30"
              : "bg-transparent text-brand-text/70 hover:bg-white/70 hover:text-brand-text"
          )}
        >
          <GraduationCap className="size-4" aria-hidden />
          Student
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={role === "educator"}
          onClick={() => setRole("educator")}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
            role === "educator"
              ? "bg-brand-special text-white shadow-sm shadow-brand-special/30"
              : "bg-transparent text-brand-text/70 hover:bg-white/70 hover:text-brand-text"
          )}
        >
          <School className="size-4" aria-hidden />
          Educator
        </button>
      </div>

      <div
        className={cn(
          "rounded-xl border px-3 py-2 text-xs",
          role === "student"
            ? "border-brand-secondary/30 bg-brand-secondary/10 text-brand-text/75"
            : "border-brand-special/25 bg-brand-special/8 text-brand-text/75"
        )}
      >
        {role === "student" ? (
          <>
            Join your class with a code and start building mastery along your{" "}
            <span className="font-medium text-brand-secondary">
              science pathway
            </span>
            .
          </>
        ) : (
          <>
            Set up your classroom overview and guide learners with{" "}
            <span className="font-medium text-brand-special">SCI-PATH</span>{" "}
            insights.
          </>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="signup-name"
          className="text-sm font-medium text-brand-text"
        >
          Full Name
        </label>
        <Input
          id="signup-name"
          type="text"
          autoComplete="name"
          placeholder="Alex Rivera"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          className={fieldClassName}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="signup-email"
          className="text-sm font-medium text-brand-text"
        >
          Email
        </label>
        <Input
          id="signup-email"
          type="email"
          autoComplete="email"
          placeholder="you@school.edu"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={fieldClassName}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor="signup-password"
            className="text-sm font-medium text-brand-text"
          >
            Password
          </label>
          <Input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClassName}
          />
        </div>
        <div className="space-y-1.5">
          <label
            htmlFor="signup-confirm-password"
            className="text-sm font-medium text-brand-text"
          >
            Confirm Password
          </label>
          <Input
            id="signup-confirm-password"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={fieldClassName}
          />
        </div>
      </div>

      {role === "student" ? (
        <div className="space-y-4 rounded-xl border border-brand-secondary/25 bg-brand-secondary/5 p-3">
          <p className="text-xs font-semibold tracking-wide text-brand-secondary uppercase">
            Student details
          </p>
          <div className="space-y-1.5">
            <label
              htmlFor="signup-grade"
              className="text-sm font-medium text-brand-text"
            >
              Grade Level
            </label>
            <select
              id="signup-grade"
              value={grade}
              onChange={(event) => setGrade(event.target.value as GradeLevel)}
              className="h-10 w-full rounded-lg border border-brand-surface bg-brand-background/70 px-2.5 text-sm text-brand-text outline-none transition-colors focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-3 focus-visible:ring-brand-primary/25"
            >
              {GRADE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="signup-class-code"
              className="text-sm font-medium text-brand-text"
            >
              Class Code <span className="font-normal text-brand-text/50">(optional)</span>
            </label>
            <Input
              id="signup-class-code"
              type="text"
              placeholder="SCI-G7-A4K9 — leave blank for self-study"
              value={classCode}
              onChange={(event) => setClassCode(event.target.value)}
              className={fieldClassName}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4 rounded-xl border border-brand-special/20 bg-brand-special/5 p-3">
          <p className="text-xs font-semibold tracking-wide text-brand-special uppercase">
            Educator details
          </p>
          <div className="space-y-1.5">
            <label
              htmlFor="signup-school"
              className="text-sm font-medium text-brand-text"
            >
              School / Institution Name
            </label>
            <Input
              id="signup-school"
              type="text"
              placeholder="Sunrise Middle School"
              value={schoolName}
              onChange={(event) => setSchoolName(event.target.value)}
              className={fieldClassName}
            />
          </div>
          <div className="space-y-1.5">
            <label
              htmlFor="signup-section"
              className="text-sm font-medium text-brand-text"
            >
              Class Section Name
            </label>
            <Input
              id="signup-section"
              type="text"
              placeholder="Grade 7 Science - Section B"
              value={sectionName}
              onChange={(event) => setSectionName(event.target.value)}
              className={fieldClassName}
            />
          </div>
        </div>
      )}

      <label className="flex items-start gap-2 rounded-lg border border-brand-surface bg-brand-background/50 px-3 py-2.5 text-sm text-brand-text/80">
        <input
          type="checkbox"
          checked={acceptedTerms}
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          className="mt-0.5 size-4 rounded border-brand-surface accent-brand-primary"
        />
        <span>
          I agree to the{" "}
          <Link
            href="#"
            className="font-medium text-brand-primary transition-colors hover:text-brand-special hover:underline"
          >
            Terms and Conditions
          </Link>
        </span>
      </label>

      {error ? (
        <p
          className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={isSubmitting}
        className={cn(
          "h-10 w-full text-white shadow-md transition-all",
          role === "student"
            ? "bg-brand-primary shadow-brand-primary/25 hover:bg-brand-primary/90 hover:shadow-brand-primary/35"
            : "bg-brand-special shadow-brand-special/25 hover:bg-brand-special/90 hover:shadow-brand-special/35"
        )}
      >
        {isSubmitting ? "Creating account..." : "Create Account"}
      </Button>

      <div className="relative pt-1 text-center">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#00A8E855,#7209B755,#FF6B3555,transparent)]"
        />
        <p className="pt-4 text-sm text-brand-text/70">
          Already have an account?{" "}
          <Link
            href={LOGIN_PATH}
            className="font-semibold text-brand-primary transition-colors hover:text-brand-special hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </form>
  );
}
