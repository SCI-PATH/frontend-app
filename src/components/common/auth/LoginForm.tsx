"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUserStore } from "@/store/useUserStore";
import type { User, UserRole } from "@/types";

const fieldClassName =
  "h-10 border-brand-surface bg-brand-background/70 text-brand-text placeholder:text-brand-text/40 transition-colors focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-brand-primary/25";

function resolveMockRole(identifier: string): UserRole {
  const value = identifier.toLowerCase();
  if (value.includes("educator") || value.includes("teacher")) {
    return "educator";
  }
  return "student";
}

function createMockToken(): string {
  return `mock-jwt.${btoa(`sci-path:${Date.now()}`)}.token`;
}

export function LoginForm() {
  const router = useRouter();
  const login = useUserStore((state) => state.login);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError("Please enter your email/username and password.");
      return;
    }

    setIsSubmitting(true);

    // Simulate network auth delay
    await new Promise((resolve) => setTimeout(resolve, 400));

    const role = resolveMockRole(identifier);
    const email = identifier.includes("@")
      ? identifier.trim()
      : `${identifier.trim().toLowerCase()}@sci-path.local`;

    const userData: User = {
      id: `user_${Date.now()}`,
      name: identifier.includes("@")
        ? identifier.split("@")[0]
        : identifier.trim(),
      email,
      role,
      ...(role === "student"
        ? { grade: "Grade 7" as const, classCode: "SCI101" }
        : {
            schoolName: "SCI-PATH Middle School",
            sectionName: "Grade 7 Science - Section A",
          }),
    };

    login(userData, createMockToken());
    router.push(role === "educator" ? "/matrix" : "/dashboard");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="rounded-xl border border-brand-primary/15 bg-brand-primary/5 px-3 py-2.5">
        <p className="flex items-center gap-2 text-sm font-medium text-brand-text">
          <Sparkles className="size-4 text-brand-accent" aria-hidden />
          Welcome back
        </p>
        <p className="mt-0.5 text-xs text-brand-text/60">
          Tip: use an email with{" "}
          <span className="font-medium text-brand-special">educator</span> to
          open the teacher matrix.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="login-identifier"
          className="text-sm font-medium text-brand-text"
        >
          Email / Username
        </label>
        <Input
          id="login-identifier"
          type="text"
          autoComplete="username"
          placeholder="student@school.edu or educator@school.edu"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          className={fieldClassName}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="login-password"
          className="text-sm font-medium text-brand-text"
        >
          Password
        </label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={fieldClassName}
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 text-brand-text/80">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="size-4 rounded border-brand-surface accent-brand-primary"
          />
          Remember Me
        </label>
        <Link
          href="#"
          className="font-medium text-brand-primary transition-colors hover:text-brand-special hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

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
        className="h-10 w-full bg-brand-primary text-white shadow-md shadow-brand-primary/25 transition-all hover:bg-brand-primary/90 hover:shadow-brand-primary/35"
      >
        {isSubmitting ? (
          "Signing in..."
        ) : (
          <span className="inline-flex items-center gap-1.5">
            Sign In
            <ArrowRight className="size-4" aria-hidden />
          </span>
        )}
      </Button>

      <div className="relative pt-1 text-center">
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,#00A8E855,#70E00055,#FF6B3555,transparent)]"
        />
        <p className="pt-4 text-sm text-brand-text/70">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand-primary transition-colors hover:text-brand-special hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}
