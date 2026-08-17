/** Shared payload shapes for Learning Path Engine ↔ frontend. */

export type LearnerProfile = "weak" | "average" | "strong" | "smart";

export type CurriculumLesson = {
  lesson_id: string;
  title?: string;
  display_title?: string;
  grade?: number;
  topic_id?: string;
};

export type CurriculumResponse = {
  grade?: number;
  lessons?: CurriculumLesson[];
};

export type StudentSummary = {
  student_id: string;
  full_name: string;
  grade: number;
};

export type LessonResponse = {
  lesson_id?: string;
  lesson_text?: string;
  profile?: LearnerProfile | string;
  presentation_mode?: string;
  status?: string;
  message?: string;
  profile_source?: string;
};
