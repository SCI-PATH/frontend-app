import gamingBack from '../resources/gamingBack.jpg'
import './gamebackground.css'

export default function GameBackground({ children }) {
  return (
    <div className="game-background">
      <div
        className="game-background__media"
        style={{ backgroundImage: `url(${gamingBack})` }}
        aria-hidden
      />
      <div className="game-background__content">{children}</div>
    </div>
  )
}
