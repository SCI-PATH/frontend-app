"use client";

import { ExamPrepCard } from "@/components/features/assessment-engine/ExamPrepCard";
import { GameArenaCard } from "@/components/features/gaming-service/GameArenaCard";
import { WeeklyChallenge } from "@/components/features/gaming-service/WeeklyChallenge";
import { MasteryProfileCard } from "@/components/features/learner-analytics/MasteryProfileCard";
import { CurriculumHubCard } from "@/components/features/learning-path-engine/CurriculumHubCard";
import { DailyFactCard } from "@/components/common/student-home/DailyFactCard";
import { SocratesChatToggle } from "@/components/common/student-home/SocratesChatToggle";
import { TodayMissions } from "@/components/common/student-home/TodayMissions";
import { WelcomeBanner } from "@/components/common/student-home/WelcomeBanner";

export function StudentHome() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-3 pt-5 pb-0 sm:gap-10 sm:px-5">
      <WelcomeBanner />
      <TodayMissions />

      <section className="grid grid-cols-1 items-stretch gap-8 sm:grid-cols-2 sm:gap-10 xl:grid-cols-4">
        <CurriculumHubCard />
        <GameArenaCard />
        <ExamPrepCard />
        <MasteryProfileCard />
      </section>

      <WeeklyChallenge />
      <DailyFactCard />

      <SocratesChatToggle />
    </div>
  );
}
