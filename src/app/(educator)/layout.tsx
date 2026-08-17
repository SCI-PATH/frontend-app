import type { ReactNode } from "react";

/**
 * Educator route group shell (nav/guards can expand here later).
 * URL group name `(educator)` does not appear in the path.
 */
export default function EducatorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full bg-brand-background text-brand-text">{children}</div>
  );
}
