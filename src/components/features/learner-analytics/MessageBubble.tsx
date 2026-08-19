import { Check } from "lucide-react";

import { SocratesAvatar } from "@/components/features/learner-analytics/SocratesAvatar";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isStudent = message.role === "student";

  return (
    <div
      className={cn(
        "flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isStudent ? "flex-row-reverse" : "flex-row"
      )}
    >
      {isStudent ? null : <SocratesAvatar size="sm" />}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isStudent
            ? "rounded-br-md bg-brand-primary text-white"
            : "rounded-bl-md border border-brand-surface bg-brand-background text-brand-text"
        )}
      >
        {message.isHint ? (
          <span
            className={cn(
              "mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              isStudent
                ? "bg-white/15 text-white"
                : "bg-brand-secondary/10 text-brand-text"
            )}
          >
            <Check className="size-2.5" aria-hidden />
            Hint
          </span>
        ) : null}
        <p className="whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
