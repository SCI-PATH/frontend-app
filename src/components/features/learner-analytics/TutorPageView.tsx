"use client";

import { useRouter } from "next/navigation";

import { Navbar } from "@/components/common/Navbar";
import { SocraticChatView } from "@/components/features/learner-analytics/SocraticChatView";
import { STUDENT_HOME_PATH } from "@/lib/auth-routes";

export function TutorPageView() {
  const router = useRouter();

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
