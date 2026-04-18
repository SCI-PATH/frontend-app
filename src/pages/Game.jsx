import { useEffect, useRef } from 'react'
import GameBackground from '../components/gamebackground.jsx'
import idle1 from '../resources/Idle (1).png'
import idle2 from '../resources/Idle (2).png'
import idle3 from '../resources/Idle (3).png'
import idle4 from '../resources/Idle (4).png'
import idle5 from '../resources/Idle (5).png'
import idle6 from '../resources/Idle (6).png'
import idle7 from '../resources/Idle (7).png'
import idle8 from '../resources/Idle (8).png'
import idle9 from '../resources/Idle (9).png'
import idle10 from '../resources/Idle (10).png'
import '../App.css'

const IDLE_FRAMES = [
  idle1,
  idle2,
  idle3,
  idle4,
  idle5,
  idle6,
  idle7,
  idle8,
  idle9,
  idle10,
]

/** One full breath (inhale + brief top-of-breath + exhale), ms */
const BREATH_PERIOD_MS = 4400
/** Ms per idle frame */
const IDLE_FRAME_MS = 320
const INHALE_PORTION = 0.36
const HOLD_TOP_PORTION = 0.08

function smoothstep01(t) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

function restingLungFill(cyclePos) {
  const u = cyclePos % 1
  const inhaleEnd = INHALE_PORTION
  const holdEnd = inhaleEnd + HOLD_TOP_PORTION

  if (u < inhaleEnd) {
    return smoothstep01(u / inhaleEnd)
  }
  if (u < holdEnd) {
    return 1
  }
  const exhaleT = (u - holdEnd) / (1 - holdEnd)
  return 1 - smoothstep01(exhaleT)
}

function decodeOffscreen(url) {
  const loader = new Image()
  loader.src = url
  if (loader.decode) {
    return loader.decode().catch(() =>
      new Promise((resolve, reject) => {
        loader.onload = () => resolve()
        loader.onerror = () => reject(new Error('decode'))
      }),
    )
  }
  return new Promise((resolve, reject) => {
    loader.onload = () => resolve()
    loader.onerror = () => reject(new Error('load'))
  })
}

export default function Game() {
  const bodyRef = useRef(null)
  const imgRef = useRef(null)

  useEffect(() => {
    for (const url of IDLE_FRAMES) {
      const pre = new Image()
      pre.src = url
    }
  }, [])

  useEffect(() => {
    const body = bodyRef.current
    const img = imgRef.current
    if (!body || !img) return

    let raf = 0
    let cancelled = false
    const start = performance.now()
    let displayedFrame = 0
    let targetFrame = 0
    let catchingUp = false

    async function catchUpFrames() {
      while (!cancelled && displayedFrame !== targetFrame) {
        const fi = targetFrame
        const url = IDLE_FRAMES[fi]
        try {
          await decodeOffscreen(url)
        } catch {
          displayedFrame = fi
          continue
        }
        if (cancelled) return
        img.src = url
        displayedFrame = fi
      }
    }

    function tick(now) {
      if (cancelled) return
      const t = now - start
      const cycle = (t % BREATH_PERIOD_MS) / BREATH_PERIOD_MS
      const v = restingLungFill(cycle)

      const liftPx = -5.2 * v
      const scaleX = 1 + 0.009 * v
      const scaleY = 1 + 0.038 * v
      body.style.transform = `translate(0px, ${liftPx}px) scale(${scaleX}, ${scaleY})`

      targetFrame = Math.floor(t / IDLE_FRAME_MS) % IDLE_FRAMES.length

      if (!catchingUp && displayedFrame !== targetFrame) {
        catchingUp = true
        void catchUpFrames()
          .catch(() => {})
          .finally(() => {
            catchingUp = false
          })
      }

      raf = requestAnimationFrame(tick)
    }

    img.src = IDLE_FRAMES[0]
    displayedFrame = 0

    raf = requestAnimationFrame(tick)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <GameBackground>
      <div className="game-page">
        <figure className="game-page__sprite" aria-label="Character idle">
          <div ref={bodyRef} className="game-page__sprite-body">
            <img
              ref={imgRef}
              className="game-page__sprite-img"
              src={IDLE_FRAMES[0]}
              alt="Character idle"
              decoding="async"
            />
          </div>
        </figure>
      </div>
    </GameBackground>
  )
}
