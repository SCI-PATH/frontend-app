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

export interface TeacherClass {
  class_code: string;
  class_name: string;
  grade_level: number;
  subject?: string;
  teacher_id?: string;
  is_active?: boolean;
}

export interface ClassScopeMeta {
  classCode: string;
  className: string;
  gradeLevel: number;
  subject?: string;
}

export interface ClassroomSliceResponse {
  success: boolean;
  source: "postgres" | "analytics_api" | "error";
  mode: "live_state";
  studentIds: string[];
  students: ClassroomStudentMeta[];
  topicIds: string[];
  topics: ClassroomTopicMeta[];
  /** Quiz attempt counts per learner × topic (sparse; missing pairs = 0 attempts). */
  attemptMatrix?: Record<string, Record<string, number>>;
  classCode?: string;
  className?: string;
  gradeLevel?: number;
  subject?: string;
  learnerCount: number;
  topicCount: number;
  error?: string;
}

export interface MasteryMatrixRequest {
  class_code?: string;
  student_ids?: string[];
  topic_ids?: string[];
}

export interface AnalyticsClassScopeFields {
  class_code?: string;
  class_name?: string;
  grade_level?: number;
  subject?: string;
  teacher_id?: string;
}

export interface MasteryMatrixResponse extends AnalyticsClassScopeFields {
  success: boolean;
  mode: "live_state";
  student_ids: string[];
  topic_ids: string[];
  unknown_topic_ids?: string[];
  mastery_matrix: Record<string, Record<string, number | null>>;
  roster_count?: number;
  topic_count?: number;
  error?: string;
}

export interface AtRiskStudentsRequest {
  class_code?: string;
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

export interface AtRiskStudentsResponse extends AnalyticsClassScopeFields {
  success: boolean;
  mode: "live_state";
  count: number;
  students: AtRiskStudentAlert[];
  student_ids?: string[];
  topic_ids?: string[];
  error?: string;
}

export interface MasteryTimelinePoint {
  topic_id: string;
  is_correct?: boolean;
  response_time_s?: number | null;
  mastery_probability: number | null;
  distractor_label?: string | null;
  question_type?: string | null;
  error_category?: string | null;
  timestamp?: string | null;
}

export interface RecentAttemptRow {
  topic_id: string;
  is_correct: boolean;
  response_time_s?: number | null;
  mastery_probability?: number | null;
  distractor_label?: string | null;
  question_type?: string | null;
  error_category?: string | null;
  timestamp?: string | null;
}

export interface DiagnosticSkillRow {
  topic_id: string;
  p_l?: number | null;
  mastery_category?: MasteryCategory | string;
  p_s: number;
  p_g: number;
  flag: "high_slip" | "high_guess" | string;
}

export interface DiagnosticSkillsPayload {
  high_slip?: DiagnosticSkillRow[];
  high_guess?: DiagnosticSkillRow[];
  count?: number;
  thresholds?: {
    p_s?: number;
    p_g?: number;
  };
  interpretation?: {
    high_slip?: string;
    high_guess?: string;
  };
}

export interface EngagementMasteryGapPayload {
  flagged: boolean;
  engagement_average?: number | null;
  mastery_average?: number | null;
  thresholds?: {
    engagement_min?: number;
    mastery_max?: number;
  };
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

export interface TimeOnTaskTrend {
  topic_id: string;
  avg_time_on_task_s?: number | null;
  last_10_time_on_task_s?: number[];
  trend?: "increasing" | "decreasing" | "stable" | string;
}

export interface StudentFocusArea extends AtRiskStudentAlert {}

export interface StudentProfileResponse {
  success: boolean;
  mode: "live_state";
  user_id: string;
  topics_covered_count?: number;
  bkt_parameters: BktParameterRow[];
  focus_areas?: StudentFocusArea[];
  focus_areas_count?: number;
  assessment_insights?: {
    attempts_count?: number;
    live_attempts_count?: number;
    most_frequent_distractor_tags?: DistractorTagCount[];
  };
  engagement_metrics?: {
    average_frustration_cue?: number | null;
    frustration_samples?: number;
    time_on_task_trends?: TimeOnTaskTrend[];
  };
  mastery_timeline_last_10_attempts?: MasteryTimelinePoint[];
  recent_attempts?: RecentAttemptRow[];
  diagnostic_skills?: DiagnosticSkillsPayload;
  engagement_mastery_gap?: EngagementMasteryGapPayload;
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

export interface ClassSummarySkillHotspot {
  topic_id: string;
  avg_mastery?: number;
  at_risk_count?: number;
  at_risk_share?: number;
  alert_count?: number;
  avg_risk_score?: number;
}

export interface ClassSummaryGapLearner {
  student_id: string;
  engagement_average?: number | null;
  mastery_average?: number | null;
}

export interface ClassDistractorCount extends DistractorTagCount {
  learner_count?: number;
}

export interface ClassSummaryResponse extends AnalyticsClassScopeFields {
  success: boolean;
  mode: "live_state";
  roster_count?: number;
  topic_count?: number;
  student_ids?: string[];
  topic_ids?: string[];
  mastery_bands?: {
    mastered: number;
    learning: number;
    at_risk: number;
    total: number;
    thresholds?: Record<string, string>;
  };
  hardest_skills?: ClassSummarySkillHotspot[];
  at_risk_feed?: {
    count: number;
    top_skills?: ClassSummarySkillHotspot[];
  };
  top_distractors?: ClassDistractorCount[];
  engagement_mastery_gap?: {
    count: number;
    learners?: ClassSummaryGapLearner[];
    thresholds?: {
      engagement_min?: number;
      mastery_max?: number;
    };
    note?: string;
  };
  frustration?: {
    class_average?: number | null;
    samples?: number;
    elevated_count?: number;
    elevated_learner_ids?: string[];
    threshold?: number;
  };
  error?: string;
}

/** Optimized one-pass Classroom Insights payload from Component 4. */
export interface ClassroomDashboardResponse extends AnalyticsClassScopeFields {
  success: boolean;
  mode: "live_state";
  student_ids?: string[];
  topic_ids?: string[];
  unknown_topic_ids?: string[];
  roster_count?: number;
  topic_count?: number;
  mastery_matrix?: Record<string, Record<string, number | null>>;
  at_risk_students?: AtRiskStudentAlert[];
  at_risk_count?: number;
  criteria?: Record<string, unknown>;
  class_summary?: ClassSummaryResponse;
  error?: string;
}
