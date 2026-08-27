import { Suspense } from "react";

import { TutorPageView } from "@/components/features/learner-analytics/TutorPageView";

export const metadata = {
  title: "Socrates | SCI-PATH",
  description:
    "Chat with Socrates, your AI science companion, in Socratic mode.",
};

export default function TutorPage() {
  return (
    <Suspense fallback={null}>
      <TutorPageView />
    </Suspense>
  );
}
