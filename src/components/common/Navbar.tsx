"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Trophy } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LOGIN_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Navbar() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const displayName = user?.name || "Alex Rivera";
  const grade = user?.grade || "Grade 7";

  function handleLogout() {
    logout();
    router.replace(LOGIN_PATH);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-surface bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-4 px-3 sm:px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/brand/sci-path-mark.png"
            alt="SCI-PATH"
            width={48}
            height={48}
            className="size-12 rounded-xl bg-white object-contain"
            priority
          />
          <span className="flex flex-col leading-tight">
            <span className="text-xl font-bold tracking-tight text-brand-primary">
              SCI-PATH
            </span>
            <span className="hidden text-sm text-brand-text/55 sm:inline">
              Science for Grades 6–9
            </span>
          </span>
        </Link>

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
          <div className="flex items-center gap-2 pl-1">
            <div className="hidden text-right sm:block">
              <p className="text-base font-semibold leading-tight text-brand-text">
                {displayName}
              </p>
              <p className="text-sm text-brand-text/50">{grade}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-brand-primary/15 text-sm font-semibold text-brand-primary">
                {initials(displayName) || "AR"}
              </AvatarFallback>
            </Avatar>
          </div>
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
