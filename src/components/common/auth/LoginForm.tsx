"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginUser } from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";

const fieldClassName =
  "h-10 border-brand-surface bg-brand-background/70 text-brand-text placeholder:text-brand-text/40 transition-colors focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-brand-primary/25";

export function LoginForm({ registrationComplete = false }: { registrationComplete?: boolean }) {
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
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await loginUser(identifier.trim(), password);
      login(session.user, session.token);
      router.push(session.user.role === "educator" ? "/matrix" : "/dashboard");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Could not sign in.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="rounded-xl border border-brand-primary/15 bg-brand-primary/5 px-3 py-2.5">
        <p className="flex items-center gap-2 text-sm font-medium text-brand-text">
          <Sparkles className="size-4 text-brand-accent" aria-hidden />
          Welcome back
        </p>
        <p className="mt-0.5 text-xs text-brand-text/60">
          Sign in with your SCI-PATH student or teacher account.
        </p>
      </div>

      {registrationComplete ? (
        <p
          className="rounded-lg border border-brand-secondary/30 bg-brand-secondary/10 px-3 py-2 text-sm text-brand-text"
          role="status"
        >
          Account created successfully. Log in to continue.
        </p>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor="login-identifier"
          className="text-sm font-medium text-brand-text"
        >
          Email
        </label>
        <Input
          id="login-identifier"
          type="email"
          autoComplete="username"
          placeholder="student@school.edu"
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
