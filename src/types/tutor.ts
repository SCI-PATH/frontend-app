export type TutorPersonaId =
  | "practical_encourager"
  | "analytical_coach"
  | "curious_explorer";

export type ChatRole = "student" | "tutor";

export type ApiChatRole = "user" | "assistant";

export type TopicRouting =
  | "inferred"
  | "continued"
  | "switched"
  | "explicit"
  | "none";

export const TOPIC_ROUTING_VALUES: readonly TopicRouting[] = [
  "inferred",
  "continued",
  "switched",
  "explicit",
  "none",
] as const;

export interface TutorPersona {
  id: TutorPersonaId;
  label: string;
  description: string;
}

export const TUTOR_PERSONAS: readonly TutorPersona[] = [
  {
    id: "practical_encourager",
    label: "The Practical Encourager",
    description: "Cheers you on and connects ideas to everyday science.",
  },
  {
    id: "analytical_coach",
    label: "The Analytical Coach",
    description: "Breaks problems into steps and checks your reasoning.",
  },
  {
    id: "curious_explorer",
    label: "The Curious Explorer",
    description: "Asks wonder-questions that help you discover the answer.",
  },
] as const;

export const DEFAULT_TUTOR_PERSONA_ID: TutorPersonaId = "curious_explorer";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  isHint?: boolean;
  personaId?: TutorPersonaId;
  steps?: string[];
  closingQuestion?: string | null;
}

export interface TutorHistoryTurn {
  role: ApiChatRole;
  content: string;
}

export interface TutorTurnMetadata {
  topicRouting: TopicRouting | null;
  hintMode: string | null;
  masteryProbability: number | null;
  masteryProbabilityBefore: number | null;
  personaLabel: string | null;
}

/** POST /tutor/hint-auto-topic */
export interface HintAutoTopicRequest {
  user_id: string;
  student_answer: string;
  topic_id?: string | null;
  /** Student grade 6–9; scopes auto topic routing when the lesson is unlocked. */
  grade?: number | null;
  conversation_history?: TutorHistoryTurn[];
  context_k?: number;
  persona_id?: TutorPersonaId;
}

export interface HintAutoTopicResponse {
  success: boolean;
  hint_text: string;
  persona_id: TutorPersonaId;
  persona_label: string | null;
  topic_id_resolved: string | null;
  topic_routing: TopicRouting | null;
  hint_mode: string | null;
  mastery_probability: number | null;
  mastery_probability_before: number | null;
  hint_steps: string[];
  closing_question: string | null;
  error?: string;
}

export function getPersonaById(id: TutorPersonaId): TutorPersona {
  return (
    TUTOR_PERSONAS.find((persona) => persona.id === id) ?? TUTOR_PERSONAS[2]
  );
}

export function resolvePersonaId(value: unknown): TutorPersonaId {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_")
    .replace(/\s+/g, "_");
  const exact = TUTOR_PERSONAS.find((persona) => persona.id === raw);
  if (exact) return exact.id;
  if (raw.includes("analytical")) return "analytical_coach";
  if (raw.includes("curious") || raw.includes("explorer")) {
    return "curious_explorer";
  }
  if (raw.includes("practical") || raw.includes("encourager")) {
    return "practical_encourager";
  }
  return DEFAULT_TUTOR_PERSONA_ID;
}

export function parseTopicRouting(value: unknown): TopicRouting | null {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  return TOPIC_ROUTING_VALUES.includes(raw as TopicRouting)
    ? (raw as TopicRouting)
    : null;
}

/** Display-only label from a curriculum topic_id (no client-side classification). */
export function formatTopicDisplay(topicId: string): string {
  const parts = topicId.split("_").filter(Boolean);
  if (parts.length === 0) return topicId;

  const gradeMatch = parts[0].match(/^G(\d+)$/i);
  const chapterIsCode = Boolean(parts[1]?.match(/^[CS]\d+$/i));
  const nameParts = parts.slice(gradeMatch ? (chapterIsCode ? 2 : 1) : 0);

  const name = nameParts
    .map((part) =>
      part.length <= 3
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join(" ")
    .trim();

  if (gradeMatch && name) return `${name} (G${gradeMatch[1]})`;
  return name || topicId;
}

export function formatTopicLabel(topicId: string | null | undefined): string {
  if (!topicId) return "Awaiting lesson";
  return formatTopicDisplay(topicId);
}

const NUMBERED_LINE = /^\s*(?:\(?([1-9])\)?[.)]|[-*])\s+(.+?)\s*$/;

/** Pull the last follow-up question out of a Socrates reply. */
export function splitTutorFollowUp(hintText: string): {
  body: string;
  question: string | null;
} {
  const raw = hintText.trim();
  if (!raw) return { body: "", question: null };

  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const lastLine = lines.at(-1) ?? "";
  if (lines.length > 1 && lastLine.includes("?")) {
    return {
      body: lines.slice(0, -1).join("\n").trim(),
      question: lastLine,
    };
  }

  const sentenceSplit = raw.match(/^(.*[.!])\s+([^?]*\?)\s*$/s);
  if (sentenceSplit?.[1] && sentenceSplit[2]) {
    return {
      body: sentenceSplit[1].trim(),
      question: sentenceSplit[2].trim(),
    };
  }

  if (raw.endsWith("?") && !/[.!]\s+/.test(raw.slice(0, -1))) {
    return { body: "", question: raw };
  }

  return { body: raw, question: null };
}

/** Split an Analytical Coach reply into 3 steps + a closing question. */
export function parseAnalyticalCoachSteps(hintText: string): {
  steps: string[];
  closingQuestion: string | null;
} {
  const raw = hintText.trim();
  if (!raw) return { steps: [], closingQuestion: null };

  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const steps: string[] = [];
  const other: string[] = [];
  for (const line of lines) {
    const match = line.match(NUMBERED_LINE);
    if (match?.[2]) {
      steps.push(match[2].replace(/\?+/g, "").trim());
    }
    else other.push(line);
  }

  if (steps.length < 2) {
    const inline = [
      ...raw.matchAll(/(?:^|\s)\(?([1-3])\)?[.)]\s+(.+?)(?=(?:\s*\(?[1-3]\)?[.)])|$)/g),
    ];
    if (inline.length >= 2) {
      return {
        steps: inline
          .slice(0, 3)
          .map((part) => part[2].replace(/\?+/g, "").trim().replace(/[.\s]+$/, "")),
        closingQuestion: other.at(-1) ?? null,
      };
    }
  }

  let closingQuestion = other.at(-1) ?? null;
  if (!closingQuestion && steps.at(-1)?.endsWith("?")) {
    closingQuestion = steps.pop() ?? null;
  }

  return {
    steps: steps.slice(0, 3),
    closingQuestion,
  };
}

export function createChatMessage(
  role: ChatRole,
  content: string,
  extras?: Partial<Pick<ChatMessage, "isHint" | "personaId" | "steps" | "closingQuestion">>
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extras,
  };
}
