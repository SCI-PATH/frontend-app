import type {
  NestedPrompt,
  QuestionStatus,
  QuestionType,
  QuizQuestion,
  QuizQuestionRaw,
  TeacherQuestion,
  TeacherQuestionRaw,
} from "../types";

const QUESTION_TYPES = new Set<QuestionType>([
  "MCQ",
  "TrueFalse",
  "ShortAnswer",
  "MultiBlank",
]);

const SECRET_KEYS = [
  "correct_answer",
  "ideal_answer",
  "answers",
  "keywords",
  "option_diagnostics",
  "distractor_tag",
  "distractor_label",
] as const;

export function asQuestionType(value: unknown): QuestionType | undefined {
  if (typeof value !== "string") return undefined;
  if (QUESTION_TYPES.has(value as QuestionType)) return value as QuestionType;
  const normalized = value.replace(/[_\s-]/g, "").toLowerCase();
  if (normalized === "mcq" || normalized === "multiplechoice") return "MCQ";
  if (normalized === "truefalse" || normalized === "tf") return "TrueFalse";
  if (normalized === "shortanswer") return "ShortAnswer";
  if (normalized === "multiblank" || normalized === "fillintheblank") {
    return "MultiBlank";
  }
  return undefined;
}

export function asPromptString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    const obj = value as NestedPrompt;
    if (typeof obj.question === "string") return obj.question;
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.paragraph === "string") return obj.paragraph;
  }
  return "";
}

/**
 * Amplitude uses nested `prompt`; adaptive `/next` uses nested `payload`.
 * Prefer prompt, then payload, then object-shaped `question`.
 */
function resolveBody(
  raw: QuizQuestionRaw
): string | NestedPrompt | null {
  if (raw.prompt != null) return raw.prompt;
  if (raw.payload != null) return raw.payload;
  if (raw.question != null && typeof raw.question === "object") {
    return raw.question;
  }
  return null;
}

/** Strip answer keys before showing items to students (shallow + nested body). */
export function stripQuestionSecrets<T extends Record<string, unknown>>(
  raw: T
): T {
  const copy = { ...raw };
  for (const key of SECRET_KEYS) {
    delete copy[key];
  }
  for (const nestKey of ["prompt", "payload"] as const) {
    const nested = copy[nestKey];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      const nestedCopy = { ...(nested as Record<string, unknown>) };
      for (const key of SECRET_KEYS) {
        delete nestedCopy[key];
      }
      copy[nestKey] = nestedCopy;
    }
  }
  return copy;
}

/**
 * Flatten Amplitude `prompt` or adaptive `payload` into a UI-safe QuizQuestion.
 * Never expose correct_answer / ideal_answer / answers / etc.
 */
export function normalizeQuestion(raw: QuizQuestionRaw): QuizQuestion {
  const cleaned = stripQuestionSecrets(
    raw as QuizQuestionRaw & Record<string, unknown>
  ) as QuizQuestionRaw;

  const body = resolveBody(cleaned);
  const bodyObj =
    body && typeof body === "object" ? (body as NestedPrompt) : null;

  const stem =
    asPromptString(body) ||
    (typeof cleaned.question === "string" ? cleaned.question : "") ||
    "Question";

  const questionType =
    asQuestionType(cleaned.question_type) ||
    asQuestionType(cleaned.type) ||
    asQuestionType(bodyObj?.type) ||
    "MCQ";

  const options = bodyObj?.options ?? cleaned.options ?? undefined;

  const paragraph =
    bodyObj && typeof bodyObj.paragraph === "string"
      ? bodyObj.paragraph
      : undefined;

  let blanks = cleaned.blanks;
  if (questionType === "MultiBlank" && blanks == null) {
    if (paragraph) {
      const matches = paragraph.match(/_{2,}|\{\{blank\}\}|\[blank\]/gi);
      blanks = matches?.length ? matches.length : 2;
    } else {
      blanks = 2;
    }
  }

  return {
    question_id:
      cleaned.question_id ||
      cleaned.id ||
      `q-${Math.random().toString(36).slice(2, 10)}`,
    prompt: paragraph ? paragraph : stem,
    question_type: questionType,
    options,
    paragraph,
    blanks,
    dok_level: cleaned.dok_level,
    question_number: cleaned.question_number,
    total_questions: cleaned.total_questions,
    questions_asked: cleaned.questions_asked,
  };
}

/**
 * Teacher bank items use the same prompt ?? payload stem mapping as quizzes.
 * Keeps expected_answer for educator review (not shown to students).
 */
export function normalizeTeacherQuestion(
  raw: TeacherQuestionRaw
): TeacherQuestion {
  const body = resolveBody({
    prompt: raw.prompt,
    payload: raw.payload,
  } as QuizQuestionRaw);
  const bodyObj =
    body && typeof body === "object" ? (body as NestedPrompt) : null;

  const expectedFromBody = (() => {
    if (!bodyObj) return undefined;
    const extra = bodyObj as NestedPrompt & {
      correct_answer?: unknown;
      ideal_answer?: unknown;
      answers?: unknown;
    };
    if (typeof extra.correct_answer === "string") return extra.correct_answer;
    if (typeof extra.ideal_answer === "string") return extra.ideal_answer;
    if (typeof extra.answers === "string") return extra.answers;
    return undefined;
  })();

  const q = normalizeQuestion({
    id: raw.id,
    question_id: raw.id,
    question_type: raw.question_type,
    type: raw.type,
    prompt: raw.prompt,
    payload: raw.payload,
    options: raw.options,
    dok_level: raw.dok_level,
  });

  const expected =
    (typeof raw.expected_answer === "string" && raw.expected_answer) ||
    (typeof raw.correct_answer === "string" && raw.correct_answer) ||
    (typeof raw.ideal_answer === "string" && raw.ideal_answer) ||
    expectedFromBody ||
    undefined;

  return {
    id: raw.id,
    prompt: q.prompt,
    question_type: q.question_type,
    options: q.options,
    paragraph: q.paragraph,
    expected_answer: expected,
    dok_level: raw.dok_level ?? q.dok_level,
    grade: raw.grade,
    class_code: raw.class_code,
    status: (raw.status as QuestionStatus) || "pending",
    topic_id: raw.topic_id,
    rejection_reason: raw.rejection_reason,
    rejection_notes: raw.rejection_notes,
    rejection_confirmed_ai: raw.rejection_confirmed_ai,
    created_at: raw.created_at,
  };
}

export function isSessionComplete(flags: {
  is_complete?: boolean;
  done?: boolean;
  complete?: boolean;
  session_complete?: boolean;
  hasQuestion?: boolean;
}): boolean {
  if (flags.is_complete === true) return true;
  if (flags.session_complete === true) return true;
  if (flags.done === true || flags.complete === true) return true;
  if (flags.hasQuestion === false) return true;
  return false;
}
