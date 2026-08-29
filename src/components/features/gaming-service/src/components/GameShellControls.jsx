export function GameCanvasLoading() {
  return <div className="game-canvas-loading">Loading farm…</div>;
}

export function GameProgressButton({ onClick, progressPct = 0 }) {
  return (
    <button type="button" className="game-progress-button" onClick={onClick}>
      Progress {Math.round(Number(progressPct) || 0)}%
    </button>
  );
}
