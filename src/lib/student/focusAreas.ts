import { parseRiskReasons } from "@/lib/educator/risk";

const STUDENT_REASON_COPY: Record<string, string> = {
  "Low Mastery": "Your estimated mastery on this skill is still low.",
  "Declining Mastery Velocity": "Your recent scores on this skill are dropping.",
  "Weak Recent Performance": "Recent quiz answers on this skill have been mixed.",
  "Critical Low Mastery": "This skill needs extra practice right now.",
};

export function studentFocusReason(reason: string): string {
  return parseRiskReasons(reason)
    .map((part) => STUDENT_REASON_COPY[part] ?? part)
    .join(" ");
}

export function studentFocusAction(riskScore: number): string {
  if (riskScore >= 80) {
    return "Start here: open Socrates and ask a question about this skill, then try a short quiz.";
  }
  if (riskScore >= 60) {
    return "Practice this skill this week with a quiz and one tutor hint.";
  }
  if (riskScore >= 40) {
    return "Keep practising — a few more correct attempts will help.";
  }
  return "Light review is enough for now.";
}
