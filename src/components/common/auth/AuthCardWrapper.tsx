import type { ReactNode } from "react";

import { AuthBrandHeader } from "@/components/common/auth/AuthBrandHeader";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardWrapperProps {
  children: ReactNode;
  className?: string;
}

export function AuthCardWrapper({ children, className }: AuthCardWrapperProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-full flex-1 items-center justify-center overflow-hidden bg-brand-background px-4 py-10",
        className
      )}
    >
      {/* Soft brand atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E826,_transparent_45%),radial-gradient(ellipse_at_bottom_right,_#70E00022,_transparent_40%),radial-gradient(ellipse_at_top_right,_#FF6B351A,_transparent_35%),radial-gradient(ellipse_at_bottom_left,_#7209B714,_transparent_40%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-brand-primary/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 -left-16 size-64 rounded-full bg-brand-secondary/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 top-1/3 size-56 rounded-full bg-brand-accent/15 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col gap-8">
        <AuthBrandHeader />

        <Card
          className={cn(
            "overflow-hidden border border-brand-surface/80 bg-white/95 shadow-[0_18px_50px_-28px_rgba(0,168,232,0.45)] ring-0 backdrop-blur-sm",
            "animate-in fade-in zoom-in-95 duration-500"
          )}
        >
          <BrandGradientBar />
          <CardContent className="px-6 pt-6 pb-6">{children}</CardContent>
        </Card>
      </div>
    </div>
  );
}
