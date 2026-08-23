"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/common/BrandLockup";
import { BASE_PATH, EDUCATOR_HOME_PATH } from "@/lib/auth-routes";
import { useUserStore } from "@/store/useUserStore";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function EducatorNavbar() {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const displayName = user?.name || "Educator";
  const subtitle = user?.sectionName || "Educator workspace";

  function handleLogout() {
    logout();
    router.replace(BASE_PATH);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-brand-surface bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-4 px-3 sm:px-5">
        <BrandLockup
          href={EDUCATOR_HOME_PATH}
          subtitle="Teacher workspace"
          priority
        />

        <div className="flex items-center gap-2 sm:gap-3">
          <Badge className="h-8 rounded-full bg-brand-special/10 px-3 text-sm text-brand-special hover:bg-brand-special/10">
            Educator
          </Badge>
          <div className="flex items-center gap-2 pl-1">
            <div className="hidden text-right sm:block">
              <p className="text-base font-semibold leading-tight text-brand-text">
                {displayName}
              </p>
              <p className="max-w-[14rem] truncate text-sm text-brand-text/50">
                {subtitle}
              </p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-brand-special/15 text-sm font-semibold text-brand-special">
                {initials(displayName) || "ED"}
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
