"use client";

import { CustomQuizScreen } from "@/components/features/assessment-engine/screens/CustomQuizScreen";
import { RequirePlacement } from "@/components/features/assessment-engine/RequirePlacement";

export default function AssessmentCustomQuizPage() {
  return (
    <RequirePlacement>
      <CustomQuizScreen />
    </RequirePlacement>
  );
}
