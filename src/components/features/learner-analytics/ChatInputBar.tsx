"use client";

import { FormEvent, useState } from "react";
import { Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputBarProps {
  disabled?: boolean;
  onSend: (message: string) => void;
}

export function ChatInputBar({ disabled = false, onSend }: ChatInputBarProps) {
  const [draft, setDraft] = useState("");
  const canSend = draft.trim().length > 0 && !disabled;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSend) return;
    onSend(draft);
    setDraft("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <label htmlFor="socratic-chat-input" className="sr-only">
        Message Socrates
      </label>
      <Input
        id="socratic-chat-input"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={disabled}
        placeholder="Ask Socrates about a science idea…"
        autoComplete="off"
        className="h-11 flex-1 border-brand-surface bg-brand-background/70 text-brand-text placeholder:text-brand-text/40 focus-visible:border-brand-primary focus-visible:bg-white focus-visible:ring-brand-primary/25"
      />
      <Button
        type="submit"
        size="icon-lg"
        disabled={!canSend}
        aria-label="Send message"
        className="size-11 bg-brand-primary text-white shadow-md shadow-brand-primary/25 hover:bg-brand-primary/90"
      >
        {disabled ? (
          <Sparkles className="size-4 animate-pulse" aria-hidden />
        ) : (
          <Send className="size-4" aria-hidden />
        )}
      </Button>
    </form>
  );
}
