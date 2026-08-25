"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import { SocraticChatView } from "@/components/features/learner-analytics/SocraticChatView";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SocratesChatToggle() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const close = useCallback(() => {
    setOpen(false);
    setExpanded(false);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close, open]);

  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [expanded]);

  return (
    <>
      {open ? (
        <>
          {expanded ? (
            <button
              type="button"
              className="fixed inset-0 z-[60] bg-brand-text/40 backdrop-blur-[2px]"
              aria-label="Close Socrates chat"
              onClick={close}
            />
          ) : null}
          <aside
            className={cn(
              "z-[60] flex flex-col",
              expanded
                ? "fixed top-4 right-3 bottom-4 left-3 z-[60] sm:top-6 sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-[min(48rem,calc(100vw-2rem))] sm:-translate-x-1/2"
                : "fixed right-3 bottom-20 h-[min(32rem,75vh)] w-[min(32rem,calc(100vw-1.5rem))] sm:right-5"
            )}
            aria-label="Ask Socrates chat"
            aria-modal={expanded}
            role={expanded ? "dialog" : undefined}
          >
            <SocraticChatView
              variant={expanded ? "full" : "compact"}
              onClose={close}
              onExpand={expanded ? undefined : () => setExpanded(true)}
            />
          </aside>
        </>
      ) : null}

      {open && expanded ? null : (
        <Button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-label={open ? "Hide Socrates chat" : "Ask Socrates"}
          className="fixed right-4 bottom-3 z-[60] h-12 gap-2 rounded-full bg-brand-special px-4 text-base text-white shadow-md hover:bg-brand-special/90 sm:right-6"
        >
          <MessageCircle className="size-5" aria-hidden />
          {open ? "Hide tutor" : "Ask Socrates"}
        </Button>
      )}
    </>
  );
}
