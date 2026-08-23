import { Gamepad2 } from "lucide-react";

/**
 * Shown after a student finishes a lesson (Done).
 * Teammate wires `onOk` to navigate into the gaming service.
 */
export default function TestKnowledgeModal({ open, onOk, lessonTitle = "" }) {
  if (!open) return null;

  const chapterLabel = (lessonTitle || "this chapter").trim();

  return (
    <div
      className="user-error-modal test-knowledge-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-knowledge-title"
    >
      <div className="user-error-modal__backdrop" aria-hidden />
      <div className="user-error-modal__panel test-knowledge-modal__panel">
        <div className="test-knowledge-modal__icon" aria-hidden>
          <Gamepad2 className="size-8" strokeWidth={2.25} />
        </div>
        <h2 id="test-knowledge-title" className="user-error-modal__title">
          Test your knowledge!
        </h2>
        <p className="user-error-modal__body">
          Nice work on <strong>{chapterLabel}</strong>. Tap OK when you&apos;re ready for a quick
          game to practice what you learned.
        </p>
        <button type="button" className="user-error-modal__ok" onClick={() => onOk?.()}>
          OK
        </button>
      </div>
    </div>
  );
}
