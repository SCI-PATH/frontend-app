"use client";

import Link from "next/link";
import { ChevronDown, Maximize2, MessageSquarePlus, X, Zap } from "lucide-react";

import { LessonLockToggle } from "@/components/features/learner-analytics/LessonLockToggle";
import { SocratesAvatar } from "@/components/features/learner-analytics/SocratesAvatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  formatTopicLabel,
  getPersonaById,
  TUTOR_PERSONAS,
  type TutorPersonaId,
  type TutorTurnMetadata,
} from "@/types";

interface ChatHeaderProps {
  personaId: TutorPersonaId;
  activeTopicId: string | null;
  topicLocked: boolean;
  metadata: TutorTurnMetadata;
  canStartNew?: boolean;
  compact?: boolean;
  expandHref?: string;
  onClose?: () => void;
  onPersonaChange: (personaId: TutorPersonaId) => void;
  onTopicLockedChange: (locked: boolean) => void;
  onNewConversation: () => void;
}

export function ChatHeader({
  personaId,
  activeTopicId,
  topicLocked,
  metadata,
  canStartNew = true,
  compact = false,
  expandHref,
  onClose,
  onPersonaChange,
  onTopicLockedChange,
  onNewConversation,
}: ChatHeaderProps) {
  const persona = getPersonaById(personaId);
  const hasLesson = Boolean(activeTopicId);
  const lessonLabel = formatTopicLabel(activeTopicId);
  const mastery =
    metadata.masteryProbability !== null
      ? Math.round(metadata.masteryProbability * 100)
      : null;

  return (
    <header className="border-b border-brand-surface bg-white">
      <div
        className={cn(
          "flex flex-col gap-3 px-4 py-3 sm:px-5",
          compact
            ? "gap-2"
            : "sm:flex-row sm:items-center sm:justify-between"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <SocratesAvatar showStatus />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-brand-text">
              Socrates
              <span className="ml-1.5 font-normal text-brand-text/60">
                Your AI Science Companion 🧬
              </span>
            </p>
            <p className="flex items-center gap-1.5 text-xs text-brand-text/60">
              <span className="size-1.5 rounded-full bg-brand-secondary" aria-hidden />
              Online • Socratic Mode
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full bg-brand-special/10 px-2.5 text-xs font-medium text-brand-special outline-none",
                "transition-colors hover:bg-brand-special/15 focus-visible:ring-2 focus-visible:ring-brand-special/30"
              )}
            >
              {persona.label}
              <ChevronDown className="size-3.5 opacity-70" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56">
              <DropdownMenuLabel className="text-xs text-brand-text/60">
                Active persona
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={personaId}
                onValueChange={(value) =>
                  onPersonaChange(value as TutorPersonaId)
                }
              >
                {TUTOR_PERSONAS.map((item) => (
                  <DropdownMenuRadioItem
                    key={item.id}
                    value={item.id}
                    className="flex-col items-start gap-0.5 py-2"
                  >
                    <span className="text-sm text-brand-text">{item.label}</span>
                    <span className="text-xs font-normal text-brand-text/55">
                      {item.description}
                    </span>
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={!canStartNew}
            onClick={onNewConversation}
            aria-label="Start a new conversation"
            title="New conversation"
            className="size-7 border-brand-surface bg-white text-brand-text hover:border-brand-special/30 hover:bg-brand-special/10 hover:text-brand-special"
          >
            <MessageSquarePlus className="size-3.5" aria-hidden />
          </Button>

          {expandHref ? (
            <Button
              asChild
              variant="outline"
              size="icon-sm"
              title="Open full tutor"
              className="size-7 border-brand-surface bg-white text-brand-text hover:border-brand-special/30 hover:bg-brand-special/10 hover:text-brand-special"
            >
              <Link href={expandHref} aria-label="Expand Socrates to full screen">
                <Maximize2 className="size-3.5" aria-hidden />
              </Link>
            </Button>
          ) : null}

          {onClose ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close chat"
              title="Close chat"
              className="size-7 border-brand-surface bg-white text-brand-text hover:border-brand-special/30 hover:bg-brand-special/10 hover:text-brand-special"
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          "flex flex-wrap items-center gap-2 border-t border-brand-surface/80 bg-brand-background/40 px-4 py-2 sm:px-5",
          compact && "hidden"
        )}
      >
        <Badge
          title={activeTopicId ?? undefined}
          className={cn(
            "h-7 max-w-full gap-1 rounded-full px-2.5 text-xs font-medium",
            hasLesson
              ? topicLocked
                ? "bg-brand-special/10 text-brand-special"
                : "bg-brand-secondary/10 text-brand-text"
              : "border-brand-surface bg-white text-brand-text/70"
          )}
        >
          <Zap className="size-3 text-brand-accent" aria-hidden />
          <span className="truncate">{lessonLabel}</span>
          {topicLocked ? (
            <span className="rounded-full bg-brand-special/15 px-1.5 text-[10px] uppercase tracking-wide">
              Locked
            </span>
          ) : hasLesson ? (
            <span className="rounded-full bg-white/70 px-1.5 text-[10px] uppercase tracking-wide text-brand-text/55">
              Auto
            </span>
          ) : null}
        </Badge>

        <LessonLockToggle
          locked={topicLocked}
          disabled={!hasLesson}
          onLockedChange={onTopicLockedChange}
        />

        {hasLesson && mastery !== null ? (
          <span className="text-xs text-brand-text/55">
            Mastery {mastery}%
            {metadata.hintMode ? ` · ${metadata.hintMode}` : ""}
          </span>
        ) : null}
      </div>
    </header>
  );
}
