import Image from "next/image";
import { Compass, GraduationCap, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

const SIZE_CONFIG = {
  sm: { container: "size-9", icon: "size-4", sparkle: "size-2.5", image: "36px" },
  md: { container: "size-11", icon: "size-5", sparkle: "size-3", image: "44px" },
  lg: { container: "size-16", icon: "size-7", sparkle: "size-3.5", image: "64px" },
  xl: { container: "size-24 sm:size-28", icon: "size-9 sm:size-11", sparkle: "size-4", image: "112px" },
  hero: { container: "size-32 sm:size-40", icon: "size-12", sparkle: "size-5", image: "160px" },
} as const;

type RoleAvatarSize = keyof typeof SIZE_CONFIG;
type UserRole = "student" | "educator";

interface RoleAvatarProps {
  role: UserRole;
  size?: RoleAvatarSize;
  className?: string;
  showRing?: boolean;
  /** Illustrated student avatar from `/public/brand`. */
  src?: string;
  alt?: string;
}

/** Role-specific profile avatar — distinct from the SCI PATH app logo. */
export function RoleAvatar({
  role,
  size = "md",
  className,
  showRing = false,
  src,
  alt = "",
}: RoleAvatarProps) {
  const cfg = SIZE_CONFIG[size];
  const isStudent = role === "student";

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        src
          ? "bg-white shadow-md shadow-brand-special/20"
          : isStudent
            ? "bg-gradient-to-br from-brand-primary to-brand-secondary text-white shadow-lg shadow-brand-primary/30"
            : "bg-gradient-to-br from-brand-special to-brand-primary text-white shadow-lg shadow-brand-special/30",
        cfg.container,
        showRing && "ring-4 ring-white/40",
        className
      )}
      aria-hidden={!alt}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={cfg.image}
          className="object-cover object-top scale-[1.08]"
        />
      ) : isStudent ? (
        <Compass className={cn(cfg.icon, "drop-shadow-sm")} strokeWidth={2.25} />
      ) : (
        <GraduationCap className={cn(cfg.icon, "drop-shadow-sm")} strokeWidth={2.25} />
      )}
      {!src && isStudent ? (
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
