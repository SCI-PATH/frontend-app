"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_STUDENT_AVATAR_ID,
  STUDENT_AVATARS,
  getStudentAvatarOption,
  studentAvatarIndex,
  type StudentAvatarId,
} from "@/lib/student/avatars";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

export function StudentAvatarPicker() {
  const userId = useUserStore((state) => state.userId);
  const avatarByUserId = useUserStore((state) => state.studentAvatarByUserId);
  const setStudentAvatar = useUserStore((state) => state.setStudentAvatar);
  const avatarId =
    (userId && avatarByUserId[userId]) || DEFAULT_STUDENT_AVATAR_ID;
  const current = getStudentAvatarOption(avatarId);
  const index = studentAvatarIndex(avatarId);
  const pointerStartX = useRef<number | null>(null);

  function select(id: StudentAvatarId) {
    if (!userId) return;
    setStudentAvatar(userId, id);
  }

  function step(delta: number) {
    const nextIndex =
      (index + delta + STUDENT_AVATARS.length) % STUDENT_AVATARS.length;
    select(STUDENT_AVATARS[nextIndex].id);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label="Previous avatar"
          onClick={() => step(-1)}
          className="shrink-0 rounded-full border-white/50 bg-white/90 text-brand-special hover:bg-white"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </Button>

        <div
          className="relative size-36 cursor-grab touch-pan-y select-none overflow-hidden rounded-full bg-white p-1 shadow-lg shadow-brand-special/20 ring-4 ring-white/50 sm:size-40"
          onPointerDown={(event) => {
            pointerStartX.current = event.clientX;
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerUp={(event) => {
            if (pointerStartX.current == null) return;
            const dx = event.clientX - pointerStartX.current;
            pointerStartX.current = null;
            if (dx > 40) step(-1);
            if (dx < -40) step(1);
          }}
          onPointerCancel={() => {
            pointerStartX.current = null;
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              step(-1);
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              step(1);
            }
          }}
          role="group"
          aria-label="Choose your explorer avatar"
          tabIndex={0}
        >
          <Image
            src={current.src}
            alt={current.label}
            fill
            sizes="160px"
            className="object-contain"
            draggable={false}
            priority
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label="Next avatar"
          onClick={() => step(1)}
          className="shrink-0 rounded-full border-white/50 bg-white/90 text-brand-special hover:bg-white"
        >
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>

      <p className="text-sm font-medium text-white/90">
        Swipe or tap to pick your look · {current.label}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {STUDENT_AVATARS.map((option) => {
          const selected = option.id === current.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => select(option.id)}
              aria-label={option.label}
              aria-pressed={selected}
              className={cn(
                "relative size-11 overflow-hidden rounded-full bg-white ring-2 transition",
                selected
                  ? "ring-brand-secondary ring-offset-2 ring-offset-transparent"
                  : "ring-white/40 hover:ring-white"
              )}
            >
              <Image
                src={option.src}
                alt=""
                fill
                sizes="44px"
                className="object-contain"
                draggable={false}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
