import { RoleGuard } from "@/components/common/auth/RoleGuard";
import { DevHubScreen } from "@/components/features/assessment-engine/screens/DevHubScreen";

/** Temporary Component 2 Assessment Engine Dev Hub — educator session required. */
export default function AssessmentEngineDevHubPage() {
  return (
    <RoleGuard allowedRole="educator">
      <DevHubScreen />
    </RoleGuard>
  );
}
