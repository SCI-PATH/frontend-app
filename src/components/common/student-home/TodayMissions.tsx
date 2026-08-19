"use client";

import Link from "next/link";
import { Beaker, Clock, Flame, Target } from "lucide-react";

const MISSIONS = [
  {
    href: "/dashboard",
    icon: Target,
    title: "Finish Plant Diversity",
    meta: "12 min left · +80 XP",
    tone: "text-brand-primary bg-brand-primary/10",
  },
  {
    href: "/assessment/session",
    icon: Beaker,
    title: "Optics mini-check",
    meta: "5 questions · Adaptive DoK",
    tone: "text-brand-accent bg-brand-accent/10",
  },
  {
    href: "/dashboard",
    icon: Flame,
    title: "Keep the streak alive",
    meta: "1 activity unlocks Day 5",
    tone: "text-brand-special bg-brand-special/10",
  },
];

export function TodayMissions() {
  return (
    <section className="grid grid-cols-1 gap-8 sm:grid-cols-3">
      {MISSIONS.map((mission) => {
        const Icon = mission.icon;
        return (
          <Link
            key={mission.title}
            href={mission.href}
            className="group flex items-center gap-4 rounded-2xl border border-brand-surface bg-white px-6 py-5 transition-transform duration-200 hover:-translate-y-0.5"
          >
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${mission.tone}`}
            >
              <Icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold text-brand-text">
                {mission.title}
              </span>
              <span className="mt-0.5 flex items-center gap-1 text-sm text-brand-text/55">
                <Clock className="size-3.5" aria-hidden />
                {mission.meta}
              </span>
            </span>
          </Link>
        );
      })}
    </section>
  );
}
