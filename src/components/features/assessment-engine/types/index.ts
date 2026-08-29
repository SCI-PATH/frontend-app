/** Assessment Engine (Component 2) types — isolated from shared src/types. */

export type QuestionType = "MCQ" | "TrueFalse" | "ShortAnswer" | "MultiBlank";

/** FE-only question snapshot for review when BE history lags. */
export interface ClientQuestionSnapshot {
  prompt: string;
  question_type?: QuestionType;
  options?: Record<string, string> | string[];
}

export type AmplitudeCategory = "BASIC" | "INTERMEDIATE" | "ADVANCED";

export type PastGradeMarksRange = "BELOW_50" | "50_75" | "ABOVE_75";

export type RejectReason =
  | "FACTUAL_ERROR"
  | "OUT_OF_SCOPE"
  | "POOR_PHRASING"
  | "TOO_EASY"
  | "TOO_HARD"
  | "OTHER";

export type QuestionStatus = "pending" | "approved" | "rejected";

export interface ChapterOption {
  id: string;
  label: string;
  grade: number;
}

export interface AmplitudeChapter {
  chapter_id: string;
  chapter: number;
  chapter_title: string;
  topic_ids?: string[];
}

export interface AmplitudeChaptersResponse {
  grade: number;
  count?: number;
  chapters: AmplitudeChapter[];
}

// --- Amplitude ---

export interface AmplitudeSurveyRequest {
  user_id: string;
  grade: number;
  completed_chapter_ids: string[];
  past_grade_marks_range: PastGradeMarksRange;
  study_hours_per_week?: number;
  self_confidence?: number;
  science_self_efficacy?: number;
  prerequisite_ready_count?: number;
  /** Legacy — prefer completed_chapter_ids */
  completed_chapters_count?: number;
}

export interface NestedPrompt {
  type?: string;
  question?: string;
  text?: string;
  options?: Record<string, string> | string[];
  paragraph?: string;
}

/** Normalized view model for UI rendering. */
export interface AmplitudeQuizQuestion {
  question_id: string;
  prompt: string;
  options?: Record<string, string> | string[];
  paragraph?: string;
  question_type?: QuestionType;
  dok_level?: number;
}

export interface AmplitudeQuizQuestionRaw {
  id?: string;
  question_id?: string;
  question_type?: string;
  type?: string;
  dok_level?: number;
  prompt?: string | NestedPrompt;
  payload?: NestedPrompt;
  question?: string | NestedPrompt;
  options?: Record<string, string> | string[];
  correct_answer?: unknown;
  ideal_answer?: unknown;
  answers?: unknown;
  keywords?: unknown;
  option_diagnostics?: unknown;
  distractor_tag?: unknown;
  distractor_label?: unknown;
}

export interface AmplitudeQuizResponse {
  questions: AmplitudeQuizQuestion[];
  grade?: number;
  count?: number;
}

export interface AmplitudeQuizResponseRaw {
  questions?: AmplitudeQuizQuestionRaw[];
  grade?: number;
  count?: number;
}

export interface AmplitudeEvaluateRequest extends AmplitudeSurveyRequest {
  answers: Record<string, string>;
}

export interface AmplitudeEvaluateResponse {
  category: AmplitudeCategory;
  weighted_score: number;
  quiz_score: number;
  history_score: number;
}

export interface InitialCategoryResponse {
  student_id?: string;
  initial_category?: AmplitudeCategory;
  placement_category?: AmplitudeCategory;
  initial_category_score?: number;
  /** Legacy alias */
  category?: AmplitudeCategory;
  weighted_score?: number;
}

// --- Quizzes ---

export interface CreateCustomizableQuizRequest {
  student_id: string;
  grade: number;
  chapters: string[];
  num_questions: number;
  question_types?: QuestionType[];
}

export interface TriggerPostLessonRequest {
  student_id: string;
  chapter_id: string;
  grade: number;
}

/** Component 4 snapshot echoed by IAE (not a browser call to C4). */
export interface BktSnapshotPublic {
  source?: string;
  topic_bkt?: Record<string, unknown>;
  chapter_ids?: string[];
  topic_ids?: string[];
  unknown_chapter_ids?: string[];
  [key: string]: unknown;
}

export interface QuizSession {
  session_id: string;
  student_id?: string;
  max_questions?: number;
  num_questions?: number;
  questions_asked?: number;
  status?: string;
  chapters?: string[];
  grade?: number;
  elo_rating?: number;
  bkt?: BktSnapshotPublic | null;
}

export interface QuizQuestion {
  question_id: string;
  prompt: string;
  question_type: QuestionType;
  options?: Record<string, string> | string[];
  paragraph?: string;
  blanks?: number;
  dok_level?: number;
  chapter_name?: string;
  question_number?: number;
  total_questions?: number;
  questions_asked?: number;
}

export interface QuizQuestionRaw {
  id?: string;
  question_id?: string;
  question_type?: string;
  type?: string;
  dok_level?: number;
  /** Amplitude bank shape */
  prompt?: string | NestedPrompt;
  /** Adaptive bank shape from GET /quizzes/{id}/next */
  payload?: NestedPrompt;
  question?: string | NestedPrompt;
  options?: Record<string, string> | string[];
  blanks?: number;
  question_number?: number;
  total_questions?: number;
  questions_asked?: number;
  correct_answer?: unknown;
  ideal_answer?: unknown;
  answers?: unknown;
  keywords?: unknown;
  option_diagnostics?: unknown;
  distractor_tag?: unknown;
  distractor_label?: unknown;
}

export interface NextQuestionResponse {
  is_complete?: boolean;
  done?: boolean;
  complete?: boolean;
  question?: QuizQuestionRaw | QuizQuestion | null;
  session_id?: string;
  remaining?: number;
  questions_asked?: number;
  max_questions?: number;
  elo_rating?: number;
  target_dok?: number;
  target_topic_id?: string;
  target_question_type?: string;
  bkt?: BktSnapshotPublic | null;
}

export interface AnswerRequest {
  question_id: string;
  student_answer: string;
  time_taken_seconds: number;
}

/** Grading payload from POST /answer (`grade` field). */
export interface GradeResultPayload {
  is_correct?: boolean;
  accuracy_score?: number;
  feedback?: string;
  reasoning?: string;
  error_category?: string | null;
  missing_keywords?: string[] | null;
  detailed_explanation?: string | null;
  missed_blanks?: Record<string, string> | null;
  concept_explanation?: string | null;
  distractor_tag?: string | null;
  distractor_label?: string | null;
}

export interface AnswerResponse {
  is_correct?: boolean;
  accuracy_score?: number;
  feedback?: string;
  is_complete?: boolean;
  session_complete?: boolean;
  questions_asked?: number;
  elo_rating?: number;
  status?: string;
  grade?: GradeResultPayload;
  bkt?: BktSnapshotPublic | null;
}

/** Attempt trail from GET /quizzes/{id}/results — IAE AttemptRecord (not C4). */
export interface AttemptRecord {
  question_id: string;
  question_type?: QuestionType | string;
  chapter_name?: string;
  sub_concept?: string;
  dok_level?: number;
  student_answer?: string;
  accuracy_score?: number;
  is_correct?: boolean;
  feedback?: string;
  reasoning?: string;
  time_taken_seconds?: number;
  asked_at?: string;
  error_category?: string | null;
  missing_keywords?: string[] | null;
  detailed_explanation?: string | null;
  missed_blanks?: Record<string, string> | null;
  concept_explanation?: string | null;
  distractor_tag?: string | null;
  distractor_label?: string | null;
}

export interface QuizResults {
  session_id: string;
  score?: number;
  accuracy?: number;
  /** IAE results endpoint field (0–1). */
  raw_accuracy?: number;
  correct_count?: number;
  total_answered?: number;
  questions_asked?: number;
  max_questions?: number;
  status?: string;
  session_kind?: string;
  scope_chapter?: string;
  elo_rating?: number;
  /** IAE AttemptRecord list from the results endpoint. */
  history?: AttemptRecord[];
  /** Legacy / alternate shape — prefer `history`. */
  items?: QuizResultItem[];
  /** LLM analyze payload — do not use for Custom Quiz results UI. */
  ai_analysis?: unknown;
}

export interface QuizResultItem {
  question_id: string;
  prompt?: string;
  student_answer?: string;
  expected_answer?: string;
  is_correct?: boolean;
  accuracy_score?: number;
}

export interface TerminateRequest {
  reason: string;
  source: string;
}

// --- History ---

export interface SessionSummary {
  session_id: string;
  student_id?: string;
  user_id?: string;
  created_at?: string;
  ended_at?: string;
  status?: string;
  chapters?: string[];
  chapter_id?: string;
  scope_chapter?: string;
  scope_chapters?: string[];
  grade?: number;
  score?: number;
  accuracy?: number;
  correct_count?: number;
  total_answered?: number;
  /** API field from list sessions. */
  session_kind?: string;
  session_type?: string;
  questions_asked?: number;
  max_questions?: number;
}

export interface SessionDetail extends SessionSummary {
  answers?: SessionAnswerItem[];
  items?: SessionDetailItem[] | SessionAnswerItem[];
  session?: {
    session_id?: string;
    status?: string;
    scope_chapter?: string;
    scope_chapters?: string[];
    questions_asked?: number;
    max_questions?: number;
    history?: AttemptRecord[];
  };
  ai_analysis?: unknown;
}

/** Raw item from GET .../sessions/{id} (attempt + bank question). */
export interface SessionDetailItem {
  attempt?: AttemptRecord;
  question?: SessionDetailQuestion;
  expected_answer?: unknown;
  student_answer?: string;
}

export interface SessionDetailQuestion {
  id?: string;
  question_id?: string;
  question_type?: QuestionType | string;
  type?: string;
  chapter_name?: string;
  sub_concept?: string;
  prompt?: string | NestedPrompt;
  payload?: NestedPrompt & {
    options?: Record<string, string> | string[];
    correct_answer?: unknown;
    ideal_answer?: unknown;
    answers?: unknown;
    paragraph?: string;
    question?: string;
  };
  options?: Record<string, string> | string[];
}

export interface SessionAnswerItem {
  question_id: string;
  prompt?: string;
  question_type?: QuestionType;
  student_answer?: string;
  expected_answer?: string;
  is_correct?: boolean;
  accuracy_score?: number;
  time_taken_seconds?: number;
}

export interface AnalyzeResponse {
  session_id?: string;
  feedback?: string;
  explanations?: AnalyzeExplanation[];
  summary?: string;
}

export interface AnalyzeExplanation {
  question_id: string;
  explanation: string;
  student_answer?: string;
  expected_answer?: string;
}

// --- Teacher ---

export interface TeacherTopic {
  topic_id: string;
  name?: string;
  grade?: number;
  chapter_title?: string;
  skill?: string;
  chapter_number?: number | null;
  domain?: string;
  concept_code?: string;
}

export interface GenerateQuestionsRequest {
  topic_id: string;
  skill?: string | null;
  dok_level: number;
  question_type: QuestionType;
  count: number;
}

export interface GenerateQuestionsResult {
  created: number;
  questions: TeacherQuestion[];
}

export interface TeacherQuestion {
  id: string;
  /** Flattened stem for display (from prompt or payload). */
  prompt: string;
  question_type: QuestionType;
  options?: Record<string, string> | string[];
  paragraph?: string;
  expected_answer?: string;
  dok_level?: number;
  grade?: number;
  class_code?: string;
  status: QuestionStatus;
  topic_id?: string;
  chapter_name?: string;
  rejection_reason?: RejectReason;
  rejection_notes?: string;
  rejection_confirmed_ai?: boolean;
  created_at?: string;
}

/** Raw C2 teacher question — stem often under `payload`, not top-level `prompt`. */
export interface TeacherQuestionRaw {
  id: string;
  question_type?: string | QuestionType;
  type?: string;
  prompt?: string | NestedPrompt;
  payload?: NestedPrompt & {
    correct_answer?: unknown;
    ideal_answer?: unknown;
    answers?: unknown;
    keywords?: unknown;
  };
  options?: Record<string, string> | string[];
  expected_answer?: string;
  correct_answer?: unknown;
  ideal_answer?: unknown;
  answers?: unknown;
  dok_level?: number;
  grade?: number;
  class_code?: string;
  status?: QuestionStatus | string;
  topic_id?: string;
  chapter_name?: string;
  rejection_reason?: RejectReason;
  rejection_notes?: string;
  rejection_confirmed_ai?: boolean;
  created_at?: string;
}

export interface TeacherQuestionsQuery {
  status?: QuestionStatus | string;
  grade?: number;
  class_code?: string;
  dok_level?: number;
  question_type?: QuestionType;
  topic_id?: string;
  limit?: number;
}

export interface RejectQuestionRequest {
  reason: RejectReason;
  notes?: string;
}

/** Matches IAE CreateTeacherQuestionRequest (payload-discriminated). */
export type TeacherQuestionPayload =
  | {
      type: "MCQ";
      question: string;
      options: Record<string, string>;
      correct_answer: string;
    }
  | {
      type: "TrueFalse";
      question: string;
      correct_answer: "True" | "False";
      distractor_tag?: string;
      distractor_label?: string;
    }
  | {
      type: "ShortAnswer";
      question: string;
      ideal_answer: string;
      keywords: string[];
    }
  | {
      type: "MultiBlank";
      paragraph: string;
      answers: string[];
    };

export interface CreateTeacherQuestionRequest {
  grade: number;
  chapter_name: string;
  topic_id: string;
  skill: string;
  dok_level: number;
  question_type: QuestionType;
  payload: TeacherQuestionPayload;
  sub_concept?: string;
}

/** Most-missed insight row — wired when teacher insights endpoint ships. */
export interface MostMissedQuestionInsight {
  question_id: string;
  prompt?: string;
  topic_id?: string;
  incorrect_count: number;
  attempt_count: number;
  miss_rate?: number;
}

export class AssessmentApiError extends Error {
  status: number;
  detail: unknown;

  constructor(status: number, detail: unknown) {
    const message =
      typeof detail === "string"
        ? detail
        : detail && typeof detail === "object" && "msg" in detail
          ? String((detail as { msg: unknown }).msg)
          : `Assessment API error (${status})`;
    super(message);
    this.name = "AssessmentApiError";
    this.status = status;
    this.detail = detail;
  }
}
