import { Compass, GraduationCap, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZE_CONFIG = {
  sm: { container: "size-9", icon: "size-4", sparkle: "size-2.5" },
  md: { container: "size-11", icon: "size-5", sparkle: "size-3" },
  lg: { container: "size-16", icon: "size-7", sparkle: "size-3.5" },
  xl: { container: "size-20 sm:size-24", icon: "size-9 sm:size-11", sparkle: "size-4" },
} as const;

type RoleAvatarSize = keyof typeof SIZE_CONFIG;
type UserRole = "student" | "educator";

interface RoleAvatarProps {
  role: UserRole;
  size?: RoleAvatarSize;
  className?: string;
  showRing?: boolean;
}

/** Role-specific profile avatar — distinct from the SCI PATH app logo. */
export function RoleAvatar({
  role,
  size = "md",
  className,
  showRing = false,
}: RoleAvatarProps) {
  const cfg = SIZE_CONFIG[size];
  const isStudent = role === "student";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full",
        isStudent
          ? "bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/30"
          : "bg-gradient-to-br from-brand-special to-brand-primary text-white shadow-lg shadow-brand-special/30",
        cfg.container,
        showRing && "ring-4 ring-white/40",
        className
      )}
      aria-hidden
    >
      {isStudent ? (
        <Compass className={cn(cfg.icon, "drop-shadow-sm")} strokeWidth={2.25} />
      ) : (
        <GraduationCap className={cn(cfg.icon, "drop-shadow-sm")} strokeWidth={2.25} />
      )}
      {isStudent ? (
        <Sparkles
          className={cn(
            "absolute -top-0.5 -right-0.5 text-brand-accent drop-shadow-sm",
            cfg.sparkle
          )}
        />
      ) : null}
    </div>
  );
}
