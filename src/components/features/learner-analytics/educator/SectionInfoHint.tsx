"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

const TOOLTIP_WIDTH = 288;
const VIEWPORT_MARGIN = 12;

export function SectionInfoHint({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const tooltipId = useId();

  useEffect(() => {
    setMounted(true);
    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, VIEWPORT_MARGIN),
        window.innerWidth - TOOLTIP_WIDTH - VIEWPORT_MARGIN
      );
      const tipHeight = tooltipRef.current?.offsetHeight ?? 120;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top =
        spaceBelow < tipHeight + 16
          ? Math.max(VIEWPORT_MARGIN, rect.top - tipHeight - 8)
          : rect.bottom + 8;

      setPosition({ top, left });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (buttonRef.current?.contains(target)) return;
      if (tooltipRef.current?.contains(target)) return;
      setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const show = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setOpen(true);
  };

  const hide = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
    }
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-brand-text/45 transition-colors hover:bg-brand-primary/10 hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
        aria-label="About this section"
        aria-describedby={open ? tooltipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          show();
        }}
      >
        <Info className="size-3.5" aria-hidden />
      </button>
      {mounted && open
        ? createPortal(
            <div
              ref={tooltipRef}
              id={tooltipId}
              role="tooltip"
              className="fixed z-[200] w-72 rounded-lg border border-brand-surface bg-white px-3 py-2 text-left text-xs font-normal leading-relaxed text-brand-text/80 shadow-lg"
              style={{ top: position.top, left: position.left }}
              onMouseEnter={show}
              onMouseLeave={hide}
            >
              {text}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
