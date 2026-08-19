"use client";

import { useEffect, useRef } from "react";

import { ChatHeader } from "@/components/features/learner-analytics/ChatHeader";
import { ChatInputBar } from "@/components/features/learner-analytics/ChatInputBar";
import { LessonSwitchNotice } from "@/components/features/learner-analytics/LessonSwitchNotice";
import { MessageBubble } from "@/components/features/learner-analytics/MessageBubble";
import { SuggestionChips } from "@/components/features/learner-analytics/SuggestionChips";
import { TypingIndicator } from "@/components/features/learner-analytics/TypingIndicator";
import { cn } from "@/lib/utils";
import { useTutorStore } from "@/store/useTutorStore";

export function SocraticChatView({
  variant = "full",
  onClose,
}: {
  variant?: "full" | "compact";
  onClose?: () => void;
}) {
  const compact = variant === "compact";
  const messages = useTutorStore((state) => state.messages);
  const personaId = useTutorStore((state) => state.personaId);
  const activeTopicId = useTutorStore((state) => state.activeTopicId);
  const topicLocked = useTutorStore((state) => state.topicLocked);
  const metadata = useTutorStore((state) => state.metadata);
  const lessonNotice = useTutorStore((state) => state.lessonNotice);
  const isSending = useTutorStore((state) => state.isSending);
  const error = useTutorStore((state) => state.error);
  const setPersonaId = useTutorStore((state) => state.setPersonaId);
  const setTopicLocked = useTutorStore((state) => state.setTopicLocked);
  const dismissLessonNotice = useTutorStore((state) => state.dismissLessonNotice);
  const sendMessage = useTutorStore((state) => state.sendMessage);
  const requestHint = useTutorStore((state) => state.requestHint);
  const resetConversation = useTutorStore((state) => state.resetConversation);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending, lessonNotice]);

  useEffect(() => {
    if (!lessonNotice) return;
    const timer = window.setTimeout(() => dismissLessonNotice(), 8000);
    return () => window.clearTimeout(timer);
  }, [lessonNotice, dismissLessonNotice]);

  return (
    <section
      className={cn(
        "flex w-full flex-col overflow-hidden bg-white",
        compact
          ? "h-full"
          : "h-[min(52rem,calc(100dvh-4rem))] rounded-2xl border border-brand-surface shadow-[0_18px_50px_-32px_rgba(114,9,183,0.35)]"
      )}
      aria-label="Socratic tutor chat"
    >
      <ChatHeader
        personaId={personaId}
        activeTopicId={activeTopicId}
        topicLocked={topicLocked}
        metadata={metadata}
        canStartNew={!isSending && messages.length > 1}
        compact={compact}
        expandHref={compact ? "/tutor" : undefined}
        onClose={onClose}
        onPersonaChange={setPersonaId}
        onTopicLockedChange={setTopicLocked}
        onNewConversation={resetConversation}
      />

      {lessonNotice ? (
        <LessonSwitchNotice
          message={lessonNotice}
          onDismiss={dismissLessonNotice}
        />
      ) : null}

      <div
        className="flex-1 space-y-3 overflow-y-auto bg-white px-4 py-4 sm:px-5"
        role="log"
        aria-live="polite"
        aria-busy={isSending}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isSending ? <TypingIndicator /> : null}
        <div ref={bottomRef} />
      </div>

      <footer
        className={cn(
          "space-y-3 border-t border-brand-surface bg-white px-4 py-3 sm:px-5",
          compact && "space-y-2 px-3 py-2.5 sm:px-3"
        )}
      >
        {error ? (
          <p
            className="rounded-lg border border-brand-accent/30 bg-brand-accent/10 px-3 py-2 text-sm text-brand-accent"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <SuggestionChips
          disabled={isSending}
          onHint={() => {
            void requestHint("💡 Give me a hint");
          }}
          onStuck={() => {
            void sendMessage("🤔 I'm stuck on this step");
          }}
        />

        <ChatInputBar disabled={isSending} onSend={(message) => void sendMessage(message)} />
      </footer>
    </section>
  );
}
