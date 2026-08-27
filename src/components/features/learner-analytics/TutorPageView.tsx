"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Navbar } from "@/components/common/Navbar";
import { SocraticChatView } from "@/components/features/learner-analytics/SocraticChatView";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";
import { useTutorStore } from "@/store/useTutorStore";

export function TutorPageView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const primeFarmLesson = useTutorStore((state) => state.primeFarmLesson);

  useEffect(() => {
    const fromFarm = searchParams.get("from") === "farm";
    const topicId =
      searchParams.get("topicId") || searchParams.get("topic_id") || "";
    if (fromFarm || topicId.trim()) {
      primeFarmLesson(topicId);
    }
  }, [primeFarmLesson, searchParams]);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-4 py-6 sm:px-6">
        <div className="flex min-h-[min(40rem,calc(100dvh-8rem))] w-full max-w-3xl flex-1 flex-col">
          <SocraticChatView
            onClose={() => router.push(STUDENT_HOME_PATH)}
          />
        </div>
      </main>
    </div>
  );
}
