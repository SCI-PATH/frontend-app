"use client";

import { RoleAvatar } from "@/components/common/RoleAvatar";
import {
  DEFAULT_TEACHER_AVATAR_ID,
  getTeacherAvatarSrc,
} from "@/lib/educator/avatars";
import { useUserStore } from "@/store/useUserStore";

type RoleAvatarSize = "sm" | "md" | "lg" | "xl" | "hero";

export function TeacherAvatar({
  size = "md",
  className,
  showRing = false,
}: {
  size?: RoleAvatarSize;
  className?: string;
  showRing?: boolean;
}) {
  const userId = useUserStore((state) => state.userId);
  const avatarByUserId = useUserStore((state) => state.teacherAvatarByUserId) ?? {};
  const avatarId =
    (userId && avatarByUserId[userId]) || DEFAULT_TEACHER_AVATAR_ID;

  return (
    <RoleAvatar
      role="educator"
      size={size}
      className={className}
      showRing={showRing}
      src={getTeacherAvatarSrc(avatarId)}
      alt="Teacher avatar"
    />
  );
}
