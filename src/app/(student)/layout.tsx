import type { ReactNode } from "react";

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-brand-background text-brand-text">
      {children}
    </div>
  );
}
