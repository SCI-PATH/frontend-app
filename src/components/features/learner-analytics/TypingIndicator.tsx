import { SocratesAvatar } from "@/components/features/learner-analytics/SocratesAvatar";

export function TypingIndicator() {
  return (
    <div
      className="flex items-end gap-2 animate-in fade-in duration-200"
      aria-live="polite"
      aria-label="Socrates is thinking"
    >
      <SocratesAvatar size="sm" />
      <div className="rounded-2xl rounded-bl-md border border-brand-surface bg-white px-3.5 py-3">
        <div className="flex items-center gap-1">
          <span className="size-1.5 animate-bounce rounded-full bg-brand-special [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-brand-special [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-brand-special" />
        </div>
        <p className="sr-only">Retrieving textbook context and composing a Socratic hint…</p>
      </div>
    </div>
  );
}
