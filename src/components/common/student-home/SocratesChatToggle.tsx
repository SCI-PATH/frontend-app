"use client";

import { FormEvent, useState } from "react";
import { MessageCircle, Mic, Send, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SocratesChatToggle() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setDraft("");
  }

  return (
    <>
      {open ? (
        <aside
          className="fixed bottom-20 right-3 z-50 flex h-[min(28rem,70vh)] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-brand-special/25 bg-white shadow-lg sm:right-5"
          aria-label="Ask Socrates chat"
        >
          <header className="flex items-center justify-between bg-brand-special px-4 py-3 text-white">
            <h2 className="text-sm font-semibold">Ask Socrates</h2>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium">
                <span
                  className="size-2 rounded-full bg-brand-secondary"
                  aria-hidden
                />
                Online
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 hover:bg-white/15"
                aria-label="Close chat"
              >
                <X className="size-4" />
              </button>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-brand-special/10 px-4 py-3">
              <p className="text-xs font-semibold text-brand-special">
                Socrates (AI Tutor)
              </p>
              <p className="mt-1 text-sm leading-relaxed text-brand-text">
                Stuck on a science concept? Ask for a Socratic hint anytime.
              </p>
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-1 border-t border-brand-surface bg-brand-background px-2 py-2"
          >
            <Input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Type a question..."
              className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0"
            />
            <button
              type="button"
              className="rounded-lg p-2 text-brand-text/40 hover:text-brand-special"
              aria-label="Voice input"
            >
              <Mic className="size-4" />
            </button>
            <button
              type="submit"
              className="rounded-lg p-2 text-brand-special hover:bg-brand-special/10"
              aria-label="Send message"
            >
              <Send className="size-4" />
            </button>
          </form>
        </aside>
      ) : null}

      <Button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="socrates-chat"
        className="fixed bottom-3 right-4 z-50 h-12 gap-2 rounded-full bg-brand-special px-4 text-base text-white shadow-md hover:bg-brand-special/90 sm:right-6"
      >
        <MessageCircle className="size-5" aria-hidden />
        {open ? "Hide tutor" : "Ask Socrates"}
      </Button>
    </>
  );
}
