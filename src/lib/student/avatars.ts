export const DEFAULT_STUDENT_AVATAR_ID = "female-01";

export type StudentAvatarId =
  | "female-01"
  | "female-02"
  | "female-03"
  | "male-01"
  | "male-02"
  | "male-03";

export interface StudentAvatarOption {
  id: StudentAvatarId;
  label: string;
  src: string;
}

export const STUDENT_AVATARS: readonly StudentAvatarOption[] = [
  {
    id: "female-01",
    label: "Explorer A",
    src: "/brand/Female-Student-Avatar-01.png",
  },
  {
    id: "female-02",
    label: "Explorer B",
    src: "/brand/Female-Student-Avatar-02.png",
  },
  {
    id: "female-03",
    label: "Explorer C",
    src: "/brand/Female-Student-Avatar-03.png",
  },
  {
    id: "male-01",
    label: "Explorer D",
    src: "/brand/Male-Student-Avatar-01.png",
  },
  {
    id: "male-02",
    label: "Explorer E",
    src: "/brand/Male-Student-Avatar-02.png",
  },
  {
    id: "male-03",
    label: "Explorer F",
    src: "/brand/Male-Student-Avatar-03.png",
  },
] as const;

const AVATAR_IDS = new Set<string>(STUDENT_AVATARS.map((item) => item.id));

export function isStudentAvatarId(value: string | null | undefined): value is StudentAvatarId {
  return Boolean(value && AVATAR_IDS.has(value));
}

export function resolveStudentAvatarId(
  value: string | null | undefined
): StudentAvatarId {
  return isStudentAvatarId(value) ? value : DEFAULT_STUDENT_AVATAR_ID;
}

export function getStudentAvatarOption(id: string | null | undefined): StudentAvatarOption {
  const resolved = resolveStudentAvatarId(id);
  return STUDENT_AVATARS.find((item) => item.id === resolved) ?? STUDENT_AVATARS[0];
}

export function getStudentAvatarSrc(id: string | null | undefined): string {
  return getStudentAvatarOption(id).src;
}

export function studentAvatarIndex(id: string | null | undefined): number {
  const resolved = resolveStudentAvatarId(id);
  const index = STUDENT_AVATARS.findIndex((item) => item.id === resolved);
  return index >= 0 ? index : 0;
}
