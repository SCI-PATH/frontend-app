export default function GameOverOverlay({ open, payload, onContinue }) {
  if (!open) return null;
  return (
    <div className="game-over-overlay" role="dialog">
      <p>{payload?.message || 'Level complete'}</p>
      <button type="button" onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}
