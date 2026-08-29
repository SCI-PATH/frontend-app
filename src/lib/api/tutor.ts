import { API_BASE_URL } from "@/lib/api/config";
import {
  parseTopicRouting,
  resolvePersonaId,
  type HintAutoTopicRequest,
  type HintAutoTopicResponse,
} from "@/types";

const HINT_AUTO_TOPIC_PATH = "/tutor/hint-auto-topic";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function pickString(...candidates: unknown[]): string | null {
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function pickNumber(...candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate;
    }
    if (typeof candidate === "string" && candidate.trim()) {
      const parsed = Number(candidate);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function formatApiError(payload: unknown, status: number): string {
  const record = asRecord(payload);
  const detail = record.detail;

  if (typeof detail === "string" && detail.trim()) return detail.trim();
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        const entry = asRecord(item);
        return pickString(entry.msg, entry.message);
      })
      .filter((message): message is string => Boolean(message));
    if (messages.length > 0) return messages.join(" ");
  }

  return (
    pickString(record.error, record.message) ??
    `Tutor service returned ${status}. Please try again.`
  );
}

export function parseHintAutoTopicResponse(
  payload: unknown
): HintAutoTopicResponse {
  const data = asRecord(payload);

  if (data.success === false) {
    throw new Error(
      pickString(data.error, data.message, data.detail) ??
        "The tutor service could not generate a reply."
    );
  }

  const hintText = pickString(
    data.hint_text,
    data.reply,
    data.response,
    data.hint
  );

  if (!hintText) {
    throw new Error("The tutor service returned an empty hint_text.");
  }

  const topicRouting = parseTopicRouting(data.topic_routing);
  const topicIdResolved =
    topicRouting === "none"
      ? null
      : pickString(data.topic_id_resolved, data.topic_id);

  return {
    success: true,
    hint_text: hintText,
    persona_id: resolvePersonaId(data.persona_id ?? data.persona),
    persona_label: pickString(data.persona_label),
    topic_id_resolved: topicIdResolved,
    topic_routing: topicRouting,
    hint_mode: pickString(data.hint_mode),
    mastery_probability: pickNumber(
      data.mastery_probability,
      data.updated_mastery_probability
    ),
    mastery_probability_before: pickNumber(data.mastery_probability_before),
  };
}

export async function requestHintAutoTopic(
  request: HintAutoTopicRequest
): Promise<HintAutoTopicResponse> {
  const body: Record<string, unknown> = {
    user_id: request.user_id,
    student_answer: request.student_answer,
    context_k: request.context_k ?? 4,
  };

  if (request.persona_id) body.persona_id = request.persona_id;
  if (request.topic_id) body.topic_id = request.topic_id;
  if (
    typeof request.grade === "number" &&
    Number.isFinite(request.grade) &&
    request.grade >= 6 &&
    request.grade <= 9
  ) {
    body.grade = Math.trunc(request.grade);
  }
  if (request.conversation_history?.length) {
    body.conversation_history = request.conversation_history;
  }

  const response = await fetch(`${API_BASE_URL}${HINT_AUTO_TOPIC_PATH}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(formatApiError(payload, response.status));
  }

  return parseHintAutoTopicResponse(payload);
}
