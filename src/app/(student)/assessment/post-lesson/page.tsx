import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { PostLessonScreen } from "@/components/features/assessment-engine/screens/PostLessonScreen";

export default function AssessmentPostLessonPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center bg-brand-background py-20">
          <Loader2 className="size-8 animate-spin text-brand-primary" />
        </div>
      }
    >
      <PostLessonScreen />
    </Suspense>
  );
}
