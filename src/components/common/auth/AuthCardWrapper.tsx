import type { ReactNode } from "react";
import { Atom, FlaskConical } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardWrapperProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

export function AuthCardWrapper({
  children,
  title = "SCI-PATH",
  subtitle = "Adaptive science pathways for grades 6–9",
  className,
}: AuthCardWrapperProps) {
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

      <Card
        className={cn(
          "relative z-10 w-full max-w-md overflow-hidden border border-brand-surface/80 bg-white/95 shadow-[0_18px_50px_-28px_rgba(0,168,232,0.45)] ring-0 backdrop-blur-sm",
          "animate-in fade-in zoom-in-95 duration-500"
        )}
      >
        <div
          aria-hidden
          className="h-1.5 w-full bg-[linear-gradient(90deg,#00A8E8_0%,#70E000_35%,#FF6B35_70%,#7209B7_100%)]"
        />

        <CardHeader className="items-center gap-3 pt-6 text-center">
          <div className="relative">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#00A8E8_0%,#7209B7_100%)] text-white shadow-md shadow-brand-primary/25">
              <FlaskConical className="size-7" aria-hidden />
            </div>
            <span className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-brand-secondary text-white shadow-sm ring-2 ring-white">
              <Atom className="size-3.5" aria-hidden />
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl font-semibold tracking-tight text-brand-text">
                {title}
              </CardTitle>
              <span className="rounded-md bg-brand-special/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-brand-special uppercase ring-1 ring-brand-special/20">
                Science
              </span>
            </div>
            <CardDescription className="text-brand-text/65">
              {subtitle}
            </CardDescription>
          </div>

          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2 rounded-full bg-brand-primary" />
            <span className="size-2 rounded-full bg-brand-secondary" />
            <span className="size-2 rounded-full bg-brand-accent" />
            <span className="size-2 rounded-full bg-brand-special" />
          </div>
        </CardHeader>

        <CardContent className="pb-6">{children}</CardContent>
      </Card>
    </div>
  );
}
