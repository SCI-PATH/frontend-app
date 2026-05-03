import gamingBack from '../resources/gamingBack.jpg'
import './gamebackground.css'

export default function GameBackground({ children, hideImage = false }) {
  return (
    <div className="game-background">
      {!hideImage ? (
        <div
          className="game-background__media"
          style={{ backgroundImage: `url(${gamingBack})` }}
          aria-hidden
        />
      ) : null}
      <div className="game-background__content">{children}</div>
    </div>
  )
}
