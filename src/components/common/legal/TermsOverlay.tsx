"use client";

import { Scale } from "lucide-react";

import {
  TermsDocument,
  TERMS_LAST_UPDATED,
} from "@/components/common/legal/TermsDocument";
import { BrandGradientBar } from "@/components/common/BrandGradientBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP_NAME } from "@/lib/brand";

export function TermsOverlay({
  open,
  onOpenChange,
  onAccept,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept?: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        overlayClassName="bg-brand-text/55 backdrop-blur-sm"
        className="flex max-h-[min(90dvh,42rem)] w-full max-w-[calc(100%-1.25rem)] flex-col gap-0 overflow-hidden rounded-2xl bg-white p-0 ring-1 ring-brand-primary/20 sm:max-w-2xl"
      >
        <BrandGradientBar />
        <DialogHeader className="border-b border-brand-surface bg-gradient-to-br from-brand-primary/8 via-white to-brand-special/8 px-5 py-4 pr-12">
          <div className="flex items-center gap-2 text-brand-primary">
            <Scale className="size-4" aria-hidden />
            <span className="text-xs font-bold uppercase tracking-wider">
              {APP_NAME}
            </span>
          </div>
          <DialogTitle className="text-lg font-bold text-brand-text">
            Terms and Conditions
          </DialogTitle>
          <DialogDescription className="text-sm text-brand-text/60">
            How this science learning platform works, what we store, and how
            students and teachers should use it. Last updated {TERMS_LAST_UPDATED}.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-brand-background/60 px-4 py-4 sm:px-5">
          <TermsDocument compact />
        </div>

        <DialogFooter className="mx-0 mb-0 rounded-none border-brand-surface bg-white px-5 py-3 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="text-brand-text/70"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          {onAccept ? (
            <Button
              type="button"
              className="bg-brand-primary text-white hover:bg-brand-primary/90"
              onClick={() => {
                onAccept();
                onOpenChange(false);
              }}
            >
              I agree
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
