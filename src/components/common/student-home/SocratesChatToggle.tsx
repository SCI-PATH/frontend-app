"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

import { SocraticChatView } from "@/components/features/learner-analytics/SocraticChatView";
import { Button } from "@/components/ui/button";

export function SocratesChatToggle() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open ? (
        <aside
          className="fixed bottom-20 right-3 z-50 flex h-[min(32rem,75vh)] w-[min(32rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-brand-special/25 bg-white shadow-lg sm:right-5"
          aria-label="Ask Socrates chat"
        >
          <SocraticChatView
            variant="compact"
            onClose={() => setOpen(false)}
          />
        </aside>
      ) : null}

      <Button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={open ? "Hide Socrates chat" : "Ask Socrates"}
        className="fixed bottom-3 right-4 z-50 h-12 gap-2 rounded-full bg-brand-special px-4 text-base text-white shadow-md hover:bg-brand-special/90 sm:right-6"
      >
        <MessageCircle className="size-5" aria-hidden />
        {open ? "Hide tutor" : "Ask Socrates"}
      </Button>
    </>
  );
}
