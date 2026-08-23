import Link from "next/link";
import type { ReactNode } from "react";

import { AppLogo } from "@/components/common/AppLogo";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  subtitle?: string;
  href?: string;
  size?: "sm" | "md";
  className?: string;
  showTagline?: boolean;
  priority?: boolean;
}

export function BrandLockup({
  subtitle,
  href,
  size = "md",
  className,
  showTagline = false,
  priority,
}: BrandLockupProps) {
  const content: ReactNode = (
    <span className={cn("flex items-center gap-3", className)}>
      <AppLogo size={size === "sm" ? "md" : "lg"} priority={priority} />
      <span className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-bold tracking-tight text-brand-primary",
            size === "sm" ? "text-lg" : "text-xl"
          )}
        >
          {APP_NAME}
        </span>
        {(subtitle || showTagline) && (
          <span className="hidden text-sm text-brand-text/55 sm:inline">
            {subtitle ?? APP_TAGLINE}
          </span>
        )}
      </span>
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
