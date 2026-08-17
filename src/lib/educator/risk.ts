import type { AtRiskStudentAlert, RiskTierId } from "@/types/educator";

export interface RiskTierMeta {
  id: RiskTierId;
  label: string;
  borderClass: string;
  pillClass: string;
  minScore: number;
}

export const RISK_TIERS: readonly RiskTierMeta[] = [
  {
    id: "immediate",
    label: "Immediate Support",
    borderClass: "border-l-red-700",
    pillClass: "bg-red-700 text-white hover:bg-red-700",
    minScore: 80,
  },
  {
    id: "attention",
    label: "Needs Attention",
    borderClass: "border-l-red-500",
    pillClass: "bg-red-600 text-white hover:bg-red-600",
    minScore: 60,
  },
  {
    id: "watchlist",
    label: "Watchlist",
    borderClass: "border-l-brand-primary",
    pillClass: "bg-brand-primary text-white hover:bg-brand-primary",
    minScore: 40,
  },
  {
    id: "monitor",
    label: "Monitor",
    borderClass: "border-l-brand-special",
    pillClass: "bg-brand-special text-white hover:bg-brand-special",
    minScore: 0,
  },
] as const;

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
