import { create } from "zustand";

import { requestHintAutoTopic } from "@/lib/api/tutor";
import { useUserStore } from "@/store/useUserStore";
import {
  createChatMessage,
  DEFAULT_TUTOR_PERSONA_ID,
  type ChatMessage,
  type HintAutoTopicRequest,
  type TopicRouting,
  type TutorHistoryTurn,
  type TutorPersonaId,
  type TutorTurnMetadata,
} from "@/types";

const EMPTY_METADATA: TutorTurnMetadata = {
  topicRouting: null,
  hintMode: null,
  masteryProbability: null,
  masteryProbabilityBefore: null,
  personaLabel: null,
};

const FARM_TOPIC_PREFIX = "scipath_farm_topic__";

function rememberTopicForFarm(topicId: string | null | undefined) {
  const id = topicId?.trim();
  if (!id || typeof window === "undefined") return;
  const userId = useUserStore.getState().userId;
  if (!userId) return;
  try {
    localStorage.setItem(`${FARM_TOPIC_PREFIX}${userId}`, id);
  } catch {
    /* ignore */
  }
}

function createWelcomeMessage(): ChatMessage {
  return {
    id: "socrates-welcome",
    role: "tutor",
    content:
      "Hello! I'm Socrates, your AI Science Companion 🧬. Tell me what you're working on, or where you feel stuck — I'll guide you with questions rather than answers.",
    createdAt: new Date().toISOString(),
  };
}

function toHistory(messages: ChatMessage[]): TutorHistoryTurn[] {
  return messages
    .filter((message) => message.id !== "socrates-welcome")
    .map((message) => ({
      role: message.role === "student" ? "user" : "assistant",
      content: message.content,
    }));
}

function buildRequest(
  studentAnswer: string,
  state: Pick<
    TutorState,
    "messages" | "preferredPersonaId" | "activeTopicId" | "topicLocked"
  >
): HintAutoTopicRequest {
  const userId = useUserStore.getState().user?.id ?? "student_demo";
  const conversationHistory = toHistory(state.messages);
  const shouldSendTopic = Boolean(state.topicLocked && state.activeTopicId);

  return {
    user_id: userId,
    student_answer: studentAnswer,
    context_k: 4,
    persona_id: state.preferredPersonaId,
    ...(conversationHistory.length > 0
      ? { conversation_history: conversationHistory }
      : {}),
    ...(shouldSendTopic ? { topic_id: state.activeTopicId } : {}),
  };
}

interface TutorState {
  messages: ChatMessage[];
  /** Student's saved coaching style; always sent as persona_id. */
  preferredPersonaId: TutorPersonaId;
  /** Persona the last tutor turn actually used (may be Encourager under high frustration). */
  personaId: TutorPersonaId;
  activeTopicId: string | null;
  topicLocked: boolean;
  metadata: TutorTurnMetadata;
  lessonNotice: string | null;
  isSending: boolean;
  error: string | null;
  setPersonaId: (personaId: TutorPersonaId) => void;
  setTopicLocked: (locked: boolean) => void;
  dismissLessonNotice: () => void;
  sendMessage: (content: string) => Promise<void>;
  requestHint: (prompt?: string) => Promise<void>;
  resetConversation: () => void;
}

function applySuccessfulTurn(
  state: TutorState,
  hintText: string,
  isHint: boolean,
  response: {
    persona_id: TutorPersonaId;
    persona_label: string | null;
    topic_id_resolved: string | null;
    topic_routing: TopicRouting | null;
    hint_mode: string | null;
    mastery_probability: number | null;
    mastery_probability_before: number | null;
  }
): Partial<TutorState> {
  const nextTopicId = response.topic_id_resolved ?? state.activeTopicId;
  rememberTopicForFarm(nextTopicId);
  const switched =
    response.topic_routing === "switched" && Boolean(response.topic_id_resolved);

  return {
    messages: [
      ...state.messages,
      createChatMessage("tutor", hintText, { isHint }),
    ],
    personaId: response.persona_id,
    preferredPersonaId: state.preferredPersonaId,
    activeTopicId: nextTopicId,
    metadata: {
      topicRouting: response.topic_routing,
      hintMode: response.hint_mode,
      masteryProbability: response.mastery_probability,
      masteryProbabilityBefore: response.mastery_probability_before,
      personaLabel: response.persona_label,
    },
    lessonNotice: switched
      ? `Switched to lesson: ${response.topic_id_resolved}`
      : null,
    isSending: false,
    error: null,
  };
}

async function postTurn(
  content: string,
  isHint: boolean,
  get: () => TutorState,
  set: (
    partial:
      | Partial<TutorState>
      | ((state: TutorState) => Partial<TutorState>)
  ) => void
) {
  const trimmed = content.trim();
  if (!trimmed || get().isSending) return;

  const snapshot = get();
  const studentMessage = createChatMessage("student", trimmed);
  set({
    messages: [...snapshot.messages, studentMessage],
    isSending: true,
    error: null,
    lessonNotice: null,
  });

  try {
    const response = await requestHintAutoTopic(
      buildRequest(trimmed, snapshot)
    );

    set((state) =>
      applySuccessfulTurn(state, response.hint_text, isHint, response)
    );
  } catch (caught) {
    const message =
      caught instanceof Error
        ? caught.message
        : "Socrates couldn't reach the tutor service. Please try again.";
    set({ isSending: false, error: message });
  }
}

export const useTutorStore = create<TutorState>((set, get) => ({
  messages: [createWelcomeMessage()],
  preferredPersonaId: DEFAULT_TUTOR_PERSONA_ID,
  personaId: DEFAULT_TUTOR_PERSONA_ID,
  activeTopicId: null,
  topicLocked: false,
  metadata: EMPTY_METADATA,
  lessonNotice: null,
  isSending: false,
  error: null,

  setPersonaId: (personaId) =>
    set({ preferredPersonaId: personaId, personaId }),

  setTopicLocked: (locked) => {
    if (locked && !get().activeTopicId) return;
    set({ topicLocked: locked });
  },

  dismissLessonNotice: () => set({ lessonNotice: null }),

  sendMessage: async (content) => {
    await postTurn(content, false, get, set);
  },

  requestHint: async (prompt = "Give me a hint") => {
    await postTurn(prompt, true, get, set);
  },

  resetConversation: () =>
    set({
      messages: [createWelcomeMessage()],
      personaId: get().preferredPersonaId,
      activeTopicId: null,
      topicLocked: false,
      metadata: EMPTY_METADATA,
      lessonNotice: null,
      isSending: false,
      error: null,
    }),
}));
