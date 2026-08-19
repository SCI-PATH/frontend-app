import type { AtRiskStudentAlert, RiskTierId } from "@/types/educator";

/** Points assigned by the analytics API per triggered signal (see BE `_build_at_risk_alert`). */
export const RISK_SCORE_SIGNALS = {
  lowMastery: 40,
  decliningVelocity: 30,
  weakRecentPerformance: 30,
  criticalLowMasteryFloor: 85,
} as const;

export interface RiskTierMeta {
  id: RiskTierId;
  label: string;
  scoreRange: string;
  borderClass: string;
  pillClass: string;
  minScore: number;
}

export const RISK_TIERS: readonly RiskTierMeta[] = [
  {
    id: "immediate",
    label: "Immediate Support",
    scoreRange: "80–100",
    borderClass: "border-l-red-700",
    pillClass: "bg-red-700 text-white hover:bg-red-700",
    minScore: 80,
  },
  {
    id: "attention",
    label: "Needs Attention",
    scoreRange: "60–79",
    borderClass: "border-l-red-500",
    pillClass: "bg-red-600 text-white hover:bg-red-600",
    minScore: 60,
  },
  {
    id: "watchlist",
    label: "Watchlist",
    scoreRange: "40–59",
    borderClass: "border-l-brand-primary",
    pillClass: "bg-brand-primary text-white hover:bg-brand-primary",
    minScore: 40,
  },
  {
    id: "monitor",
    label: "Monitor",
    scoreRange: "0–39",
    borderClass: "border-l-brand-special",
    pillClass: "bg-brand-special text-white hover:bg-brand-special",
    minScore: 0,
  },
] as const;

/** Maps BE `reason` fragments to score points (2-of-3 rule + critical override). */
export const RISK_REASON_POINTS: Record<string, number> = {
  "Low Mastery": RISK_SCORE_SIGNALS.lowMastery,
  "Declining Mastery Velocity": RISK_SCORE_SIGNALS.decliningVelocity,
  "Weak Recent Performance": RISK_SCORE_SIGNALS.weakRecentPerformance,
  "Critical Low Mastery": RISK_SCORE_SIGNALS.criticalLowMasteryFloor,
};

export function parseRiskReasons(reason: string): string[] {
  return reason
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function getRiskTier(riskScore: number): RiskTierMeta {
  if (riskScore >= 80) return RISK_TIERS[0];
  if (riskScore >= 60) return RISK_TIERS[1];
  if (riskScore >= 40) return RISK_TIERS[2];
  return RISK_TIERS[3];
}

export function recommendedAction(riskScore: number): string {
  if (riskScore >= 80) {
    return "Action now: teacher check-in and targeted support session.";
  }
  if (riskScore >= 60) {
    return "Action this week: focused practice and quick follow-up.";
  }
  if (riskScore >= 40) {
    return "Watch closely: continue monitoring and guided practice.";
  }
  return "Continue light monitoring during regular instruction.";
}

export function recentQuizStatus(
  recentPerformanceAvg: number | null | undefined
): string {
  if (recentPerformanceAvg === null || recentPerformanceAvg === undefined) {
    return "No recent quiz trend yet";
  }
  const pct = recentPerformanceAvg * 100;
  if (pct < 40) return "Recent quiz performance is weak";
  if (pct < 60) return "Recent quiz performance is mixed";
  return "Recent quiz performance is steady";
}

export function groupAlertsByTier(alerts: AtRiskStudentAlert[]) {
  return RISK_TIERS.map((tier) => ({
    tier,
    alerts: alerts.filter((alert) => getRiskTier(alert.risk_score).id === tier.id),
  }));
}
