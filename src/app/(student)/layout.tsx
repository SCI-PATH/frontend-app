import type { ReactNode } from "react";

/**
 * Student route group shell (nav/guards can expand here later).
 * URL group name `(student)` does not appear in the path.
 */
export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-brand-background text-brand-text">{children}</div>
  );
}
