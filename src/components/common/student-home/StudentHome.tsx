"use client";

import { useCallback, useEffect, useState } from "react";

import { ExamPrepCard } from "@/components/features/assessment-engine/ExamPrepCard";
import { PlacementCourseCard } from "@/components/features/assessment-engine/PlacementCourseCard";
import { GameArenaCard } from "@/components/features/gaming-service/GameArenaCard";
import { WeeklyChallenge } from "@/components/features/gaming-service/WeeklyChallenge";
import { MasteryProfileCard } from "@/components/features/learner-analytics/MasteryProfileCard";
import { DailyFactCard } from "@/components/common/student-home/DailyFactCard";
import { JoinClassSection } from "@/components/common/student-home/JoinClassSection";
import { SocratesChatToggle } from "@/components/common/student-home/SocratesChatToggle";
import { TodayMissions } from "@/components/common/student-home/TodayMissions";
import { WelcomeBanner } from "@/components/common/student-home/WelcomeBanner";
import { fetchStudentProfile } from "@/lib/api/educator";
import { fetchEnrolledClasses } from "@/lib/user-management";
import { useUserStore } from "@/store/useUserStore";
import type { StudentProfileResponse, TeacherClass } from "@/types";

export function StudentHome() {
  const token = useUserStore((state) => state.token);
  const userId = useUserStore((state) => state.userId);
  const [enrolledClasses, setEnrolledClasses] = useState<TeacherClass[]>([]);
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null);

  const loadEnrolled = useCallback(async () => {
    if (!token) {
      setEnrolledClasses([]);
      return;
    }
    try {
      setEnrolledClasses(await fetchEnrolledClasses(token));
    } catch {
      setEnrolledClasses([]);
    }
  }, [token]);

  useEffect(() => {
    void loadEnrolled();
  }, [loadEnrolled]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void fetchStudentProfile(userId)
      .then((payload) => {
        if (!cancelled) setProfile(payload);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#00A8E818,_transparent_45%),radial-gradient(ellipse_at_top_right,_#7209B714,_transparent_40%),radial-gradient(ellipse_at_bottom,_#70E00012,_transparent_45%)]"
      />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-3 pt-5 pb-24 sm:gap-10 sm:px-5 sm:pb-28">
        <WelcomeBanner enrolledClass={enrolledClasses[0] ?? null} />

        <JoinClassSection
          enrolledClasses={enrolledClasses}
          onJoined={() => void loadEnrolled()}
        />

        <section className="space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-brand-primary">
                Today
              </p>
              <h2 className="text-lg font-semibold text-brand-text sm:text-xl">
                Daily missions
              </h2>
              <p className="mt-1 text-sm text-brand-text/55">
                Personalized tasks will appear here once learning-path &amp;
                gaming streak APIs are wired.
              </p>
            </div>
          </div>
          <TodayMissions />
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
              Learning hub
            </p>
            <h2 className="text-lg font-semibold text-brand-text sm:text-xl">
              Lessons, games, quizzes &amp; mastery
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-brand-text/60">
              Jump into the pathway that fits your day — courses unlock after
              placement when needed.
            </p>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
            <PlacementCourseCard />
            <GameArenaCard />
            <ExamPrepCard />
            <MasteryProfileCard profile={profile} />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-brand-accent">
              Challenges
            </p>
            <h2 className="text-lg font-semibold text-brand-text sm:text-xl">
              This week&apos;s spotlight
            </h2>
          </div>
          <WeeklyChallenge />
        </section>

        <DailyFactCard />

        <SocratesChatToggle />
      </div>
    </div>
  );
}
