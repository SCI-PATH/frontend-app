import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Flame,
  Image as ImageIcon,
  Pause,
  Play,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import LessonCheatSheet from "./LessonCheatSheet.jsx";
import LessonVisualExplore from "./LessonVisualExplore.jsx";
import LessonStepContent from "./LessonStepContent.jsx";
import TutorMascot from "./TutorMascot.jsx";
import { splitLessonIntoSteps, hintForPresentation, presentationModeForProfile } from "../utils/splitLessonSteps.js";

/**
 * Two tabs:
 * - Lesson: content + knight + side panel placeholder
 * - Explore: video library, additional material, gallery, map
 *
 * Read aloud is optional: students turn it on if they want narration.
 */
export default function LessonStage({
  lessonText,
  lessonId,
  lessonTitle,
  event,
  isFinalLesson = false,
  profile = "basic",
  presentationMode: presentationModeProp,
  initialStep = 0,
  loadingNextLesson = false,
  onStepChange,
  onClose,
  onLessonDone,
}) {
  const presentationMode =
    presentationModeProp || presentationModeForProfile(profile);
  const steps = useMemo(
    () => splitLessonIntoSteps(lessonText, profile),
    [lessonText, profile],
  );
  const paceHint = hintForPresentation(presentationMode);
  const [stepIndex, setStepIndex] = useState(() => Math.max(0, Number(initialStep) || 0));
  const [viewMode, setViewMode] = useState("lesson"); // lesson | explore
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechState, setSpeechState] = useState("idle"); // idle | speaking | paused
  const [showConfetti, setShowConfetti] = useState(false);
  const [mediaCollapsed, setMediaCollapsed] = useState(false);
  const utteranceRef = useRef(null);
  const isWrapUp = event === "wrap_up_success";

  useLayoutEffect(() => {
    const s = Math.max(0, Number(initialStep) || 0);
    setStepIndex(s);
  }, [lessonText, lessonId, initialStep]);

  useEffect(() => {
    setViewMode("lesson");
    setMediaCollapsed(false);
  }, [lessonId, lessonText]);

  useEffect(() => {
    if (isWrapUp) return;
    const s = Math.max(0, Number(initialStep) || 0);
    if (process.env.NODE_ENV === "development") {
      console.debug("[LessonStage] hydrate progress", { lessonId, step: s });
    }
    onStepChange?.(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: lesson identity only + wrap-up gate
  }, [lessonText, lessonId, isWrapUp]);

  const isLast = steps.length === 0 || stepIndex >= steps.length - 1;
  const current = stripTopicPrefix(steps[stepIndex] ?? "", lessonTitle);
  const progress = steps.length ? (stepIndex + 1) / steps.length : 1;
  const xpEarned = Math.min(stepIndex + 1, steps.length) * 10;
  const milestoneCount = Math.min(4, Math.max(steps.length, 1));
  const activeMilestone = Math.min(
    milestoneCount - 1,
    Math.floor(progress * milestoneCount - Number.EPSILON),
  );
  const stepWordCount = current.trim()
    ? current.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const wrapUpText = isFinalLesson
    ? "Congratulations! You have successfully completed SCI-PATH for Grade 6 science. Great work, and good luck in your next grade!"
    : `Congratulations! You completed ${lessonTitle}. You are ready for the next chapter.`;
  const textToRead = isWrapUp ? wrapUpText : current;

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (utteranceRef.current) {
        utteranceRef.current.onend = null;
        utteranceRef.current.onerror = null;
      }
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setSpeechState("idle");
  }, []);

  const speakText = useCallback((rawText) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !("SpeechSynthesisUtterance" in window)
    ) {
      return;
    }
    const cleaned = cleanTextForSpeech(rawText);
    if (!cleaned) return;

    if (utteranceRef.current) {
      utteranceRef.current.onend = null;
      utteranceRef.current.onerror = null;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.onend = () => {
      utteranceRef.current = null;
      setSpeechState("idle");
    };
    utterance.onerror = () => {
      utteranceRef.current = null;
      setSpeechState("idle");
    };
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeechState("speaking");
  }, []);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window;
    setSpeechSupported(ok);
    return stopSpeech;
  }, [stopSpeech]);

  useEffect(() => {
    stopSpeech();
  }, [lessonId, viewMode, stopSpeech]);

  function togglePauseResume() {
    if (!speechSupported) return;
    if (speechState === "speaking") {
      window.speechSynthesis.pause();
      setSpeechState("paused");
      return;
    }
    if (speechState === "paused") {
      window.speechSynthesis.resume();
      setSpeechState("speaking");
      return;
    }
    speakText(textToRead);
  }

  function onPrimary() {
    stopSpeech();
    if (isWrapUp) {
      onLessonDone?.();
      return;
    }
    if (!isLast) {
      const next = Math.min(stepIndex + 1, Math.max(steps.length - 1, 0));
      setStepIndex(next);
      if (process.env.NODE_ENV === "development") {
        console.debug("[LessonStage] continue", { lessonId, from: stepIndex, to: next });
      }
      onStepChange?.(next);
      return;
    }
    setShowConfetti(true);
    window.setTimeout(() => onLessonDone?.(), 900);
  }

  function onBack() {
    stopSpeech();
    const prev = Math.max(stepIndex - 1, 0);
    setStepIndex(prev);
    if (process.env.NODE_ENV === "development") {
      console.debug("[LessonStage] back", { lessonId, from: stepIndex, to: prev });
    }
    onStepChange?.(prev);
  }

  const showExplore = viewMode === "explore" && !isWrapUp;
  const modeLabel = showExplore ? "Explore" : "Lesson";
  const pillLabel = isWrapUp
    ? "Done"
    : showExplore
      ? "Map"
      : `${stepIndex + 1} / ${Math.max(steps.length, 1)}`;

  return (
    <div
      className={`lesson-stage lesson-stage--split lesson-stage--fit lesson-stage--${presentationMode}${
        showExplore ? " lesson-stage--explore" : ""
      }`}
    >
      {showConfetti ? <ConfettiBurst /> : null}
      {loadingNextLesson ? (
        <div className="lesson-stage__loading-overlay" role="status" aria-live="polite">
          <p className="lesson-stage__loading-text">Loading next lesson…</p>
        </div>
      ) : null}

      <header className="lesson-stage__bar">
        <button
          type="button"
          className="lesson-stage__iconbtn"
          onClick={() => {
            stopSpeech();
            onClose?.();
          }}
          aria-label="Exit lesson"
          disabled={loadingNextLesson}
        >
          <X size={18} strokeWidth={2.25} aria-hidden />
        </button>
        <div className="lesson-stage__titlewrap">
          <p className="lesson-stage__label">{modeLabel}</p>
          <h2 className="lesson-stage__title">
            {isWrapUp && isFinalLesson ? "SCI-PATH Complete" : lessonTitle || lessonId || "SCI-PATH"}
          </h2>
        </div>
        {!isWrapUp ? (
          <div className="lesson-stage__rewards" aria-label={`${xpEarned} lesson XP earned`}>
            <span className="lesson-stage__reward lesson-stage__reward--xp">
              <Sparkles size={14} aria-hidden />
              {xpEarned} XP
            </span>
            <span className="lesson-stage__reward lesson-stage__reward--streak" title="Keep learning">
              <Flame size={14} aria-hidden />
              Keep it up!
            </span>
          </div>
        ) : null}
        <span className="lesson-stage__pill">{pillLabel}</span>
      </header>

      {!isWrapUp ? (
        <div className="lesson-stage__mode" role="tablist" aria-label="Lesson mode">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "lesson"}
            className={
              viewMode === "lesson"
                ? "lesson-stage__mode-btn is-active"
                : "lesson-stage__mode-btn"
            }
            onClick={() => setViewMode("lesson")}
            disabled={loadingNextLesson}
          >
            <BookOpen size={16} strokeWidth={2.25} aria-hidden />
            Lesson
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "explore"}
            className={
              viewMode === "explore"
                ? "lesson-stage__mode-btn is-active"
                : "lesson-stage__mode-btn"
            }
            onClick={() => {
              stopSpeech();
              setViewMode("explore");
            }}
            disabled={loadingNextLesson}
          >
            <ImageIcon size={16} strokeWidth={2.25} aria-hidden />
            Explore
          </button>
        </div>
      ) : null}

      {showExplore ? (
        <div className="lesson-stage__explore">
          <LessonVisualExplore lessonId={lessonId} lessonTitle={lessonTitle} />
        </div>
      ) : (
        <div
          className={`lesson-stage__split${
            mediaCollapsed ? " lesson-stage__split--media-collapsed" : ""
          }`}
        >
          <div className="lesson-stage__col lesson-stage__col--text">
            <div className="lesson-stage__dialog lesson-stage__dialog--split">
              <div className="lesson-stage__mascot-wrap">
                <TutorMascot celebrate={isWrapUp} />
                <span className="lesson-stage__mascot-name">Arthur</span>
              </div>
              <div className="speech-bubble" role="region" aria-live="polite">
                <div className="speech-bubble__heading">
                  <p className="speech-bubble__eyebrow">Arthur says</p>
                  {speechSupported ? (
                    <div className="speech-bubble__audio" aria-label="Narration controls">
                      <button
                        type="button"
                        className={`speech-bubble__audio-btn speech-bubble__audio-primary${
                          speechState === "speaking" ? " is-active" : ""
                        }`}
                        onClick={togglePauseResume}
                        disabled={!textToRead?.trim() || loadingNextLesson}
                        aria-label={
                          speechState === "speaking"
                            ? "Pause narration"
                            : speechState === "paused"
                              ? "Resume narration"
                              : "Play narration"
                        }
                        title={speechState === "speaking" ? "Pause narration" : "Play narration"}
                      >
                        {speechState === "speaking" ? (
                          <Pause size={16} aria-hidden />
                        ) : (
                          <Play size={16} fill="currentColor" aria-hidden />
                        )}
                        <span>{speechState === "speaking" ? "Pause" : "Listen"}</span>
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className={`speech-bubble__body lesson-step--${presentationMode}`}>
                  {isWrapUp ? (
                    <LessonStepContent text={wrapUpText} density={presentationMode} />
                  ) : (
                    <LessonStepContent text={current} density={presentationMode} />
                  )}
                </div>
                {stepWordCount > 0 && !isWrapUp ? (
                  <p className="speech-bubble__hint">
                    {speechState === "speaking" ? "Narration is playing — tap Pause anytime." : paceHint}
                  </p>
                ) : null}
              </div>
            </div>

            <footer className="lesson-stage__footer lesson-stage__footer--split">
              {!isWrapUp ? (
                <>
                  <div className="lesson-stage__milestones" aria-label="Lesson checkpoints">
                    {Array.from({ length: milestoneCount }, (_, i) => (
                      <div
                        key={i}
                        className={`lesson-stage__milestone ${
                          i < activeMilestone
                            ? "is-complete"
                            : i === activeMilestone
                              ? "is-current"
                              : ""
                        }`}
                      >
                        <span className="lesson-stage__milestone-icon">
                          <Star size={13} fill={i <= activeMilestone ? "currentColor" : "none"} aria-hidden />
                        </span>
                        <span>{i === milestoneCount - 1 ? "Goal" : `Quest ${i + 1}`}</span>
                      </div>
                    ))}
                  </div>
                  <div
                    className="lesson-stage__progress"
                    role="progressbar"
                    aria-valuenow={Math.round(progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="lesson-stage__progress-fill"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </>
              ) : null}
              <div className="lesson-stage__actions">
                {!isWrapUp ? (
                  <button
                    type="button"
                    className="lesson-stage__back"
                    onClick={onBack}
                    disabled={stepIndex <= 0 || loadingNextLesson}
                  >
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  className="lesson-stage__cta"
                  onClick={onPrimary}
                  disabled={loadingNextLesson || showConfetti}
                >
                  {isWrapUp
                    ? isFinalLesson
                      ? "Go to Home"
                      : "Next chapter"
                    : isLast
                      ? "Done"
                      : "Continue"}
                </button>
              </div>
            </footer>
          </div>

          {!isWrapUp ? (
            <LessonCheatSheet
              lessonId={lessonId}
              lessonTitle={lessonTitle}
              onCollapsedChange={setMediaCollapsed}
            />
          ) : (
            <aside className="lesson-static lesson-static--wrap">
              <p className="lesson-static__muted">Chapter complete.</p>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

function ConfettiBurst() {
  const colors = ["#8338ec", "#ffb703", "#fb5607", "#38b000", "#00a8e8", "#ff4d8d"];
  return (
    <div className="lesson-confetti" aria-hidden>
      {Array.from({ length: 34 }, (_, index) => (
        <span
          key={index}
          style={{
            "--confetti-x": `${(index * 37) % 100}%`,
            "--confetti-delay": `${(index % 7) * 35}ms`,
            "--confetti-color": colors[index % colors.length],
            "--confetti-rotate": `${(index * 47) % 360}deg`,
          }}
        />
      ))}
    </div>
  );
}

function stripTopicPrefix(text, lessonTitle) {
  const t = (text || "").trim();
  if (!t) return t;
  if (!lessonTitle) return t;
  const esc = lessonTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^${esc}\\s*[:\\-–—]?\\s*`, "i");
  return t.replace(re, "").trim();
}

function cleanTextForSpeech(text) {
  return String(text || "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[*_#`~]/g, "")
    .replace(/^[\-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}
