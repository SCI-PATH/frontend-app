export type UserRole = "student" | "educator";

export type {
  AtRiskStudentAlert,
  AtRiskStudentsRequest,
  AtRiskStudentsResponse,
  BktParameterRow,
  ChatHistoryTurn,
  ClassroomSliceResponse,
  ClassroomStudentMeta,
  ClassroomTopicMeta,
  DistractorTagCount,
  EngagementTimelinePoint,
  MasteryCategory,
  MasteryMatrixRequest,
  MasteryMatrixResponse,
  MasteryTimelinePoint,
  MatrixBandCounts,
  RiskTierId,
  StudentProfileResponse,
} from "./educator";

export {
  TUTOR_PERSONAS,
  DEFAULT_TUTOR_PERSONA_ID,
  TOPIC_ROUTING_VALUES,
  createChatMessage,
  formatTopicDisplay,
  formatTopicLabel,
  getPersonaById,
  parseTopicRouting,
  resolvePersonaId,
} from "./tutor";
export type {
  ApiChatRole,
  ChatMessage,
  ChatRole,
  HintAutoTopicRequest,
  HintAutoTopicResponse,
  TopicRouting,
  TutorHistoryTurn,
  TutorPersona,
  TutorPersonaId,
  TutorTurnMetadata,
} from "./tutor";

export type GradeLevel = "Grade 6" | "Grade 7" | "Grade 8" | "Grade 9";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** Present for students */
  grade?: GradeLevel;
  /** Optional class join code for students */
  classCode?: string;
  /** Present for educators */
  schoolName?: string;
  /** Present for educators */
  sectionName?: string;
}
