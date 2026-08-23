"use client";

import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { cn } from "@/lib/utils";

import {
  ACCENT_STYLES,
  type LandingFeature,
  type LandingFeatureId,
} from "./landing-content";

const BKT_PREVIEW = [
  { attempt: 1, mastery: 0.22 },
  { attempt: 2, mastery: 0.31 },
  { attempt: 3, mastery: 0.38 },
  { attempt: 4, mastery: 0.52 },
  { attempt: 5, mastery: 0.61 },
  { attempt: 6, mastery: 0.74 },
  { attempt: 7, mastery: 0.82 },
];

const CHAT_PREVIEW = [
  {
    role: "student" as const,
    text: "Why does a balloon stick to the wall after rubbing it?",
  },
  {
    role: "tutor" as const,
    text: "Good question. What do you think happens to the charges on the balloon when you rub it?",
  },
  {
    role: "student" as const,
    text: "Maybe electrons move onto the balloon?",
  },
  {
    role: "tutor" as const,
    text: "Exactly—now predict what the wall does when those extra charges get close.",
  },
];

const PATH_PREVIEW = [
  { step: "Static charges", status: "done" },
  { step: "Electric circuits", status: "active" },
  { step: "Generation of electricity", status: "locked" },
  { step: "Water as solvent", status: "locked" },
];

const QUIZ_PREVIEW = [
  { label: "Basic", pct: 35, active: false },
  { label: "Intermediate", pct: 55, active: true },
  { label: "Advanced", pct: 20, active: false },
];

const FARM_PREVIEW = [
  { zone: "Soil Lab", xp: 320, unlocked: true },
  { zone: "Circuit Grove", xp: 180, unlocked: true },
  { zone: "Force Fields", xp: 0, unlocked: false },
];

function PreviewShell({
  feature,
  children,
}: {
  feature: LandingFeature;
  children: ReactNode;
}) {
  const styles = ACCENT_STYLES[feature.accent];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-brand-surface bg-white p-5 shadow-sm sm:p-6",
        "animate-in fade-in slide-in-from-right-4 duration-500"
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 size-40 rounded-full blur-3xl",
          styles.bg
        )}
      />
      <p className={cn("mb-4 text-xs font-bold uppercase tracking-wider", styles.text)}>
        {feature.previewLabel}
      </p>
      {children}
    </div>
  );
}

function SocratesPreview({ feature }: { feature: LandingFeature }) {
  return (
    <PreviewShell feature={feature}>
      <div className="space-y-3">
        {CHAT_PREVIEW.map((line, index) => (
          <div
            key={index}
            className={cn(
              "max-w-[92%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              line.role === "student"
                ? "ml-auto bg-brand-primary text-white"
                : "mr-auto border border-brand-surface bg-brand-background text-brand-text"
            )}
          >
            {line.text}
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-brand-text/50">
        Hint mode adapts from scaffold → balanced → nudge as P(L) rises.
      </p>
    </PreviewShell>
  );
}

function FarmPreview({ feature }: { feature: LandingFeature }) {
  return (
    <PreviewShell feature={feature}>
      <div className="space-y-3">
        {FARM_PREVIEW.map((zone) => (
          <div
            key={zone.zone}
            className={cn(
              "flex items-center justify-between rounded-2xl border px-4 py-3",
              zone.unlocked
                ? "border-brand-special/20 bg-brand-special/5"
                : "border-brand-surface bg-brand-background opacity-60"
            )}
          >
            <div>
              <p className="font-semibold text-brand-text">{zone.zone}</p>
              <p className="text-xs text-brand-text/55">
                {zone.unlocked ? `${zone.xp} XP earned` : "Complete Circuit Grove to unlock"}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-bold",
                zone.unlocked
                  ? "bg-brand-special text-white"
                  : "bg-brand-surface text-brand-text/50"
              )}
            >
              {zone.unlocked ? "Unlocked" : "Locked"}
            </span>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

function PathPreview({ feature }: { feature: LandingFeature }) {
  return (
    <PreviewShell feature={feature}>
      <div className="space-y-0">
        {PATH_PREVIEW.map((item, index) => (
          <div key={item.step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full text-xs font-bold",
                  item.status === "done" && "bg-brand-secondary text-brand-text",
                  item.status === "active" && "bg-brand-primary text-white",
                  item.status === "locked" && "bg-brand-surface text-brand-text/40"
                )}
              >
                {index + 1}
              </span>
              {index < PATH_PREVIEW.length - 1 ? (
                <span className="my-1 h-8 w-0.5 bg-brand-surface" />
              ) : null}
            </div>
            <div className="pb-5 pt-1">
              <p className="font-medium text-brand-text">{item.step}</p>
              <p className="text-xs capitalize text-brand-text/50">{item.status}</p>
            </div>
          </div>
        ))}
      </div>
    </PreviewShell>
  );
}

function DdaPreview({ feature }: { feature: LandingFeature }) {
  return (
    <PreviewShell feature={feature}>
      <div className="space-y-4">
        {QUIZ_PREVIEW.map((band) => (
          <div key={band.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-medium text-brand-text">{band.label}</span>
              <span className="text-brand-text/50">{band.pct}% of items</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-brand-surface">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  band.active ? "bg-brand-accent w-[55%]" : "bg-brand-accent/30",
                  !band.active && band.label === "Basic" && "w-[35%]",
                  !band.active && band.label === "Advanced" && "w-[20%]"
                )}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 rounded-xl bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent">
        Next question targets G7 static electricity · intermediate band
      </p>
    </PreviewShell>
  );
}

function BktPreview({ feature }: { feature: LandingFeature }) {
  const styles = ACCENT_STYLES[feature.accent];
  return (
    <PreviewShell feature={feature}>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={BKT_PREVIEW} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="masteryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00A8E8" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#00A8E8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" vertical={false} />
            <XAxis
              dataKey="attempt"
              tick={{ fill: "#212529", fontSize: 11, opacity: 0.55 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(Number(v) * 100)}%`}
              tick={{ fill: "#212529", fontSize: 11, opacity: 0.55 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${Math.round(Number(value) * 100)}%`, "P(L)"]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #E9ECEF",
                fontSize: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="mastery"
              stroke="#00A8E8"
              strokeWidth={2.5}
              fill="url(#masteryFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          { label: "At risk", color: "bg-red-500" },
          { label: "Learning", color: "bg-brand-accent" },
          { label: "Mastered", color: "bg-brand-secondary" },
        ].map((band) => (
          <span
            key={band.label}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-background px-2.5 py-1 text-xs text-brand-text/70"
          >
            <span className={cn("size-2 rounded-full", band.color)} />
            {band.label}
          </span>
        ))}
      </div>
      <p className={cn("mt-3 text-xs font-medium", styles.text)}>
        Class-scoped heatmaps · SCI-G7-492
      </p>
    </PreviewShell>
  );
}

const PREVIEW_MAP: Record<
  LandingFeatureId,
  React.ComponentType<{ feature: LandingFeature }>
> = {
  socrates: SocratesPreview,
  "farm-unlock": FarmPreview,
  "learning-path": PathPreview,
  dda: DdaPreview,
  bkt: BktPreview,
};

export function FeaturePreviewPanel({ feature }: { feature: LandingFeature }) {
  const Preview = PREVIEW_MAP[feature.id];
  return <Preview feature={feature} />;
}
