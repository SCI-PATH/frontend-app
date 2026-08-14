import { Atom, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface SocratesAvatarProps {
  size?: "sm" | "md";
  className?: string;
  showStatus?: boolean;
}

const sizeClass = {
  sm: "size-8",
  md: "size-11",
} as const;

const iconClass = {
  sm: "size-4",
  md: "size-5",
} as const;

export function SocratesAvatar({
  size = "md",
  className,
  showStatus = false,
}: SocratesAvatarProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-brand-special text-white shadow-md shadow-brand-special/25",
          sizeClass[size]
        )}
        aria-hidden
      >
        <Atom className={cn(iconClass[size], "animate-[spin_12s_linear_infinite]")} />
        <Sparkles
          className={cn(
            "absolute -top-0.5 -right-0.5 text-white drop-shadow-sm",
            size === "md" ? "size-3.5" : "size-2.5"
          )}
        />
      </div>
      {showStatus ? (
        <span className="absolute -right-0.5 -bottom-0.5 flex size-3">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand-secondary opacity-70" />
          <span className="relative inline-flex size-3 rounded-full bg-brand-secondary ring-2 ring-white" />
        </span>
      ) : null}
    </div>
  );
}
