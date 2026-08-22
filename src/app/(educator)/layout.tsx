import type { ReactNode } from "react";

import { RoleGuard } from "@/components/common/auth/RoleGuard";

export default function EducatorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRole="educator">
      <div className="flex min-h-full flex-1 flex-col bg-brand-background text-brand-text">
        {children}
      </div>
    </RoleGuard>
  );
}
