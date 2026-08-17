import type { ReactNode } from "react";

import { RoleGuard } from "@/components/common/auth/RoleGuard";

export default function EducatorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard allowedRole="educator">
      <div className="min-h-full bg-brand-background text-brand-text">{children}</div>
    </RoleGuard>
  );
}
