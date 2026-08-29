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

export function createChatMessage(
  role: ChatRole,
  content: string,
  extras?: Partial<Pick<ChatMessage, "isHint">>
): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
    ...extras,
  };
}
