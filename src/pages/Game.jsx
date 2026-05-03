import { useEffect, useRef, useState } from 'react'
import GameBackground from '../components/gamebackground.jsx'
import gamingBack from '../resources/gamingBack.jpg'
import gamingback2 from '../resources/gamingback2.png'
import crocodile0 from '../resources/crocodile.png'
import crocodile1 from '../resources/crocodile1.png'
import crocodile2 from '../resources/crocodile2.png'
import { playCrocGrowl, playHitThud } from '../audio/crocGrowl.js'
import '../App.css'

/**
 * Scroll “time” uses the same speed as the run (SCROLL_SPEED px/s).
 */
const RUN_FRAMES = Array.from({ length: 10 }, (_, i) =>
  new URL(`../resources/Run (${i + 1}).png`, import.meta.url).href,
)

const IDLE_FRAMES = Array.from({ length: 10 }, (_, i) =>
  new URL(`../resources/Idle (${i + 1}).png`, import.meta.url).href,
)

const ATTACK_FRAMES = Array.from({ length: 10 }, (_, i) =>
  new URL(`../resources/Attack (${i + 1}).png`, import.meta.url).href,
)

const RUN_FRAME_MS = 72
const RUN_BOB_PX = 4.5
const BOB_PERIOD_MS = 280
const IDLE_FRAME_MS = 110
const BREATH_BOB_PX = 2.5
const BREATH_PERIOD_MS = 2400
const SCROLL_SPEED = 165

/** Slower wind-up, faster strike — reads more like a real swing. */
const ATTACK_DURATIONS_MS = [78, 72, 68, 62, 46, 38, 36, 38, 44, 52]
const ATTACK_SWING_MS = ATTACK_DURATIONS_MS.reduce((a, b) => a + b, 0)

/** Start croc fight this long after reaching the lake (while the science card is up). */
const LAKE_FIGHT_START_MS = 900
/** Ticks after “Correct” to show feedback, then pure northward run on gamingback2. */
const TRAIL_FEEDBACK_DELAY_FRAMES = 12
/** How long the sprite runs straight north on the frozen bridge tile (ms), then jumps to trail. */
const NORTH_BRIDGE_RUN_MS = 2800
/** Max upward travel (north) clamped vs viewport height. */
const NORTH_BRIDGE_RISE_VH_RATIO = 0.46
const NORTH_BRIDGE_RISE_CAP_PX = 400
const FIGHT_PRE_ENGAGE_MS = 720
const FIGHT_CROC_HIT_MS = 580
const FIGHT_CROC_LUNGE_MS = 520
const FIGHT_CROC_KO_MS = 780

const FT0 = FIGHT_PRE_ENGAGE_MS
const FT1 = FT0 + ATTACK_SWING_MS
const FT2 = FT1 + FIGHT_CROC_HIT_MS
const FT3 = FT2 + FIGHT_CROC_LUNGE_MS
const FT4 = FT3 + ATTACK_SWING_MS
const FT_END = FT4 + FIGHT_CROC_KO_MS

const SWING_IMPACT_MS = ATTACK_DURATIONS_MS.slice(0, 6).reduce((a, b) => a + b, 0)
const IMPACT1_FT = FT0 + SWING_IMPACT_MS
const IMPACT2_FT = FT3 + SWING_IMPACT_MS

function attackFrameForSwingTime(swMs) {
  let s = 0
  for (let i = 0; i < ATTACK_DURATIONS_MS.length; i++) {
    s += ATTACK_DURATIONS_MS[i]
    if (swMs < s) return i
  }
  return 9
}

const LAKE_SCIENCE_CHOICES = [
  { id: 'A', label: 'Photosynthesis only in lily pads' },
  { id: 'B', label: 'Evaporation (and plant transpiration nearby)' },
  { id: 'C', label: 'Water freezing into clouds' },
  { id: 'D', label: 'Gravity pulling vapor downward' },
]

const SCIENCE_CORRECT_ID = 'B'

/** Sprite order: closed → open. Mouth opens periodically, then closes. */
const CROC_FRAMES = [crocodile2, crocodile0, crocodile1]
const CROC_MOUTH_STEP_MS = 580
const CROC_MOUTH_CLOSED_MS = 4800
const CROC_MOUTH_OPEN_HOLD_MS = 1400
const CROC_BOB_PERIOD_MS = 1100
const CROC_BOB_PX = 5

function crocMouthFrameIndex(elapsedLakeMs) {
  const cycle =
    CROC_MOUTH_CLOSED_MS +
    2 * CROC_MOUTH_STEP_MS +
    CROC_MOUTH_OPEN_HOLD_MS +
    2 * CROC_MOUTH_STEP_MS
  let p = elapsedLakeMs % cycle
  if (p < CROC_MOUTH_CLOSED_MS) return 0
  p -= CROC_MOUTH_CLOSED_MS
  if (p < CROC_MOUTH_STEP_MS) return 1
  if (p < 2 * CROC_MOUTH_STEP_MS) return 2
  p -= 2 * CROC_MOUTH_STEP_MS
  if (p < CROC_MOUTH_OPEN_HOLD_MS) return 2
  p -= CROC_MOUTH_OPEN_HOLD_MS
  if (p < CROC_MOUTH_STEP_MS) return 1
  return 0
}

function decodeOffscreen(url) {
  const loader = new Image()
  loader.src = url
  if (loader.decode) {
    return loader.decode().catch(
      () =>
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
  const [scienceChoice, setScienceChoice] = useState(null)
  const [scienceLives, setScienceLives] = useState(3)
  const [scienceSolved, setScienceSolved] = useState(false)
  const [scienceLocked, setScienceLocked] = useState(false)

  const scienceSolvedRef = useRef(false)
  const scienceLockedRef = useRef(false)
  const scienceLivesRef = useRef(3)
  /** Countdown ticks on the lake after a correct answer before the north run on gamingback2. */
  const trailSnapDelayRef = useRef(0)

  const bodyRef = useRef(null)
  const imgRef = useRef(null)
  const figureRef = useRef(null)
  const crocWrapRef = useRef(null)
  const crocImgRef = useRef(null)
  const parallaxRowRef = useRef(null)
  const scrollPxRef = useRef(0)
  const crocAudioCtxRef = useRef(null)
  const gamePageRef = useRef(null)

  useEffect(() => {
    for (const url of [
      ...RUN_FRAMES,
      ...IDLE_FRAMES,
      ...CROC_FRAMES,
      ...ATTACK_FRAMES,
    ]) {
      const pre = new Image()
      pre.src = url
    }
  }, [])

  function handleScienceCheck() {
    if (scienceSolvedRef.current || scienceLockedRef.current || !scienceChoice) {
      return
    }
    if (scienceChoice === SCIENCE_CORRECT_ID) {
      scienceSolvedRef.current = true
      setScienceSolved(true)
      trailSnapDelayRef.current = TRAIL_FEEDBACK_DELAY_FRAMES
      return
    }
    const next = scienceLivesRef.current - 1
    scienceLivesRef.current = next
    setScienceLives(next)
    if (next <= 0) {
      scienceLockedRef.current = true
      setScienceLocked(true)
    }
  }

  useEffect(() => {
    const body = bodyRef.current
    const img = imgRef.current
    const parallaxRow = parallaxRowRef.current
    if (!body || !img || !parallaxRow) return

    function getCrocAudioContext() {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return null
      if (!crocAudioCtxRef.current) {
        crocAudioCtxRef.current = new Ctx()
      }
      return crocAudioCtxRef.current
    }

    /** Match JS scroll distance to `.game-page__parallax-tile` width (100vw), not innerWidth. */
    function getTileWidth() {
      const el = parallaxRow.children[0]
      const w = el?.offsetWidth
      return w && w > 0 ? w : Math.max(320, window.innerWidth)
    }

    let raf = 0
    let cancelled = false
    const start = performance.now()
    let last = start
    let displayedFrame = 0
    let targetFrame = 0
    let catchingUp = false
    /** One round: gamingBack → gamingback2 (once), then hold on gamingback2. */
    let reachedGamingback2 = false
    let idleStart = 0
    let lakeAriaSet = false
    let lastCrocFrame = -1
    let inFight = false
    let fightStart = 0
    let prevFightT = 0
    let autoFightStarted = false
    let trailIdleStart = 0
    let trailIdleReady = false
    /** Timestamp when purely north climb on gamingback2 started; `0` means not started. */
    let northBridgeRunStart = 0
    let northBridgeComplete = false

    async function catchUpSpriteFrames(frameUrls, kind) {
      while (!cancelled && displayedFrame !== targetFrame) {
        const fi = targetFrame
        const url = frameUrls[fi]
        try {
          await decodeOffscreen(url)
        } catch {
          displayedFrame = fi
          continue
        }
        if (cancelled) return
        const sx = scrollPxRef.current
        const tw = getTileWidth()
        const lakeParkedScroll =
          reachedGamingback2 &&
          sx <= tw + 1 &&
          !scienceSolvedRef.current
        const spriteRunningNorthTowardTrail =
          scienceSolvedRef.current &&
          trailSnapDelayRef.current === 0 &&
          sx < 2 * tw - 8
        if (kind === 'run' && lakeParkedScroll && !inFight) return
        if (
          kind === 'idle' &&
          (!reachedGamingback2 || inFight || spriteRunningNorthTowardTrail)
        ) {
          return
        }
        img.src = url
        displayedFrame = fi
      }
    }

    function syncGamePageDom() {
      const root = gamePageRef.current
      const tw = getTileWidth()
      const sx = scrollPxRef.current
      const onTrailTile =
        scienceSolvedRef.current && sx >= 2 * tw - 2
      const runningNorthOnBridgeFrozen =
        scienceSolvedRef.current &&
        trailSnapDelayRef.current === 0 &&
        !northBridgeComplete &&
        sx < 2 * tw - 12
      /* Question stays up at the lake; hide on the trail tile (gamingBack) after a correct answer. */
      const lakeQuizDom =
        reachedGamingback2 &&
        !onTrailTile &&
        (!scienceSolvedRef.current || sx < tw + 96)
      if (root) {
        root.classList.toggle('game-page--lakeQuiz', lakeQuizDom)
        root.classList.toggle(
          'game-page--atLake',
          reachedGamingback2 && sx >= tw && sx < 2 * tw,
        )
        root.classList.toggle(
          'game-page--pastBridge',
          scienceSolvedRef.current && sx >= 2 * tw - 2,
        )
        root.classList.toggle('game-page--fighting', inFight)
        root.classList.toggle('game-page--scienceLocked', scienceLockedRef.current)
        root.classList.toggle(
          'game-page--northOnGamingback2',
          runningNorthOnBridgeFrozen,
        )
      }
      imgRef.current?.classList.toggle(
        'game-page__sprite-img--runningNorthFace',
        runningNorthOnBridgeFrozen,
      )
      figureRef.current?.classList.toggle(
        'game-page__sprite--centerNorthRun',
        runningNorthOnBridgeFrozen,
      )
    }

    function tick(now) {
      if (cancelled) return
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const trailSnapFramesBeforeTick = trailSnapDelayRef.current

      const t = now - start
      const vw = Math.max(320, window.innerWidth)
      const vh = window.innerHeight
      const tw = getTileWidth()

      if (!reachedGamingback2) {
        scrollPxRef.current += SCROLL_SPEED * dt
        if (scrollPxRef.current >= tw) {
          scrollPxRef.current = tw
          reachedGamingback2 = true
          idleStart = now
          trailIdleReady = false
          northBridgeRunStart = 0
          northBridgeComplete = false
          img.src = IDLE_FRAMES[0]
          displayedFrame = 0
          const fig = figureRef.current
          if (fig && !lakeAriaSet) {
            fig.setAttribute(
              'aria-label',
              'Character resting and watching the lake',
            )
            lakeAriaSet = true
          }
        }
      } else if (scienceSolvedRef.current) {
        if (trailSnapFramesBeforeTick > 0) {
          scrollPxRef.current = tw
        } else if (!northBridgeComplete) {
          if (northBridgeRunStart === 0) northBridgeRunStart = now
          const nbElapsed = now - northBridgeRunStart
          if (nbElapsed < NORTH_BRIDGE_RUN_MS) {
            scrollPxRef.current = tw
          } else {
            scrollPxRef.current = 2 * tw
            northBridgeComplete = true
          }
        } else {
          scrollPxRef.current = 2 * tw
        }
      } else {
        scrollPxRef.current = tw
      }

      const x = scrollPxRef.current
      parallaxRow.style.transform = `translate3d(${-x}px, 0, 0)`

      const crocWrap = crocWrapRef.current
      const crocImg = crocImgRef.current

      if (reachedGamingback2) {
        const idleT = now - idleStart
        const lakeParked = x <= tw + 1 && !scienceSolvedRef.current
        const elapsedNorthBridge =
          northBridgeRunStart > 0 ? now - northBridgeRunStart : 0
        const runningNorthBridge =
          scienceSolvedRef.current &&
          trailSnapFramesBeforeTick === 0 &&
          !northBridgeComplete &&
          northBridgeRunStart > 0 &&
          elapsedNorthBridge < NORTH_BRIDGE_RUN_MS
        const pastBridge =
          scienceSolvedRef.current && x >= 2 * tw - 1
        const waitingTrailSnap =
          scienceSolvedRef.current &&
          trailSnapFramesBeforeTick > 0 &&
          x <= tw + 1

        if (pastBridge && !trailIdleReady) {
          trailIdleReady = true
          trailIdleStart = now
        }

        if (inFight && scienceSolvedRef.current) {
          inFight = false
          prevFightT = -1
          if (crocWrap) {
            crocWrap.style.removeProperty('transform')
          }
          const figX = figureRef.current
          figX?.classList.remove(
            'game-page__sprite--fightForward',
            'game-page__sprite--leanBack',
          )
          lastCrocFrame = -1
          img.src = IDLE_FRAMES[0]
          displayedFrame = 0
        }

        if (
          lakeParked &&
          !inFight &&
          !scienceSolvedRef.current &&
          !autoFightStarted &&
          idleT >= LAKE_FIGHT_START_MS
        ) {
          autoFightStarted = true
          inFight = true
          fightStart = now
          prevFightT = -1
          displayedFrame = 0
          targetFrame = 0
          catchingUp = false
          img.src = IDLE_FRAMES[0]
          const figGo = figureRef.current
          if (figGo) {
            figGo.setAttribute('aria-label', 'Fighting the crocodile')
          }
        }

        if (inFight) {
          const ft = now - fightStart
          const fig = figureRef.current
          const lungeTarget = -Math.min(140, vw * 0.16)

          if (ft >= IMPACT1_FT && prevFightT < IMPACT1_FT) {
            playHitThud(getCrocAudioContext)
          }
          if (ft >= IMPACT2_FT && prevFightT < IMPACT2_FT) {
            playHitThud(getCrocAudioContext)
          }
          if (ft >= FT2 && prevFightT < FT2) {
            playCrocGrowl(getCrocAudioContext)
          }
          prevFightT = ft

          if (ft >= FT_END) {
            if (scienceSolvedRef.current) {
              inFight = false
              idleStart = now
              prevFightT = -1
              if (crocWrap) {
                crocWrap.style.removeProperty('transform')
              }
              fig?.classList.remove(
                'game-page__sprite--fightForward',
                'game-page__sprite--leanBack',
              )
              lastCrocFrame = -1
              img.src = IDLE_FRAMES[0]
              displayedFrame = 0
              if (fig) {
                fig.setAttribute(
                  'aria-label',
                  'Character resting and watching the lake',
                )
              }
            } else if (lakeParked) {
              fightStart = now
              prevFightT = -1
            } else {
              inFight = false
              idleStart = now
              prevFightT = -1
              if (crocWrap) {
                crocWrap.style.removeProperty('transform')
              }
              fig?.classList.remove(
                'game-page__sprite--fightForward',
                'game-page__sprite--leanBack',
              )
              lastCrocFrame = -1
              img.src = IDLE_FRAMES[0]
              displayedFrame = 0
            }
          } else if (ft < FT0) {
            const ease = ft / FT0
            img.src = IDLE_FRAMES[0]
            displayedFrame = 0
            fig?.classList.toggle('game-page__sprite--fightForward', ease > 0.3)
            if (crocImg) crocImg.src = CROC_FRAMES[2]
            if (crocWrap) {
              crocWrap.style.setProperty('--croc-bob', '0px')
              crocWrap.style.removeProperty('transform')
            }
          } else if (ft < FT1) {
            const sw = ft - FT0
            const i = attackFrameForSwingTime(sw)
            img.src = ATTACK_FRAMES[i]
            displayedFrame = i
            fig?.classList.add('game-page__sprite--fightForward')
            fig?.classList.remove('game-page__sprite--leanBack')
            if (crocImg) crocImg.src = CROC_FRAMES[2]
            if (crocWrap) {
              crocWrap.style.setProperty('--croc-bob', '0px')
              crocWrap.style.removeProperty('transform')
            }
          } else if (ft < FT2) {
            fig?.classList.remove('game-page__sprite--fightForward')
            fig?.classList.remove('game-page__sprite--leanBack')
            img.src = IDLE_FRAMES[0]
            displayedFrame = 0
            const sh = Math.sin(ft * 0.082) * 11
            if (crocImg) crocImg.src = CROC_FRAMES[2]
            if (crocWrap) {
              crocWrap.style.setProperty('--croc-bob', '0px')
              crocWrap.style.transform = `translate3d(calc(-50% + ${sh}px), 0, 0)`
            }
          } else if (ft < FT3) {
            const u = Math.min(1, (ft - FT2) / FIGHT_CROC_LUNGE_MS)
            const ue = 0.5 - 0.5 * Math.cos(Math.PI * u)
            const lx = lungeTarget * ue
            fig?.classList.remove('game-page__sprite--fightForward')
            fig?.classList.add('game-page__sprite--leanBack')
            img.src = IDLE_FRAMES[0]
            displayedFrame = 0
            if (crocImg) crocImg.src = CROC_FRAMES[2]
            if (crocWrap) {
              crocWrap.style.transform = `translate3d(calc(-50% + ${lx}px), 6px, 0)`
            }
          } else if (ft < FT4) {
            const local = ft - FT3
            fig?.classList.remove('game-page__sprite--leanBack')
            const i = attackFrameForSwingTime(local)
            img.src = ATTACK_FRAMES[i]
            displayedFrame = i
            fig?.classList.add('game-page__sprite--fightForward')
            const recoil = (1 - Math.min(1, local / ATTACK_SWING_MS)) * 100
            if (crocImg) crocImg.src = CROC_FRAMES[1]
            if (crocWrap) {
              crocWrap.style.transform = `translate3d(calc(-50% + ${-recoil}px), 0, 0)`
            }
          } else {
            const local = ft - FT4
            const wobble = Math.sin(local * 0.052) * 8
            fig?.classList.remove(
              'game-page__sprite--fightForward',
              'game-page__sprite--leanBack',
            )
            img.src = IDLE_FRAMES[0]
            displayedFrame = 0
            if (crocImg) crocImg.src = CROC_FRAMES[0]
            if (crocWrap) {
              crocWrap.style.transform = `translate3d(calc(-50% + ${wobble}px), 12px, 0)`
            }
          }

          const breathFight =
            Math.sin(((now - fightStart) / BREATH_PERIOD_MS) * Math.PI * 2) *
            (BREATH_BOB_PX * 0.32)
          body.style.transform = `translate(0px, ${breathFight}px)`
        } else if (waitingTrailSnap) {
          targetFrame =
            Math.floor(idleT / IDLE_FRAME_MS) % IDLE_FRAMES.length
          const breath =
            Math.sin((idleT / BREATH_PERIOD_MS) * Math.PI * 2) *
            (BREATH_BOB_PX * 0.5)
          body.style.transform = `translate(0px, ${breath}px)`
          if (crocWrap) crocWrap.style.visibility = 'hidden'
          if (!catchingUp && displayedFrame !== targetFrame) {
            catchingUp = true
            void catchUpSpriteFrames(IDLE_FRAMES, 'idle')
              .catch(() => {})
              .finally(() => {
                catchingUp = false
              })
          }
        } else if (runningNorthBridge) {
          const rt = elapsedNorthBridge
          if (crocWrap) crocWrap.style.visibility = 'hidden'
          const bob =
            Math.sin((rt / BOB_PERIOD_MS) * Math.PI * 2) * (RUN_BOB_PX * 0.5)
          const p = Math.min(1, Math.max(0, rt / NORTH_BRIDGE_RUN_MS))
          const rise =
            p *
            Math.min(
              NORTH_BRIDGE_RISE_CAP_PX,
              vh * NORTH_BRIDGE_RISE_VH_RATIO,
            )
          body.style.transform = `translate(0px, ${bob - rise}px)`

          /*
           * Realistic run = Run (n) frame cycle (hands/legs redrawn per frame).
           * mirrored CSS = northward sprint feel. backwards.png stays one raster in /resources —
           * add backwards (1–n).png to swap this for your rear-facing hero later.
           */
          targetFrame =
            Math.floor(rt / RUN_FRAME_MS) % RUN_FRAMES.length
          if (!catchingUp && displayedFrame !== targetFrame) {
            catchingUp = true
            void catchUpSpriteFrames(RUN_FRAMES, 'run')
              .catch(() => {})
              .finally(() => {
                catchingUp = false
              })
          }
        } else if (pastBridge) {
          const trailT = now - trailIdleStart
          targetFrame =
            Math.floor(trailT / IDLE_FRAME_MS) % IDLE_FRAMES.length
          const breath =
            Math.sin((trailT / BREATH_PERIOD_MS) * Math.PI * 2) *
            (BREATH_BOB_PX * 0.5)
          body.style.transform = `translate(0px, ${breath}px)`

          if (crocWrap) crocWrap.style.visibility = 'hidden'

          if (!catchingUp && displayedFrame !== targetFrame) {
            catchingUp = true
            void catchUpSpriteFrames(IDLE_FRAMES, 'idle')
              .catch(() => {})
              .finally(() => {
                catchingUp = false
              })
          }
        } else if (lakeParked) {
          targetFrame =
            Math.floor(idleT / IDLE_FRAME_MS) % IDLE_FRAMES.length
          const breath =
            Math.sin((idleT / BREATH_PERIOD_MS) * Math.PI * 2) *
            (BREATH_BOB_PX * 0.5)
          body.style.transform = `translate(0px, ${breath}px)`

          if (!catchingUp && displayedFrame !== targetFrame) {
            catchingUp = true
            void catchUpSpriteFrames(IDLE_FRAMES, 'idle')
              .catch(() => {})
              .finally(() => {
                catchingUp = false
              })
          }

          if (crocWrap) {
            crocWrap.style.visibility = 'visible'
            const crocBob =
              Math.sin((idleT / CROC_BOB_PERIOD_MS) * Math.PI * 2) *
              (CROC_BOB_PX * 0.5)
            crocWrap.style.setProperty('--croc-bob', `${crocBob}px`)
            crocWrap.style.removeProperty('transform')
          }
          if (crocImg) {
            const ci = crocMouthFrameIndex(idleT)
            if (lastCrocFrame === 0 && ci === 1) {
              playCrocGrowl(getCrocAudioContext)
            }
            if (ci !== lastCrocFrame) {
              lastCrocFrame = ci
              crocImg.src = CROC_FRAMES[ci]
            }
          }
        }
      } else {
        if (crocWrap) crocWrap.style.visibility = 'hidden'
        lastCrocFrame = -1
        const bob =
          Math.sin((t / BOB_PERIOD_MS) * Math.PI * 2) * (RUN_BOB_PX * 0.5)
        body.style.transform = `translate(0px, ${bob}px)`

        targetFrame = Math.floor(t / RUN_FRAME_MS) % RUN_FRAMES.length
        if (!catchingUp && displayedFrame !== targetFrame) {
          catchingUp = true
          void catchUpSpriteFrames(RUN_FRAMES, 'run')
            .catch(() => {})
            .finally(() => {
              catchingUp = false
            })
        }
      }

      if (scienceSolvedRef.current && trailSnapDelayRef.current > 0) {
        trailSnapDelayRef.current -= 1
      }

      syncGamePageDom()

      raf = requestAnimationFrame(tick)
    }

    function unlockCrocAudio() {
      const ctx = getCrocAudioContext()
      if (ctx?.state === 'suspended') void ctx.resume().catch(() => {})
    }
    document.body.addEventListener('pointerdown', unlockCrocAudio, {
      once: true,
      passive: true,
    })
    img.src = RUN_FRAMES[0]
    displayedFrame = 0
    raf = requestAnimationFrame(tick)
    return () => {
      document.body.removeEventListener('pointerdown', unlockCrocAudio)
      cancelled = true
      cancelAnimationFrame(raf)
      const actx = crocAudioCtxRef.current
      if (actx && actx.state !== 'closed') {
        void actx.close()
      }
      crocAudioCtxRef.current = null
    }
  }, [])

  const bgA = `url(${gamingBack})`
  const bgB = `url(${gamingback2})`

  return (
    <GameBackground hideImage>
      <div
        ref={gamePageRef}
        className="game-page game-page--scroll"
        aria-label="Running scene"
        role="presentation"
      >
        <div className="game-page__parallax" aria-hidden>
          <div ref={parallaxRowRef} className="game-page__parallax-row">
            <div
              className="game-page__parallax-tile"
              style={{ backgroundImage: bgA }}
            />
            <div
              className="game-page__parallax-tile"
              style={{ backgroundImage: bgB }}
            />
            <div
              className="game-page__parallax-tile"
              style={{ backgroundImage: bgA }}
            />
          </div>
        </div>

        <section
          className="game-page__science-placeholder"
          aria-label="Science question"
        >
          <div className="game-page__panel game-page__science-card">
            <p className="game-page__science-eyebrow">Bridge — science checkpoint</p>
            <div
              className="game-page__science-hearts"
              aria-label={`${scienceLives} of 3 attempts remaining`}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={
                    i < scienceLives
                      ? 'game-page__science-heart game-page__science-heart--on'
                      : 'game-page__science-heart game-page__science-heart--off'
                  }
                  aria-hidden
                >
                  ♥
                </span>
              ))}
            </div>
            <p className="game-page__science-q" id="lake-science-q-title">
              What main process moves water from a lake surface into the air?
            </p>
            <fieldset
              className="game-page__science-fieldset"
              aria-labelledby="lake-science-q-title"
            >
              <legend className="game-page__science-legend">Choose one answer</legend>
              <div className="game-page__science-options">
                {LAKE_SCIENCE_CHOICES.map((c) => (
                  <label
                    key={c.id}
                    className={
                      scienceChoice === c.id
                        ? 'game-page__science-option game-page__science-option--selected'
                        : 'game-page__science-option'
                    }
                  >
                    <input
                      type="radio"
                      className="game-page__science-radio"
                      name="lake-science-q"
                      value={c.id}
                      checked={scienceChoice === c.id}
                      onChange={() => setScienceChoice(c.id)}
                      disabled={scienceSolved || scienceLocked}
                    />
                    <span className="game-page__science-option-body">
                      <span className="game-page__science-letter">{c.id}</span>
                      <span className="game-page__science-label">{c.label}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="game-page__science-actions">
              <button
                type="button"
                className="game-page__science-check"
                onClick={handleScienceCheck}
                disabled={!scienceChoice || scienceSolved || scienceLocked}
              >
                Check answer
              </button>
            </div>
            {scienceSolved ? (
              <p className="game-page__science-feedback game-page__science-feedback--ok">
                Correct — run facing north across the bridge, then reach the trail.
              </p>
            ) : null}
            {scienceLocked && !scienceSolved ? (
              <p className="game-page__science-feedback game-page__science-feedback--bad">
                No attempts left. The crocodile blocks the way — get ready to fight.
              </p>
            ) : null}
            <p className="game-page__science-note">
              The crocodile fights until you answer. Get it right to run north-facing across the bridge,
              then reach the trail. Each wrong check costs one heart (three tries).
            </p>
          </div>
        </section>

        <div
          ref={crocWrapRef}
          className="game-page__croc"
          style={{ visibility: 'hidden', '--croc-bob': '0px' }}
          aria-hidden
        >
          <img
            ref={crocImgRef}
            className="game-page__croc-img"
            src={CROC_FRAMES[0]}
            alt=""
            decoding="async"
          />
        </div>

        <figure
          ref={figureRef}
          className="game-page__sprite"
          aria-label="Character"
        >
          <div ref={bodyRef} className="game-page__sprite-body">
            <img
              ref={imgRef}
              className="game-page__sprite-img"
              src={RUN_FRAMES[0]}
              alt="Character"
              decoding="async"
            />
          </div>
        </figure>
      </div>
    </GameBackground>
  )
}
