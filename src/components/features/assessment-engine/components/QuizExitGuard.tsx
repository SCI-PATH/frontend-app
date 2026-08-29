"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * While `active`, intercepts in-app navigation (Home, other routes) and
 * browser back, and shows a confirmation dialog before leaving.
 */
export function QuizExitGuard({
  active,
  title = "Leave this quiz?",
  description = "Your progress on unanswered questions will be lost. Answers you already submitted are saved.",
  confirmLabel = "Quit quiz",
  onConfirmLeave,
  children,
}: {
  active: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  /** Called after the student confirms. Should terminate the session. */
  onConfirmLeave: () => Promise<void> | void;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const pendingHref = useRef<string | null>(null);
  const pendingBack = useRef(false);
  const bypass = useRef(false);

  const requestLeave = useCallback(
    (href?: string | null, isBack = false) => {
      if (!active || bypass.current) return false;
      pendingHref.current = href ?? null;
      pendingBack.current = isBack;
      setOpen(true);
      return true;
    },
    [active]
  );

  useEffect(() => {
    if (!active) return;

    function onDocumentClick(e: MouseEvent) {
      if (bypass.current) return;
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) {
        return;
      }
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      try {
        const url = new URL(href, window.location.origin);
        if (
          url.origin === window.location.origin &&
          url.pathname === pathname
        ) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        requestLeave(url.pathname + url.search + url.hash);
      } catch {
        /* ignore invalid */
      }
    }

    function onPopState() {
      if (bypass.current) return;
      window.history.pushState({ quizGuard: true }, "", pathname);
      requestLeave(null, true);
    }

    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (bypass.current) return;
      e.preventDefault();
      e.returnValue = "";
    }

    window.history.pushState({ quizGuard: true }, "", pathname);

    document.addEventListener("click", onDocumentClick, true);
    window.addEventListener("popstate", onPopState);
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      document.removeEventListener("click", onDocumentClick, true);
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [active, pathname, requestLeave]);

  async function handleConfirm() {
    setBusy(true);
    try {
      bypass.current = true;
      await onConfirmLeave();
      setOpen(false);
      if (pendingBack.current) {
        pendingBack.current = false;
        router.back();
      } else if (pendingHref.current) {
        const href = pendingHref.current;
        pendingHref.current = null;
        router.push(href);
      }
    } catch {
      bypass.current = false;
    } finally {
      setBusy(false);
    }
  }

  function handleCancel() {
    pendingHref.current = null;
    pendingBack.current = false;
    setOpen(false);
  }

  return (
    <>
      {children}
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-text/40 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-exit-title"
        >
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-brand-surface bg-white shadow-xl">
            <div className="space-y-2 px-5 pt-5 sm:px-6">
              <h2
                id="quiz-exit-title"
                className="text-lg font-bold tracking-tight text-brand-text"
              >
                {title}
              </h2>
              <p className="text-sm leading-relaxed text-brand-text/65">
                {description}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-brand-surface/80 px-5 py-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={handleCancel}
                className="border-brand-surface"
              >
                Keep playing
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => void handleConfirm()}
                className="gap-2 bg-brand-accent text-white hover:bg-brand-accent/90"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <LogOut className="size-4" aria-hidden />
                )}
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
