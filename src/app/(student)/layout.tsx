import type { ReactNode } from "react";

import { RoleGuard } from "@/components/common/auth/RoleGuard";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRole="student">
      <div className="min-h-full bg-brand-background text-brand-text">{children}</div>
    </RoleGuard>
  );
}
