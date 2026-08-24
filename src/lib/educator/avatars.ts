export const DEFAULT_TEACHER_AVATAR_ID = "female-01";

export type TeacherAvatarId = "female-01" | "female-02" | "male-01" | "male-02";

export interface TeacherAvatarOption {
  id: TeacherAvatarId;
  label: string;
  src: string;
}

export const TEACHER_AVATARS: readonly TeacherAvatarOption[] = [
  {
    id: "female-01",
    label: "Mentor A",
    src: "/brand/Female-Teacher-Avatar-01.png",
  },
  {
    id: "female-02",
    label: "Mentor B",
    src: "/brand/Female-Teacher-Avatar-02.png",
  },
  {
    id: "male-01",
    label: "Mentor C",
    src: "/brand/Male-Teacher-Avatar-01.png",
  },
  {
    id: "male-02",
    label: "Mentor D",
    src: "/brand/Male-Teacher-Avatar-02.png",
  },
] as const;

const AVATAR_IDS = new Set<string>(TEACHER_AVATARS.map((item) => item.id));

export function isTeacherAvatarId(value: string | null | undefined): value is TeacherAvatarId {
  return Boolean(value && AVATAR_IDS.has(value));
}

export function resolveTeacherAvatarId(
  value: string | null | undefined
): TeacherAvatarId {
  return isTeacherAvatarId(value) ? value : DEFAULT_TEACHER_AVATAR_ID;
}

export function getTeacherAvatarOption(id: string | null | undefined): TeacherAvatarOption {
  const resolved = resolveTeacherAvatarId(id);
  return TEACHER_AVATARS.find((item) => item.id === resolved) ?? TEACHER_AVATARS[0];
}

export function getTeacherAvatarSrc(id: string | null | undefined): string {
  return getTeacherAvatarOption(id).src;
}

export function teacherAvatarIndex(id: string | null | undefined): number {
  const resolved = resolveTeacherAvatarId(id);
  const index = TEACHER_AVATARS.findIndex((item) => item.id === resolved);
  return index >= 0 ? index : 0;
}
