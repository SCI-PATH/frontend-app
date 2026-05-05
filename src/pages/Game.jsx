import { useEffect, useMemo, useRef, useState } from 'react'
import GameBackground from '../components/gamebackground.jsx'
import gamingBack from '../resources/gamingBack.jpg'
import gamingback2 from '../resources/gamingback2.png'
import background3 from '../resources/background3.png'
import background4 from '../resources/background4.png'
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
const JUMP_FRAMES = Array.from({ length: 10 }, (_, i) =>
  new URL(`../resources/Jump (${i + 1}).png`, import.meta.url).href,
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
const BACKGROUND3_CORRECT_ID = 'A'

const BACKGROUND3_MOCK_CHOICES = [
  { id: 'A', label: 'When air cools, water vapor condenses into tiny droplets' },
  { id: 'B', label: 'Water vapor becomes metal particles in clouds' },
  { id: 'C', label: 'Sunlight converts vapor directly to stones' },
  { id: 'D', label: 'Vapor disappears without changing state' },
]

const BACKGROUND3_MOCK_QUESTIONS = [
  'What happens to water vapor when cooler air is reached?',
  'How do tiny cloud droplets begin to form?',
  'Which process starts cloud formation from water vapor?',
  'When warm vapor rises and cools, what is the next step?',
]

const BACKGROUND3_BREAK_CELEBRATION_MS = 950

function shuffleChallenges(challenges) {
  const out = [...challenges]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function getRandomizedChallengeBackgrounds(pool, count) {
  if (!Array.isArray(pool) || pool.length === 0 || count <= 0) return []
  if (count <= pool.length) {
    const shuffled = [...pool]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled.slice(0, count)
  }
  const out = new Array(count)
  let prev = null
  for (let i = 0; i < count; i++) {
    let pick = Math.floor(Math.random() * pool.length)
    if (pool.length > 1 && pool[pick] === prev) {
      // Avoid immediate repeats (e.g. gamingback2 gamingback2 gamingback2...).
      let guard = 0
      while (pool[pick] === prev && guard < 8) {
        pick = Math.floor(Math.random() * pool.length)
        guard += 1
      }
      if (pool[pick] === prev) {
        pick = (pick + 1) % pool.length
      }
    }
    out[i] = pool[pick]
    prev = out[i]
  }
  return out
}

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
  const [background3QuestionIndex, setBackground3QuestionIndex] = useState(0)
  const [background3Choice, setBackground3Choice] = useState(null)
  const [background3Lives, setBackground3Lives] = useState(3)
  const [background3Solved, setBackground3Solved] = useState(false)
  const [background3Locked, setBackground3Locked] = useState(false)

  const scienceSolvedRef = useRef(false)
  const scienceLockedRef = useRef(false)
  const scienceLivesRef = useRef(3)
  const bg3QuestionIndexRef = useRef(0)
  const bg3QuizVisibleRef = useRef(false)
  const background3SolvedRef = useRef(false)
  const background3LockedRef = useRef(false)
  const background3LivesRef = useRef(3)
  const bg3CelebratingRef = useRef(false)
  const bg3CelebrationStartRef = useRef(0)
  const [bg3CelebratingUI, setBg3CelebratingUI] = useState(false)
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
  const randomizedChallenges = useMemo(
    () =>
      shuffleChallenges([
        {
          id: 'crocodile',
          backgrounds: [gamingback2], // ✅ ONLY the challenge
        },
        {
          id: 'gate',
          backgrounds: [background3, background4], // ✅ stays grouped
        },
      ]),
    [],
  )
  
  const parallaxBackgrounds = useMemo(() => {
    const result = [gamingBack]
  
    randomizedChallenges.forEach((challenge) => {
      result.push(...challenge.backgrounds)
      result.push(gamingBack) // ✅ add BETWEEN challenges
    })
  
    return result
  }, [randomizedChallenges])

  useEffect(() => {
    for (const url of [
      ...RUN_FRAMES,
      ...JUMP_FRAMES,
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

  function handleBackground3Check() {
    if (background3SolvedRef.current || background3LockedRef.current || !background3Choice) {
      return
    }
    if (background3Choice === BACKGROUND3_CORRECT_ID) {
      background3SolvedRef.current = true
      setBackground3Solved(true)
      bg3CelebratingRef.current = true
      bg3CelebrationStartRef.current = performance.now()
      setBg3CelebratingUI(true)
      return
    }
    const next = background3LivesRef.current - 1
    background3LivesRef.current = next
    setBackground3Lives(next)
    if (next <= 0) {
      background3LockedRef.current = true
      setBackground3Locked(true)
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
    const lakeTileIndex = parallaxBackgrounds.findIndex(
      (bg, i) => i > 0 && bg === gamingback2,
    )
    const trailTileIndex =
      lakeTileIndex >= 0
        ? Math.min(lakeTileIndex + 1, parallaxBackgrounds.length - 1)
        : -1
    const background3TileIndex = parallaxBackgrounds.findIndex(
      (bg, i) => i > 0 && bg === background3,
    )
    const background4TileIndex =
      background3TileIndex >= 0
        ? parallaxBackgrounds.findIndex((bg, i) => i > background3TileIndex && bg === background4)
        : -1
    const challenge2First =
      background3TileIndex >= 0 &&
      (lakeTileIndex < 0 || background3TileIndex < lakeTileIndex)

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
      const lakeScroll = lakeTileIndex * tw
      const trailScroll = trailTileIndex * tw
      const background3Scroll = background3TileIndex >= 0 ? background3TileIndex * tw : Infinity
      const background4Scroll = background4TileIndex >= 0 ? background4TileIndex * tw : Infinity
      const onTrailTile =
        scienceSolvedRef.current && sx >= trailScroll - 2
      const runningNorthOnBridgeFrozen =
        scienceSolvedRef.current &&
        trailSnapDelayRef.current === 0 &&
        !northBridgeComplete &&
        sx < trailScroll - 12
      /* Question stays up at the lake; hide on the trail tile (gamingBack) after a correct answer. */
      const lakeQuizDom =
        reachedGamingback2 &&
        !onTrailTile &&
        (!scienceSolvedRef.current || sx < lakeScroll + 96)
      const challenge2Unlocked = challenge2First || scienceSolvedRef.current
      const background3QuizDom =
        challenge2Unlocked &&
        !background3SolvedRef.current &&
        background3TileIndex >= 0 &&
        sx >= background3Scroll - 2 &&
        sx < background4Scroll - 2
      if (root) {
        root.classList.toggle('game-page--lakeQuiz', lakeQuizDom)
        root.classList.toggle('game-page--background3Quiz', background3QuizDom)
        root.classList.toggle('game-page--bg3Celebrating', bg3CelebratingRef.current)
        root.classList.toggle(
          'game-page--atLake',
          reachedGamingback2 && sx >= lakeScroll && sx < trailScroll,
        )
        root.classList.toggle(
          'game-page--pastBridge',
          scienceSolvedRef.current && sx >= trailScroll - 2,
        )
        root.classList.toggle('game-page--fighting', inFight)
        root.classList.toggle('game-page--scienceLocked', scienceLockedRef.current)
        root.classList.toggle(
          'game-page--northOnGamingback2',
          runningNorthOnBridgeFrozen,
        )
      }
      if (background3QuizDom && !bg3QuizVisibleRef.current) {
        let next = Math.floor(Math.random() * BACKGROUND3_MOCK_QUESTIONS.length)
        if (BACKGROUND3_MOCK_QUESTIONS.length > 1 && next === bg3QuestionIndexRef.current) {
          next = (next + 1) % BACKGROUND3_MOCK_QUESTIONS.length
        }
        bg3QuestionIndexRef.current = next
        setBackground3QuestionIndex(next)
        setBackground3Choice(null)
        setBackground3Solved(false)
        background3SolvedRef.current = false
        setBackground3Lives(3)
        background3LivesRef.current = 3
        setBackground3Locked(false)
        background3LockedRef.current = false
        bg3CelebratingRef.current = false
        bg3CelebrationStartRef.current = 0
        setBg3CelebratingUI(false)
      }
      bg3QuizVisibleRef.current = background3QuizDom
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
      const lakeScroll = lakeTileIndex * tw
      const trailScroll = trailTileIndex * tw
      const background3Scroll = background3TileIndex >= 0 ? background3TileIndex * tw : trailScroll
      const background4Scroll =
        background4TileIndex >= 0 ? background4TileIndex * tw : background3Scroll
      const firstChallengeScroll =
        challenge2First && !background3SolvedRef.current ? background3Scroll : lakeScroll

      if (!reachedGamingback2) {
        if (challenge2First && background3SolvedRef.current) {
          if (bg3CelebratingRef.current) {
            const celebrateFor = now - bg3CelebrationStartRef.current
            scrollPxRef.current = background4Scroll
            if (celebrateFor >= BACKGROUND3_BREAK_CELEBRATION_MS) {
              bg3CelebratingRef.current = false
              setBg3CelebratingUI(false)
            }
          } else {
            scrollPxRef.current = Math.max(
              background4Scroll,
              scrollPxRef.current + SCROLL_SPEED * dt,
            )
            if (scrollPxRef.current >= lakeScroll) {
              scrollPxRef.current = lakeScroll
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
          }
        } else {
          scrollPxRef.current += SCROLL_SPEED * dt
          if (scrollPxRef.current >= firstChallengeScroll) {
            scrollPxRef.current = firstChallengeScroll
            reachedGamingback2 = firstChallengeScroll === lakeScroll
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
        }
      } else if (scienceSolvedRef.current) {
        if (trailSnapFramesBeforeTick > 0) {
          scrollPxRef.current = lakeScroll
        } else if (!northBridgeComplete) {
          if (northBridgeRunStart === 0) northBridgeRunStart = now
          const nbElapsed = now - northBridgeRunStart
          if (nbElapsed < NORTH_BRIDGE_RUN_MS) {
            scrollPxRef.current = lakeScroll
          } else {
            scrollPxRef.current = trailScroll
            northBridgeComplete = true
          }
        } else {
          // Continue forward from trail tile to background3.
          if (background3SolvedRef.current) {
            if (bg3CelebratingRef.current) {
              const celebrateFor = now - bg3CelebrationStartRef.current
              if (celebrateFor >= BACKGROUND3_BREAK_CELEBRATION_MS) {
                bg3CelebratingRef.current = false
                setBg3CelebratingUI(false)

                // After sparkles, move to the gamingBack tile after background4.
                const nextGamingBackScroll = (background4TileIndex + 1) * tw
                scrollPxRef.current = nextGamingBackScroll
              } else {
                // During sparkles, always reveal background4.
                scrollPxRef.current = background4Scroll
              }
            } else {
              // After challenge 2 is solved, stay on the next gamingBack tile.
              const nextGamingBackScroll = (background4TileIndex + 1) * tw
              scrollPxRef.current = nextGamingBackScroll
            }
          } else if (!trailIdleReady) {
            scrollPxRef.current = trailScroll
          } else {
            scrollPxRef.current = Math.min(
              background3Scroll,
              scrollPxRef.current + SCROLL_SPEED * dt,
            )
          }
        }
      } else {
        scrollPxRef.current =
          challenge2First && !background3SolvedRef.current
            ? background3Scroll
            : lakeScroll
      }

      const x = scrollPxRef.current
      parallaxRow.style.transform = `translate3d(${-x}px, 0, 0)`

      const crocWrap = crocWrapRef.current
      const crocImg = crocImgRef.current

      if (reachedGamingback2) {
        const idleT = now - idleStart
        const lakeParked =
          x >= lakeScroll - 1 && x <= lakeScroll + 1 && !scienceSolvedRef.current
        const elapsedNorthBridge =
          northBridgeRunStart > 0 ? now - northBridgeRunStart : 0
        const runningNorthBridge =
          scienceSolvedRef.current &&
          trailSnapFramesBeforeTick === 0 &&
          !northBridgeComplete &&
          northBridgeRunStart > 0 &&
          elapsedNorthBridge < NORTH_BRIDGE_RUN_MS
        const pastBridge =
          scienceSolvedRef.current && x >= trailScroll - 1
        const waitingTrailSnap =
          scienceSolvedRef.current &&
          trailSnapFramesBeforeTick > 0 &&
          x <= lakeScroll + 1

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
          const runningToBackground3 =
            x < background3Scroll - 1 && !bg3CelebratingRef.current
          if (bg3CelebratingRef.current) {
            const celebrateT = now - bg3CelebrationStartRef.current
            targetFrame =
              Math.floor(celebrateT / IDLE_FRAME_MS) % IDLE_FRAMES.length
            const breath =
              Math.sin((celebrateT / BREATH_PERIOD_MS) * Math.PI * 2) *
              (BREATH_BOB_PX * 0.5)
            body.style.transform = `translate(0px, ${breath}px)`
          } else if (runningToBackground3) {
            const bob =
              Math.sin((trailT / BOB_PERIOD_MS) * Math.PI * 2) * (RUN_BOB_PX * 0.5)
            body.style.transform = `translate(0px, ${bob}px)`
            targetFrame = Math.floor(trailT / RUN_FRAME_MS) % RUN_FRAMES.length
          } else {
            targetFrame =
              Math.floor(trailT / IDLE_FRAME_MS) % IDLE_FRAMES.length
            const breath =
              Math.sin((trailT / BREATH_PERIOD_MS) * Math.PI * 2) *
              (BREATH_BOB_PX * 0.5)
            body.style.transform = `translate(0px, ${breath}px)`
          }

          if (crocWrap) crocWrap.style.visibility = 'hidden'

          if (!catchingUp && displayedFrame !== targetFrame) {
            catchingUp = true
            void catchUpSpriteFrames(
              bg3CelebratingRef.current
                ? IDLE_FRAMES
                : runningToBackground3
                  ? RUN_FRAMES
                  : IDLE_FRAMES,
              runningToBackground3 ? 'run' : 'idle',
            )
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

        if (challenge2First && bg3CelebratingRef.current) {
          const celebrateT = now - bg3CelebrationStartRef.current
          targetFrame =
            Math.floor(celebrateT / IDLE_FRAME_MS) % IDLE_FRAMES.length
          const breath =
            Math.sin((celebrateT / BREATH_PERIOD_MS) * Math.PI * 2) *
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
        } else {
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
            {parallaxBackgrounds.map((bg, i) => (
              <div
                key={`${i}-${bg}`}
                className="game-page__parallax-tile"
                style={{ backgroundImage: `url(${bg})` }}
              />
            ))}
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
        <section
          className="game-page__random-placeholder"
          aria-label="Background three random question"
        >
          <div className="game-page__panel game-page__random-card">
            <p className="game-page__science-eyebrow">Trail — mock checkpoint</p>
            <div
              className="game-page__science-hearts"
              aria-label={`${background3Lives} of 3 attempts remaining`}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={
                    i < background3Lives
                      ? 'game-page__science-heart game-page__science-heart--on'
                      : 'game-page__science-heart game-page__science-heart--off'
                  }
                  aria-hidden
                >
                  ♥
                </span>
              ))}
            </div>
            <p className="game-page__science-q" id="trail-mock-q-title">
              {BACKGROUND3_MOCK_QUESTIONS[background3QuestionIndex]}
            </p>
            <fieldset
              className="game-page__science-fieldset"
              aria-labelledby="trail-mock-q-title"
            >
              <legend className="game-page__science-legend">Choose one answer</legend>
              <div className="game-page__science-options">
                {BACKGROUND3_MOCK_CHOICES.map((c) => (
                  <label
                    key={c.id}
                    className={
                      background3Choice === c.id
                        ? 'game-page__science-option game-page__science-option--selected'
                        : 'game-page__science-option'
                    }
                  >
                    <input
                      type="radio"
                      className="game-page__science-radio"
                      name="trail-mock-q"
                      value={c.id}
                      checked={background3Choice === c.id}
                      onChange={() => setBackground3Choice(c.id)}
                      disabled={background3Solved || background3Locked}
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
                onClick={handleBackground3Check}
                disabled={!background3Choice || background3Solved || background3Locked}
              >
                Check answer
              </button>
            </div>
            {background3Solved ? (
              <p className="game-page__science-feedback game-page__science-feedback--ok">
                Correct.
              </p>
            ) : null}
            {background3Locked && !background3Solved ? (
              <p className="game-page__science-feedback game-page__science-feedback--bad">
                No attempts left for this question.
              </p>
            ) : null}
          </div>
        </section>
        <div
          className={
            bg3CelebratingUI
              ? 'game-page__break-sparkles game-page__break-sparkles--active'
              : 'game-page__break-sparkles'
          }
          aria-hidden
        >
          <span className="game-page__spark game-page__spark--a" />
          <span className="game-page__spark game-page__spark--b" />
          <span className="game-page__spark game-page__spark--c" />
          <span className="game-page__spark game-page__spark--d" />
          <span className="game-page__spark game-page__spark--e" />
          <span className="game-page__spark game-page__spark--f" />
          <span className="game-page__spark game-page__spark--g" />
          <span className="game-page__spark game-page__spark--h" />
          <span className="game-page__spark game-page__spark--i" />
          <span className="game-page__spark game-page__spark--j" />
          <span className="game-page__spark game-page__spark--k" />
          <span className="game-page__spark game-page__spark--l" />
        </div>

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
