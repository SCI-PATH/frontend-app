"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/common/BrandLockup";
import { StudentAvatar } from "@/components/common/StudentAvatar";
import { STUDENT_PROFILE_PATH } from "@/lib/auth-routes";
import { BASE_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";

export function Navbar() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const displayName = user?.name || "Alex Rivera";
  const grade = user?.grade || "Grade 7";

  function handleLogout() {
    logout();
    router.replace(BASE_PATH);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-surface bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-4 px-3 sm:px-5">
        <BrandLockup
          href="/dashboard"
          subtitle="Science for Grades 6–9"
          priority
        />

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden h-9 border-brand-primary/40 text-sm text-brand-primary hover:bg-brand-primary/5 sm:inline-flex"
          >
            Virtual Tour
          </Button>
          <Badge className="h-8 gap-1.5 rounded-full bg-brand-special/10 px-3 text-sm text-brand-special hover:bg-brand-special/10">
            <Trophy className="size-4" aria-hidden />
            1,250 XP
          </Badge>
            <Link
              href={STUDENT_PROFILE_PATH}
              className="flex items-center gap-2 pl-1"
              aria-label={`${displayName} profile`}
            >
              <div className="hidden text-right sm:block">
                <p className="text-base font-semibold leading-tight text-brand-text">
                  {displayName}
                </p>
                <p className="text-sm text-brand-text/50">{grade}</p>
              </div>
              <StudentAvatar size="sm" />
            </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-9 border-brand-surface text-brand-text hover:bg-brand-background"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
