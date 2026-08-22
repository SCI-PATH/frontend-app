import type { ReactNode } from "react";

import { RoleGuard } from "@/components/common/auth/RoleGuard";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRole="student">
      <div className="flex min-h-full flex-1 flex-col bg-brand-background text-brand-text">
        {children}
      </div>
    </RoleGuard>
  );
}
