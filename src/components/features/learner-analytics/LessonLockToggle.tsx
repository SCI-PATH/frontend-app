import { Lock, LockOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LessonLockToggleProps {
  locked: boolean;
  disabled?: boolean;
  onLockedChange: (locked: boolean) => void;
}

export function LessonLockToggle({
  locked,
  disabled = false,
  onLockedChange,
}: LessonLockToggleProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      aria-pressed={locked}
      title={
        disabled
          ? "Available after a lesson is detected"
          : locked
            ? "Unlock lesson (allow backend topic routing)"
            : "Lock to this lesson"
      }
      onClick={() => onLockedChange(!locked)}
      className={cn(
        "h-7 rounded-full border-brand-surface bg-white px-2.5 text-xs font-medium text-brand-text",
        "hover:border-brand-special/30 hover:bg-brand-special/10 hover:text-brand-special",
        locked &&
          "border-brand-special/30 bg-brand-special/10 text-brand-special hover:bg-brand-special/15"
      )}
    >
      {locked ? (
        <Lock className="size-3.5" aria-hidden />
      ) : (
        <LockOpen className="size-3.5" aria-hidden />
      )}
      Lock to this lesson
    </Button>
  );
}
