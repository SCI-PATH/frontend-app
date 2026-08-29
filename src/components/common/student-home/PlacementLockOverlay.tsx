import type { ReactNode } from "react";
import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type PlacementLockOverlayProps = {
  locked: boolean;
  children: ReactNode;
  className?: string;
};

export function PlacementLockOverlay({
  locked,
  children,
  className,
}: PlacementLockOverlayProps) {
  return (
    <div className={cn("relative h-full min-h-[22rem]", className)}>
      <div
        className={cn(
          "h-full transition-[filter,opacity] duration-300",
          locked && "pointer-events-none select-none opacity-55 blur-[1px]"
        )}
      >
        {children}
      </div>
      {locked ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[1.75rem] bg-gradient-to-b from-white/55 via-white/75 to-white/85 backdrop-blur-[2px]">
          <div className="mx-4 flex max-w-[13rem] flex-col items-center rounded-2xl border border-brand-gold/25 bg-white/90 px-4 py-4 text-center shadow-lg shadow-brand-gold/10">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-gold/25 to-brand-gold/10 ring-2 ring-brand-gold/30">
              <Lock className="size-6 text-brand-gold" aria-hidden />
            </span>
            <p className="mt-2.5 text-sm font-bold text-brand-text">
              Finish aptitude first
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-brand-text/60">
              Complete placement to unlock this hub card.
            </p>
            <Link
              href="/assessment/amplitude"
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-brand-gold px-3 py-1.5 text-[11px] font-semibold text-brand-text shadow-sm transition hover:bg-brand-gold/90"
            >
              <Sparkles className="size-3.5" aria-hidden />
              Start aptitude
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
