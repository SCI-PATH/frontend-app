import { Check } from "lucide-react";

import { SocratesAvatar } from "@/components/features/learner-analytics/SocratesAvatar";
import { cn } from "@/lib/utils";
import { splitTutorFollowUp, type ChatMessage } from "@/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

const NUMBERED_LINE = /^\s*(?:\(?[1-9]\)?[.)]|[-*])\s+/;

function extractCoachPreamble(content: string, question: string | null): string {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !NUMBERED_LINE.test(line))
    .filter((line) => {
      const closing = question?.trim();
      if (closing && line === closing) return false;
      return !line.endsWith("?");
    })
    .join(" ")
    .trim();
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isStudent = message.role === "student";
  const steps = message.steps?.filter(Boolean) ?? [];
  const showSteps =
    !isStudent &&
    message.personaId === "analytical_coach" &&
    steps.length >= 2;
  const followUp = !isStudent ? splitTutorFollowUp(message.content) : null;
  const body = followUp?.body ?? message.content;
  const question = followUp?.question ?? message.closingQuestion ?? null;
  const preamble = showSteps
    ? extractCoachPreamble(message.content, question)
    : "";

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
            : "rounded-bl-md border border-brand-surface bg-white text-brand-text"
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
        {showSteps ? (
          <>
            {preamble ? (
              <p className="mb-2 whitespace-pre-wrap">{preamble}</p>
            ) : null}
            <ol className="space-y-1.5">
              {steps.slice(0, 3).map((step, index) => (
                <li key={`${message.id}-step-${index}`} className="flex gap-2">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-secondary/15 text-[11px] font-semibold text-brand-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </>
        ) : body.trim() ? (
          <p className="whitespace-pre-wrap">{body}</p>
        ) : null}
        {question ? (
          <p
            className={cn(
              "italic text-brand-primary/90",
              showSteps || body.trim()
                ? "mt-2 border-t border-brand-surface pt-2"
                : ""
            )}
          >
            {question}
          </p>
        ) : null}
      </div>
    </div>
  );
}
