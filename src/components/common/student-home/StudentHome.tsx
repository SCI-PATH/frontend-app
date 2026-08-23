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
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-3 pt-5 pb-24 sm:gap-10 sm:px-5 sm:pb-28">
      <WelcomeBanner enrolledClass={enrolledClasses[0] ?? null} />
      <JoinClassSection
        enrolledClasses={enrolledClasses}
        onJoined={() => void loadEnrolled()}
      />
      <TodayMissions />

      <section className="grid grid-cols-1 items-stretch gap-8 sm:grid-cols-2 sm:gap-10 xl:grid-cols-4">
        <PlacementCourseCard />
        <GameArenaCard />
        <ExamPrepCard />
        <MasteryProfileCard profile={profile} />
      </section>

      <WeeklyChallenge />
      <DailyFactCard />

      <SocratesChatToggle />
    </div>
  );
}
