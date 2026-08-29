"use client";

import { ExamPrepCard } from "@/components/features/assessment-engine/ExamPrepCard";
import { PlacementCourseCard } from "@/components/features/assessment-engine/PlacementCourseCard";
import { useAssessmentUser } from "@/components/features/assessment-engine/store/useAssessmentUser";
import {
  isPlacementComplete,
  usePlacementStatus,
} from "@/components/features/assessment-engine/store/usePlacementStatus";
import { GameArenaCard } from "@/components/features/gaming-service/GameArenaCard";
import { HomeMasteryProfileCard } from "@/components/common/student-home/HomeMasteryProfileCard";
import { DailyFactCard } from "@/components/common/student-home/DailyFactCard";
import { JoinClassSection } from "@/components/common/student-home/JoinClassSection";
import { PlacementLockOverlay } from "@/components/common/student-home/PlacementLockOverlay";
import { SocratesChatToggle } from "@/components/common/student-home/SocratesChatToggle";
import { WelcomeBanner } from "@/components/common/student-home/WelcomeBanner";
import { useEnrolledClasses } from "@/lib/student/useEnrolledClasses";
import { useUserStore } from "@/store/useUserStore";

export function StudentHome() {
  const upsertEnrolledClass = useUserStore((state) => state.upsertEnrolledClass);
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const { enrolledClasses, primaryClass, refresh } = useEnrolledClasses();
  const { role, isAuthenticated } = useAssessmentUser();
  const placement = usePlacementStatus();

  const lockHubCards =
    hasHydrated &&
    isAuthenticated &&
    role === "student" &&
    placement.status === "ready" &&
    !isPlacementComplete(placement);

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E818,_transparent_45%),radial-gradient(ellipse_at_top_right,_#7209B714,_transparent_40%),radial-gradient(ellipse_at_bottom,_#70E00012,_transparent_45%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-3 pt-6 pb-28 sm:gap-16 sm:px-5 sm:pt-8 sm:pb-32">
        <WelcomeBanner enrolledClass={primaryClass} />

        <JoinClassSection
          enrolledClasses={enrolledClasses}
          onJoined={(classroom) => {
            upsertEnrolledClass(classroom);
            void refresh();
          }}
        />

        <section className="space-y-6 sm:space-y-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-special">
              Learning hub
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">
              Lessons, games, quizzes &amp; mastery
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-text/60 sm:text-base">
              {lockHubCards
                ? "Complete your aptitude placement first — then every hub unlocks."
                : "Pick what fits your day and keep building your science skills."}
            </p>
          </div>

          <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            <div className="h-full min-h-[22rem]">
              <PlacementCourseCard />
            </div>
            <PlacementLockOverlay locked={lockHubCards}>
              <GameArenaCard />
            </PlacementLockOverlay>
            <PlacementLockOverlay locked={lockHubCards}>
              <ExamPrepCard />
            </PlacementLockOverlay>
            <PlacementLockOverlay locked={lockHubCards}>
              <HomeMasteryProfileCard />
            </PlacementLockOverlay>
          </div>
        </section>

        <DailyFactCard />
      </div>

      <SocratesChatToggle />
    </div>
  );
}
