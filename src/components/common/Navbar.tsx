"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/common/BrandLockup";
import { StudentAvatar } from "@/components/common/StudentAvatar";
import { BASE_PATH, STUDENT_PROFILE_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";

export function Navbar() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const displayName = (user?.name || "Student").trim();
  const gradeLabel =
    typeof user?.grade === "number"
      ? `Grade ${user.grade}`
      : user?.grade || "Grades 6–9";

  function handleLogout() {
    logout();
    router.replace(BASE_PATH);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-surface bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:h-[4.25rem] sm:gap-4 sm:px-5">
        <BrandLockup
          href="/dashboard"
          subtitle="Science for Grades 6–9"
          priority
          className="min-w-0 shrink"
        />

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Badge className="hidden h-8 gap-1.5 rounded-full bg-brand-special/10 px-3 text-sm font-semibold text-brand-special hover:bg-brand-special/10 sm:inline-flex">
            <Trophy className="size-3.5" aria-hidden />
            1,250 XP
          </Badge>

          <Link
            href={STUDENT_PROFILE_PATH}
            className="flex min-w-0 items-center gap-2.5 rounded-xl px-1 py-1 transition-colors hover:bg-brand-background"
            aria-label={`${displayName} profile`}
          >
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold leading-tight whitespace-nowrap text-brand-text">
                {displayName}
              </p>
              <p className="truncate text-xs leading-tight whitespace-nowrap text-brand-text/50">
                {gradeLabel}
              </p>
            </div>
            <StudentAvatar size="sm" />
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="h-9 shrink-0 gap-1.5 border-brand-surface bg-white px-2.5 text-brand-text hover:bg-brand-background sm:px-3"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
