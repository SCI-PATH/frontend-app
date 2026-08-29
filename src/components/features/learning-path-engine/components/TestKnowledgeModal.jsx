import { Gamepad2 } from "lucide-react";

/**
 * Shown after a student finishes a lesson (Done).
 * OK opens the gaming farm start screen.
 */
export default function TestKnowledgeModal({
  open,
  onOk,
  lessonTitle = "",
  levelId = 1,
  rewardLabel = "",
}) {
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
          Nice work on <strong>{chapterLabel}</strong>. Game level {levelId} is ready.
          Finish the farm, then you&apos;ll return here so the next chapter can unlock.
          {rewardLabel ? (
            <>
              {" "}
              Completing this lesson unlocked <strong>{rewardLabel}</strong> on the farm.
            </>
          ) : null}
        </p>
        <button type="button" className="user-error-modal__ok" onClick={() => onOk?.()}>
          Play Game Level {levelId}
        </button>
      </div>
    </div>
  );
}
