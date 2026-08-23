import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brain,
  Gamepad2,
  MessageCircle,
  Route,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

export type LandingFeatureId =
  | "socrates"
  | "farm-unlock"
  | "learning-path"
  | "dda"
  | "bkt";

export type LandingFeature = {
  id: LandingFeatureId;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: "primary" | "secondary" | "accent" | "special";
  bullets: string[];
  previewLabel: string;
};

export const LANDING_FEATURES: LandingFeature[] = [
  {
    id: "socrates",
    name: "Socrates",
    tagline: "Your Socratic science tutor",
    description:
      "Ask questions in plain language and get hints—not answers. Socrates grounds every reply in your grade syllabus, adapts tone to frustration cues, and updates mastery only when you truly demonstrate understanding.",
    icon: MessageCircle,
    accent: "primary",
    bullets: [
      "RAG-grounded hints from Grade 6–9 science PDFs",
      "Conversation-aware follow-ups, not one-shot replies",
      "Mastery-aware scaffolding from basic → advanced",
    ],
    previewLabel: "Live tutor dialogue",
  },
  {
    id: "farm-unlock",
    name: "Farm & Unlock",
    tagline: "Gamified science arena",
    description:
      "Earn XP, keep streaks alive, and unlock farm zones as you master skills. Farm & Unlock turns practice into missions so learners stay motivated between formal assessments.",
    icon: Gamepad2,
    accent: "special",
    bullets: [
      "Quest-based missions tied to curriculum topics",
      "XP, streaks, and unlockable rewards",
      "Difficulty that scales with your performance",
    ],
    previewLabel: "Mission progress",
  },
  {
    id: "learning-path",
    name: "Adaptive Paths",
    tagline: "Dynamic content generation",
    description:
      "Teachers generate lesson pathways aligned to the national syllabus. Students receive sequenced explanations, analogies, and depth adjustments based on what they already know.",
    icon: Route,
    accent: "secondary",
    bullets: [
      "Grade-scoped chapter and skill sequencing",
      "Teacher-authored content generation workflows",
      "Personalized next-step recommendations",
    ],
    previewLabel: "Path progression",
  },
  {
    id: "dda",
    name: "Smart Assessments",
    tagline: "Dynamic difficulty adjustment",
    description:
      "The question engine generates grounded MCQs and short answers, then adjusts difficulty using IRT signals and live mastery categories—basic, intermediate, and advanced.",
    icon: Target,
    accent: "accent",
    bullets: [
      "Syllabus-grounded question generation",
      "Real-time difficulty tuning per learner",
      "Rich distractor tags for misconception tracking",
    ],
    previewLabel: "Quiz adaptivity",
  },
  {
    id: "bkt",
    name: "BKT Analytics",
    tagline: "Knowledge tracing for teachers",
    description:
      "Bayesian Knowledge Tracing maintains one mastery trajectory per learner × topic. Educators see heatmaps, at-risk alerts, and deep-dive profiles scoped to their classroom.",
    icon: BarChart3,
    accent: "primary",
    bullets: [
      "Live P(L) mastery matrix by class code",
      "2-of-3 at-risk rule with intervention tiers",
      "Student focus areas and tutor transcript review",
    ],
    previewLabel: "Classroom mastery",
  },
];

export const LANDING_STATS = [
  { label: "Grades covered", value: "6–9", icon: Sparkles },
  { label: "Science skills tracked", value: "120+", icon: Brain },
  { label: "Adaptive modules", value: "5", icon: Zap },
] as const;

export const ACCENT_STYLES = {
  primary: {
    ring: "ring-brand-primary/30",
    bg: "bg-brand-primary/10",
    text: "text-brand-primary",
    gradient: "from-brand-primary/20 to-brand-primary/5",
    dot: "bg-brand-primary",
  },
  secondary: {
    ring: "ring-brand-secondary/30",
    bg: "bg-brand-secondary/15",
    text: "text-brand-secondary",
    gradient: "from-brand-secondary/25 to-brand-secondary/5",
    dot: "bg-brand-secondary",
  },
  accent: {
    ring: "ring-brand-accent/30",
    bg: "bg-brand-accent/10",
    text: "text-brand-accent",
    gradient: "from-brand-accent/20 to-brand-accent/5",
    dot: "bg-brand-accent",
  },
  special: {
    ring: "ring-brand-special/30",
    bg: "bg-brand-special/10",
    text: "text-brand-special",
    gradient: "from-brand-special/20 to-brand-special/5",
    dot: "bg-brand-special",
  },
} as const;
