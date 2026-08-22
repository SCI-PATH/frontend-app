"use client";

import Link from "next/link";
import { Rocket, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";

export function GameArenaCard() {
  return (
    <article className="flex min-h-[20rem] flex-col gap-5 rounded-2xl border border-brand-special/20 bg-white p-7 transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-sm font-bold uppercase tracking-wider text-brand-special">
        Gamified Arena
      </p>
      <h2 className="text-lg font-semibold text-brand-text">Play a Trial Game</h2>
      <p className="text-base leading-snug text-brand-text/65">
        Dynamic difficulty with XP and quests.
      </p>
      <p className="flex items-center gap-2 rounded-xl bg-brand-special/10 px-3 py-2 text-sm font-medium text-brand-special">
        <Trophy className="size-4 shrink-0" aria-hidden />
        Circuit Master 3D
        <span className="ml-auto text-sm font-semibold">+150 XP</span>
      </p>
      <Button
        asChild
        className="mt-auto w-full bg-brand-special text-base text-white hover:bg-brand-special/90"
      >
        <Link href="/dashboard">
          Launch Game Arena
          <Rocket className="size-4" aria-hidden />
        </Link>
      </Button>
    </article>
  );
}
