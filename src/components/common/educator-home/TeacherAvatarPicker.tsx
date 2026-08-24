"use client";

import { useRef } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_TEACHER_AVATAR_ID,
  TEACHER_AVATARS,
  getTeacherAvatarOption,
  teacherAvatarIndex,
  type TeacherAvatarId,
} from "@/lib/educator/avatars";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/store/useUserStore";

export function TeacherAvatarPicker() {
  const userId = useUserStore((state) => state.userId);
  const avatarByUserId = useUserStore((state) => state.teacherAvatarByUserId) ?? {};
  const setTeacherAvatar = useUserStore((state) => state.setTeacherAvatar);
  const avatarId =
    (userId && avatarByUserId[userId]) || DEFAULT_TEACHER_AVATAR_ID;
  const current = getTeacherAvatarOption(avatarId);
  const index = teacherAvatarIndex(avatarId);
  const pointerStartX = useRef<number | null>(null);

  function select(id: TeacherAvatarId) {
    if (!userId) return;
    setTeacherAvatar(userId, id);
  }

  function step(delta: number) {
    const nextIndex =
      (index + delta + TEACHER_AVATARS.length) % TEACHER_AVATARS.length;
    select(TEACHER_AVATARS[nextIndex].id);
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
          className="relative size-40 cursor-grab touch-pan-y select-none overflow-hidden rounded-full bg-white shadow-lg shadow-brand-special/20 ring-2 ring-white/80 sm:size-44"
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
          aria-label="Choose your teacher avatar"
          tabIndex={0}
        >
          <Image
            src={current.src}
            alt={current.label}
            fill
            sizes="176px"
            className="object-cover object-top scale-[1.08]"
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
        {TEACHER_AVATARS.map((option) => {
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
                className="object-cover object-top scale-[1.08]"
                draggable={false}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
