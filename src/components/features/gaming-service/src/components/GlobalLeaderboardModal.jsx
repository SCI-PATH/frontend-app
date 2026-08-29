export default function GlobalLeaderboardModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="leaderboard-modal" role="dialog">
      <p>Leaderboard</p>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </div>
  );
}
