import type { ChapterOption, MockUser } from "../types";

export const MOCK_USERS: MockUser[] = [
  {
    userId: "mock-student-unassigned",
    displayName: "User 1 · Student",
    role: "student",
    grade: 7,
  },
  {
    userId: "mock-student-class-a",
    displayName: "User 2 · Student w/ Class",
    role: "student",
    grade: 6,
    classCode: "CLASS-A",
  },
  {
    userId: "mock-teacher-1",
    displayName: "User 3 · Teacher",
    role: "teacher",
    classCode: "CLASS-A",
  },
];

export const DEFAULT_MOCK_USER_ID = MOCK_USERS[1].userId;

/**
 * Static chapter catalog using Component 2 IDs (`G{grade}_C{n}`).
 * // TODO: INTEGRATION - Prefer Component 1 curriculum list as source of truth when available.
 */
export const CHAPTER_CATALOG: ChapterOption[] = [
  { id: "G6_C1", label: "G6 · Food & Nutrition", grade: 6 },
  { id: "G6_C2", label: "G6 · Sorting Materials", grade: 6 },
  { id: "G6_C3", label: "G6 · Separation of Substances", grade: 6 },
  { id: "G6_C4", label: "G6 · Changes Around Us", grade: 6 },
  { id: "G6_C5", label: "G6 · Getting to Know Plants", grade: 6 },
  { id: "G6_C6", label: "G6 · Body Movements", grade: 6 },
  { id: "G6_C7", label: "G6 · Living Organisms", grade: 6 },
  { id: "G6_C8", label: "G6 · Motion & Measurement", grade: 6 },
  { id: "G6_C9", label: "G6 · Light, Shadows & Reflections", grade: 6 },
  { id: "G6_C10", label: "G6 · Electricity & Circuits", grade: 6 },
  { id: "G7_C1", label: "G7 · Nutrition in Plants", grade: 7 },
  { id: "G7_C2", label: "G7 · Nutrition in Animals", grade: 7 },
  { id: "G7_C3", label: "G7 · Heat", grade: 7 },
  { id: "G7_C4", label: "G7 · Acids, Bases & Salts", grade: 7 },
  { id: "G7_C5", label: "G7 · Physical & Chemical Changes", grade: 7 },
  { id: "G7_C6", label: "G7 · Respiration", grade: 7 },
  { id: "G7_C7", label: "G7 · Transportation in Animals & Plants", grade: 7 },
  { id: "G7_C8", label: "G7 · Reproduction in Plants", grade: 7 },
  { id: "G7_C9", label: "G7 · Motion & Time", grade: 7 },
  { id: "G7_C10", label: "G7 · Electric Current", grade: 7 },
  { id: "G8_C1", label: "G8 · Crop Production", grade: 8 },
  { id: "G8_C2", label: "G8 · Microorganisms", grade: 8 },
  { id: "G8_C3", label: "G8 · Synthetic Fibres", grade: 8 },
  { id: "G8_C4", label: "G8 · Materials: Metals & Non-Metals", grade: 8 },
  { id: "G8_C5", label: "G8 · Coal & Petroleum", grade: 8 },
  { id: "G8_C6", label: "G8 · Combustion & Flame", grade: 8 },
  { id: "G8_C7", label: "G8 · Conservation of Plants & Animals", grade: 8 },
  { id: "G8_C8", label: "G8 · Cell — Structure & Functions", grade: 8 },
  { id: "G8_C9", label: "G8 · Force & Pressure", grade: 8 },
  { id: "G8_C10", label: "G8 · Friction", grade: 8 },
  { id: "G9_C1", label: "G9 · Matter in Our Surroundings", grade: 9 },
  { id: "G9_C2", label: "G9 · Is Matter Around Us Pure?", grade: 9 },
  { id: "G9_C3", label: "G9 · Atoms & Molecules", grade: 9 },
  { id: "G9_C4", label: "G9 · Structure of the Atom", grade: 9 },
  { id: "G9_C5", label: "G9 · The Fundamental Unit of Life", grade: 9 },
  { id: "G9_C6", label: "G9 · Tissues", grade: 9 },
  { id: "G9_C7", label: "G9 · Motion", grade: 9 },
  { id: "G9_C8", label: "G9 · Force & Laws of Motion", grade: 9 },
  { id: "G9_C9", label: "G9 · Gravitation", grade: 9 },
  { id: "G9_C10", label: "G9 · Work & Energy", grade: 9 },
];

export function chaptersForGrade(grade: number): ChapterOption[] {
  return CHAPTER_CATALOG.filter((c) => c.grade === grade);
}
