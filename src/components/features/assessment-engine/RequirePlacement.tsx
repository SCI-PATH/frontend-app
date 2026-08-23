"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  isPlacementComplete,
  usePlacementStatus,
} from "@/components/features/assessment-engine/store/usePlacementStatus";
import { useAssessmentUser } from "@/components/features/assessment-engine/store/useAssessmentUser";

type Props = {
  children: React.ReactNode;
};

/**
 * Blocks assessment features (custom quiz, post-lesson) until Amplitude placement is done.
 * Amplitude route itself must not use this wrapper.
 */
export function RequirePlacement({ children }: Props) {
  const router = useRouter();
  const { role, isAuthenticated } = useAssessmentUser();
  const placement = usePlacementStatus();

  useEffect(() => {
    if (
      placement.status === "ready" &&
      role === "student" &&
      isAuthenticated &&
      placement.needsAmplitude
    ) {
      router.replace("/assessment/amplitude");
    }
  }, [placement, role, isAuthenticated, router]);

  if (role !== "student" || !isAuthenticated) {
    return <>{children}</>;
  }

  if (placement.status === "idle" || placement.status === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-brand-text/60">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Checking placement…
      </div>
    );
  }

  if (!isPlacementComplete(placement)) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-brand-text">
          Complete the aptitude test first
        </h1>
        <p className="text-brand-text/70">
          Your placement result unlocks custom quizzes and lesson follow-ups.
        </p>
        <Button asChild className="mx-auto bg-brand-special text-white">
          <Link href="/assessment/amplitude">Go to aptitude test</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
