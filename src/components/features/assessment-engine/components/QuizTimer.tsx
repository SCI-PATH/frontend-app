"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";

import { cn } from "@/lib/utils";

interface QuizTimerProps {
  /** Seconds elapsed; parent owns the clock. */
  seconds: number;
  /** Soft urgency threshold (default 60s). */
  warnAfter?: number;
  className?: string;
}

export function QuizTimer({
  seconds,
  warnAfter = 60,
  className,
}: QuizTimerProps) {
  const urgent = seconds >= warnAfter;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const label = `${m}:${s.toString().padStart(2, "0")}`;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold tabular-nums",
        urgent
          ? "bg-brand-accent/15 text-brand-accent ring-1 ring-brand-accent/30"
          : "bg-brand-primary/10 text-brand-primary ring-1 ring-brand-primary/20",
        className
      )}
      aria-live="polite"
    >
      <Timer className="size-4" aria-hidden />
      {label}
    </div>
  );
}

/** Hook: counts up from 0 while `running` is true; resets when resetKey changes. */
export function useElapsedSeconds(running: boolean, resetKey: string | number) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
  }, [resetKey]);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSeconds((v) => v + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, resetKey]);

  return seconds;
}
