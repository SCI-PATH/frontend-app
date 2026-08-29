export default function GameShellHeader({
  mode = 'lobby',
  student,
  farm = {},
  gameReady = false,
  onOpenDashboard,
  onBackToFarm,
  onLogout,
}) {
  const isDashboard = mode === 'dashboard';
  const isPlaying = mode === 'playing';
  return (
    <header className="game-shell-header">
      <div className="game-shell-header-brand">
        <h1>{isDashboard ? 'Your learning dashboard' : 'Discovery Grove'}</h1>
        <p className="game-shell-header-sub">
          {isPlaying
            ? gameReady
              ? 'Live run'
              : 'Loading farm…'
            : 'Farm & unlock adventure'}
        </p>
      </div>
      <div className="game-shell-header-actions">
        <span>{student?.displayName || 'Player'}</span>
        {isDashboard ? (
          <button type="button" onClick={onBackToFarm}>
            Back to farm
          </button>
        ) : (
          <button type="button" onClick={onOpenDashboard}>
            Dashboard
          </button>
        )}
        {onLogout ? (
          <button type="button" onClick={onLogout}>
            Log out
          </button>
        ) : null}
        {isPlaying ? <strong>${farm.earnings ?? 0}</strong> : null}
      </div>
    </header>
  );
}
