export type MasteryCategory = "mastered" | "learning" | "at_risk";

export type RiskTierId =
  | "immediate"
  | "attention"
  | "watchlist"
  | "monitor";

export interface ClassroomTopicMeta {
  topicId: string;
  curriculumTitle: string;
  pL0: number;
  pT: number;
  pG: number;
  pS: number;
}

export interface ClassroomStudentMeta {
  learnerId: string;
  displayName: string;
}

export interface ClassroomSliceResponse {
  success: boolean;
  source: "postgres" | "analytics_api" | "error";
  mode: "live_state";
  studentIds: string[];
  students: ClassroomStudentMeta[];
  topicIds: string[];
  topics: ClassroomTopicMeta[];
  learnerCount: number;
  topicCount: number;
  error?: string;
}

export interface MasteryMatrixRequest {
  student_ids: string[];
  topic_ids: string[];
}

export interface MasteryMatrixResponse {
  success: boolean;
  mode: "live_state";
  student_ids: string[];
  topic_ids: string[];
  unknown_topic_ids?: string[];
  mastery_matrix: Record<string, Record<string, number | null>>;
  error?: string;
}

export interface AtRiskStudentsRequest {
  student_ids?: string[];
  topic_ids?: string[];
}

export interface AtRiskStudentAlert {
  student_id: string;
  topic_id: string;
  mastery_probability: number;
  mastery_category?: MasteryCategory | string;
  negative_velocity?: boolean;
  recent_signal_tail?: number[];
  recent_performance_avg?: number | null;
  signals_triggered?: number;
  signals?: {
    low_mastery?: boolean;
    negative_velocity?: boolean;
    weak_recent_performance?: boolean;
  };
  risk_score: number;
  reason: string;
}

export interface AtRiskStudentsResponse {
  success: boolean;
  mode: "live_state";
  count: number;
  students: AtRiskStudentAlert[];
  error?: string;
}

export interface MasteryTimelinePoint {
  topic_id: string;
  is_correct?: boolean;
  response_time_s?: number | null;
  mastery_probability: number | null;
  distractor_label?: string | null;
  question_type?: string | null;
}

export interface EngagementTimelinePoint {
  interaction_score?: number | null;
  timestamp?: string | null;
  topic_id?: string | null;
  persona_id?: string | null;
}

export interface DistractorTagCount {
  tag: string;
  count: number;
}

export interface ChatHistoryTurn {
  topic_id?: string | null;
  student_message?: string | null;
  tutor_hint?: string | null;
  interaction_score?: number | null;
  critical_confusion?: boolean;
  timestamp?: string | null;
  persona_id?: string | null;
}

export interface BktParameterRow {
  topic_id: string;
  p_l: number;
  mastery_category?: MasteryCategory | string;
  p_g: number;
  p_s: number;
  p_t?: number;
  p_l0?: number;
  prior?: number;
  learn?: number;
}

export interface StudentProfileResponse {
  success: boolean;
  mode: "live_state";
  user_id: string;
  topics_covered_count?: number;
  bkt_parameters: BktParameterRow[];
  assessment_insights?: {
    attempts_count?: number;
    live_attempts_count?: number;
    most_frequent_distractor_tags?: DistractorTagCount[];
  };
  engagement_metrics?: {
    average_frustration_cue?: number | null;
    frustration_samples?: number;
  };
  mastery_timeline_last_10_attempts?: MasteryTimelinePoint[];
  engagement_timeline_last_10_turns?: EngagementTimelinePoint[];
  engagement_average_last_10?: number | null;
  chat_history_last_5?: ChatHistoryTurn[];
  critical_confusion_turns?: ChatHistoryTurn[];
  meta?: {
    distractor_source?: string;
    mastery_timeline_points?: number;
    engagement_points?: number;
    chat_points?: number;
    engagement_source?: string;
    chat_source?: string;
  };
  error?: string;
}

export interface MatrixBandCounts {
  mastered: number;
  learning: number;
  atRisk: number;
  total: number;
}
