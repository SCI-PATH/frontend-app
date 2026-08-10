export type UserRole = "student" | "educator";

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
