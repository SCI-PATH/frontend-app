"use client";

import { SocratesChatToggle } from "@/components/common/student-home/SocratesChatToggle";
import { CustomQuizScreen } from "@/components/features/assessment-engine/screens/CustomQuizScreen";
import { RequirePlacement } from "@/components/features/assessment-engine/RequirePlacement";

export default function AssessmentCustomQuizPage() {
  return (
    <RequirePlacement>
      <CustomQuizScreen />
      <SocratesChatToggle />
    </RequirePlacement>
  );
}
