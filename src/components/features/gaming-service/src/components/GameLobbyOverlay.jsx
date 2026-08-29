export default function GameLobbyOverlay({
  mode = 'menu',
  student,
  farm,
  lobbyProgress,
  gameReady = false,
  onStart,
  onLeaderboard,
  onToggleMusic,
  onOpenProgress,
  musicEnabled = true,
}) {
  const isGuide = mode === 'guide';
  const progress = lobbyProgress || {};
  const levelId = progress.levelId ?? farm?.levelId ?? 1;
  const label =
    progress.phase === 'returning'
      ? `Level ${levelId}`
      : `Level ${levelId}`;

  return (
    <div className="game-lobby-overlay" role="dialog" aria-modal="true">
      <header className="game-lobby-topbar">
        <div className="game-lobby-player">
          <strong>{student?.displayName || 'Player'}</strong>
          <span>{label}</span>
        </div>
        <div className="game-lobby-actions">
          <button type="button" onClick={onToggleMusic}>
            {musicEnabled ? 'Mute' : 'Unmute'}
          </button>
          <button type="button" onClick={onLeaderboard}>
            Leaderboard
          </button>
          <button type="button" onClick={onOpenProgress}>
            Dashboard
          </button>
        </div>
      </header>
      <div className="game-lobby-body">
        <section className="game-lobby-hero">
          <p className="game-lobby-kicker">{isGuide ? 'Briefing' : 'SCI-PATH'}</p>
          <h2 className="game-lobby-title">
            {isGuide ? 'How to Play' : 'Discovery Grove'}
          </h2>
          <button
            type="button"
            className="game-lobby-play"
            onClick={onStart}
            disabled={!gameReady}
          >
            {isGuide ? 'Enter the Farm' : 'Start Adventure'}
          </button>
        </section>
      </div>
    </div>
  );
}
