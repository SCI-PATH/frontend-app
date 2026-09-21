import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import "@/components/common/student-home/welcome-banner.css";

export function WelcomeBannerShell({
  children,
  innerClassName,
}: {
  children: ReactNode;
  innerClassName?: string;
}) {
  return (
    <section className="welcome-banner w-full">
      <div
        className={cn(
          "welcome-banner__inner px-5 py-4 text-white sm:px-6 sm:py-5",
          innerClassName
        )}
      >
        <div className="welcome-banner__speed-line" aria-hidden />
        <div
          className="welcome-banner__speed-line welcome-banner__speed-line--delay"
          aria-hidden
        />
        <div className="welcome-banner__orb welcome-banner__orb--cyan" aria-hidden />
        <div className="welcome-banner__orb welcome-banner__orb--purple" aria-hidden />
        <div className="welcome-banner__orb welcome-banner__orb--pink" aria-hidden />
        <span className="welcome-banner__star welcome-banner__star--1" aria-hidden />
        <span className="welcome-banner__star welcome-banner__star--2" aria-hidden />
        <span className="welcome-banner__star welcome-banner__star--3" aria-hidden />
        <span className="welcome-banner__star welcome-banner__star--4" aria-hidden />
        <span className="welcome-banner__spark welcome-banner__spark--1" aria-hidden />
        <span className="welcome-banner__spark welcome-banner__spark--2" aria-hidden />
        <div className="relative">{children}</div>
      </div>
    </section>
  );
}
