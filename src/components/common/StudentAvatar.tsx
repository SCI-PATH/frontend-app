"use client";

import { RoleAvatar } from "@/components/common/RoleAvatar";
import {
  DEFAULT_STUDENT_AVATAR_ID,
  getStudentAvatarSrc,
} from "@/lib/student/avatars";
import { useUserStore } from "@/store/useUserStore";

type RoleAvatarSize = "sm" | "md" | "lg" | "xl" | "hero";

export function StudentAvatar({
  size = "md",
  className,
  showRing = false,
}: {
  size?: RoleAvatarSize;
  className?: string;
  showRing?: boolean;
}) {
  const userId = useUserStore((state) => state.userId);
  const avatarByUserId = useUserStore((state) => state.studentAvatarByUserId);
  const avatarId =
    (userId && avatarByUserId[userId]) || DEFAULT_STUDENT_AVATAR_ID;

  return (
    <RoleAvatar
      role="student"
      size={size}
      className={className}
      showRing={showRing}
      src={getStudentAvatarSrc(avatarId)}
      alt="Student avatar"
    />
  );
}
