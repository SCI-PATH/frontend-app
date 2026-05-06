import { useEffect, useMemo, useRef, useState } from 'react'
import GameBackground from '../components/gamebackground.jsx'
import gamingBack from '../resources/gamingBack.jpg'
import gamingback2 from '../resources/gamingback2.png'
import background3 from '../resources/background3.png'
import background4 from '../resources/background4.png'
import background5 from '../resources/background5.png'
import background6 from '../resources/background6.png'
import kingDead from '../resources/Dead (1).png'
import kingHappy from '../resources/Idle (1).png'
import victoryBadge from '../resources/victory.png'
import goodBadge from '../resources/good.png'
import bronzeBadge from '../resources/bronz.png'
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

const RUN_FRAME_MS = 54
const RUN_BOB_PX = 4.5
const BOB_PERIOD_MS = 280
const IDLE_FRAME_MS = 110
const BREATH_BOB_PX = 2.5
const BREATH_PERIOD_MS = 2400
const SCROLL_SPEED = 360

/** Slower wind-up, faster strike — reads more like a real swing. */
const ATTACK_DURATIONS_MS = [78, 72, 68, 62, 46, 38, 36, 38, 44, 52]
const ATTACK_SWING_MS = ATTACK_DURATIONS_MS.reduce((a, b) => a + b, 0)

/** Start croc fight this long after reaching the lake (while the science card is up). */
const LAKE_FIGHT_START_MS = 900
/** Ticks after “Correct” to show feedback, then pure northward run on gamingback2. */
const TRAIL_FEEDBACK_DELAY_FRAMES = 7
/** How long the sprite runs straight north on the frozen bridge tile (ms), then jumps to trail. */
const NORTH_BRIDGE_RUN_MS = 1600
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

const BACKGROUND5_CORRECT_ID = 'B'

const BACKGROUND5_MOCK_CHOICES = [
  { id: 'A', label: 'Clouds shrink until new water appears from nothing' },
  { id: 'B', label: 'Droplets merge and fall when they grow heavy enough' },
  { id: 'C', label: 'Wind removes all weight so rain never falls' },
  { id: 'D', label: 'Cloud droplets freeze into solids before any fall' },
]

const BACKGROUND5_MOCK_QUESTIONS = [
  'What must happen inside a cloud before precipitation can occur?',
  'Why do clouds often release rain or snow instead of storing it forever?',
  'What tends to occur when countless cloud droplets collide and combine?',
]

const BACKGROUND3_BREAK_CELEBRATION_MS = 950
const BACKGROUND6_NORTH_RUN_MS = 1400
const HEARTS_PER_CHALLENGE = 4

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

function formatDuration(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function Game() {
  const [scienceChoice, setScienceChoice] = useState(null)
  const [scienceLives, setScienceLives] = useState(HEARTS_PER_CHALLENGE)
  const [scienceSolved, setScienceSolved] = useState(false)
  const [scienceLocked, setScienceLocked] = useState(false)
  const [background3QuestionIndex, setBackground3QuestionIndex] = useState(0)
  const [background3Choice, setBackground3Choice] = useState(null)
  const [background3Lives, setBackground3Lives] = useState(HEARTS_PER_CHALLENGE)
  const [background3Solved, setBackground3Solved] = useState(false)
  const [background3Locked, setBackground3Locked] = useState(false)
  const [background5QuestionIndex, setBackground5QuestionIndex] = useState(0)
  const [background5Choice, setBackground5Choice] = useState(null)
  const [background5Lives, setBackground5Lives] = useState(HEARTS_PER_CHALLENGE)
  const [background5Solved, setBackground5Solved] = useState(false)
  const [background5Locked, setBackground5Locked] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const [finishedElapsedMs, setFinishedElapsedMs] = useState(null)
  const [successAnimFrame, setSuccessAnimFrame] = useState(0)
  const answerTimingActiveRef = useRef(false)
  const answerTimingStartRef = useRef(0)
  const answerTimingAccumulatedMsRef = useRef(0)
  /** After correct challenge3 answer: tile shows background6 under rain / after (same strip cell). */
  const [challenge3TileIsBackground6, setChallenge3TileIsBackground6] = useState(false)
  const challenge3TileIsBackground6Ref = useRef(false)

  useEffect(() => {
    challenge3TileIsBackground6Ref.current = challenge3TileIsBackground6
  }, [challenge3TileIsBackground6])

  const scienceSolvedRef = useRef(false)
  const scienceLockedRef = useRef(false)
  const scienceLivesRef = useRef(HEARTS_PER_CHALLENGE)
  const bg3QuestionIndexRef = useRef(0)
  const bg3QuizVisibleRef = useRef(false)
  const background3SolvedRef = useRef(false)
  const background3LockedRef = useRef(false)
  const background3LivesRef = useRef(HEARTS_PER_CHALLENGE)
  const bg3CelebratingRef = useRef(false)
  const bg3CelebrationStartRef = useRef(0)
  const [bg3CelebratingUI, setBg3CelebratingUI] = useState(false)
  const bg5QuestionIndexRef = useRef(0)
  const bg5QuizVisibleRef = useRef(false)
  const background5SolvedRef = useRef(false)
  const background5LockedRef = useRef(false)
  const background5LivesRef = useRef(HEARTS_PER_CHALLENGE)
  const bg5CelebratingRef = useRef(false)
  const bg5CelebrationStartRef = useRef(0)
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
        {
          id: 'challenge3',
          backgrounds: [background5],
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

  const challenge3ParallaxTileIndex = useMemo(
    () => parallaxBackgrounds.findIndex((b, idx) => idx > 0 && b === background5),
    [parallaxBackgrounds],
  )

  const allChallengesOver =
    (scienceSolved || scienceLocked) &&
    (background3Solved || background3Locked) &&
    (background5Solved || background5Locked)
  const totalHeartsMax = HEARTS_PER_CHALLENGE
  const totalHeartsDamagedRaw =
    (HEARTS_PER_CHALLENGE - scienceLives) +
    (HEARTS_PER_CHALLENGE - background3Lives) +
    (HEARTS_PER_CHALLENGE - background5Lives)
  const totalHeartsDamaged = Math.min(totalHeartsMax, totalHeartsDamagedRaw)
  const totalHeartsRemaining = totalHeartsMax - totalHeartsDamaged
  const isGameOver = totalHeartsRemaining <= 0
  const solvedCount =
    Number(scienceSolved) + Number(background3Solved) + Number(background5Solved)
  const gameScore = Math.max(0, solvedCount * 100 - totalHeartsDamaged * 10)
  const displayElapsedMs = finishedElapsedMs ?? elapsedMs
  const displayElapsedSec = Math.floor(displayElapsedMs / 1000)
  const winGrade =
    totalHeartsRemaining >= 3 && displayElapsedSec <= 35
      ? 'Victory'
      : totalHeartsRemaining >= 2 && displayElapsedSec <= 55
        ? 'Good'
        : 'Bronze'
  const winBadgeImage =
    winGrade === 'Victory' ? victoryBadge : winGrade === 'Good' ? goodBadge : bronzeBadge
  const performanceRatio = Math.max(0, Math.min(1, gameScore / 300))
  const motivationAdvice =
    performanceRatio >= 0.85
      ? 'Excellent performance! Keep this pace and challenge yourself with trickier questions next.'
      : performanceRatio >= 0.55
        ? 'Good effort! Review the options twice before checking, and you can push this into top score range.'
        : 'Do not worry — progress comes with practice. Slow down, eliminate wrong options, and you will improve quickly.'

  function restartGame() {
    window.location.reload()
  }

  useEffect(() => {
    if (finishedElapsedMs !== null) return
    const timer = window.setInterval(() => {
      const now = performance.now()
      const runningSlice = answerTimingActiveRef.current
        ? now - answerTimingStartRef.current
        : 0
      setElapsedMs(Math.floor(answerTimingAccumulatedMsRef.current + runningSlice))
    }, 250)
    return () => window.clearInterval(timer)
  }, [finishedElapsedMs])

  useEffect(() => {
    if (allChallengesOver && finishedElapsedMs === null) {
      const now = performance.now()
      const runningSlice = answerTimingActiveRef.current
        ? now - answerTimingStartRef.current
        : 0
      const total = Math.floor(answerTimingAccumulatedMsRef.current + runningSlice)
      setFinishedElapsedMs(total)
      if (answerTimingActiveRef.current) {
        answerTimingAccumulatedMsRef.current = total
        answerTimingActiveRef.current = false
        answerTimingStartRef.current = 0
      }
    }
  }, [allChallengesOver, finishedElapsedMs])

  useEffect(() => {
    if (!(allChallengesOver && !isGameOver)) return
    const anim = window.setInterval(() => {
      setSuccessAnimFrame((prev) => (prev + 1) % JUMP_FRAMES.length)
    }, 95)
    return () => window.clearInterval(anim)
  }, [allChallengesOver, isGameOver])

  useEffect(() => {
    for (const url of [
      ...RUN_FRAMES,
      ...JUMP_FRAMES,
      ...IDLE_FRAMES,
      ...CROC_FRAMES,
      ...ATTACK_FRAMES,
      background6,
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

  function handleBackground5Check() {
    if (background5SolvedRef.current || background5LockedRef.current || !background5Choice) {
      return
    }
    if (background5Choice === BACKGROUND5_CORRECT_ID) {
      background5SolvedRef.current = true
      setBackground5Solved(true)
      setChallenge3TileIsBackground6(true)
      bg5CelebratingRef.current = true
      bg5CelebrationStartRef.current = performance.now()
      return
    }
    const next = background5LivesRef.current - 1
    background5LivesRef.current = next
    setBackground5Lives(next)
    if (next <= 0) {
      background5LockedRef.current = true
      setBackground5Locked(true)
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
    /** Background6 also uses a frozen middle-screen north run before returning to gamingBack. */
    let background6NorthRunStart = 0
    let background6NorthRunComplete = false
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
    /** When challenge3 sits after the gate pair on the strip, run from post-gate separator to this tile. */
    const background5AfterGateTileIndex =
      background4TileIndex >= 0
        ? parallaxBackgrounds.findIndex(
            (bg, i) => i > background4TileIndex && bg === background5,
          )
        : -1
    const challenge3TileIndex = parallaxBackgrounds.findIndex(
      (bg, i) => i > 0 && bg === background5,
    )
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
        const challenge5EarlyPx =
          challenge3TileIndex >= 0 ? challenge3TileIndex * tw : 0
        const challenge5BeforeLakeCatchup =
          challenge3TileIndex >= 0 &&
          lakeTileIndex >= 0 &&
          challenge3TileIndex < lakeTileIndex
        const allowIdleChallenge5Early =
          kind === 'idle' &&
          challenge5BeforeLakeCatchup &&
          (bg5CelebratingRef.current ||
            (!background5SolvedRef.current &&
              sx >= challenge5EarlyPx - 2 &&
              sx <= challenge5EarlyPx + 2))
        const runningNorthBackground6Catchup =
          challenge3TileIsBackground6Ref.current &&
          background5SolvedRef.current &&
          !background6NorthRunComplete &&
          challenge3TileIndex >= 0 &&
          sx >= challenge5EarlyPx - 2 &&
          sx <= challenge5EarlyPx + 2 &&
          !bg5CelebratingRef.current
        if (kind === 'run' && lakeParkedScroll && !inFight) return
        if (kind === 'run' && !reachedGamingback2 && runningNorthBackground6Catchup) {
          // Allow early background6 north-facing run before the lake challenge.
        } else if (
          kind === 'idle' &&
          (!reachedGamingback2 || inFight || spriteRunningNorthTowardTrail) &&
          !(challenge2First && bg3CelebratingRef.current) &&
          !allowIdleChallenge5Early
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
      const allChallengesOver =
        (scienceSolvedRef.current || scienceLockedRef.current) &&
        (background3SolvedRef.current || background3LockedRef.current) &&
        (background5SolvedRef.current || background5LockedRef.current)
      const runningNorthOnBridgeFrozen =
        scienceSolvedRef.current &&
        trailSnapDelayRef.current === 0 &&
        !northBridgeComplete &&
        sx < trailScroll - 12
      const background6Scroll =
        challenge3TileIndex >= 0 ? challenge3TileIndex * tw : Infinity
      const background6NextGamingBackScroll =
        challenge3TileIndex >= 0 ? (challenge3TileIndex + 1) * tw : Infinity
      const runningNorthOnBackground6Frozen =
        challenge3TileIsBackground6Ref.current &&
        background5SolvedRef.current &&
        !background6NorthRunComplete &&
        !bg5CelebratingRef.current &&
        sx >= background6Scroll - 2 &&
        sx < background6NextGamingBackScroll - 2
      /* Question stays up at the lake; hide on the trail tile (gamingBack) after a correct answer. */
      const lakeQuizDom =
        !allChallengesOver &&
        reachedGamingback2 &&
        !onTrailTile &&
        (!scienceSolvedRef.current || sx < lakeScroll + 96)
      const challenge2Unlocked = challenge2First || scienceSolvedRef.current
      const background3QuizDom =
        !allChallengesOver &&
        challenge2Unlocked &&
        !background3SolvedRef.current &&
        background3TileIndex >= 0 &&
        sx >= background3Scroll - 2 &&
        sx < background4Scroll - 2
      const challenge3Scroll = challenge3TileIndex >= 0 ? challenge3TileIndex * tw : Infinity
      const challenge3EndScroll =
        challenge3TileIndex >= 0 ? (challenge3TileIndex + 1) * tw : Infinity
      const challenge5BeforeLake =
        challenge3TileIndex >= 0 &&
        lakeTileIndex >= 0 &&
        challenge3TileIndex < lakeTileIndex
      const background5QuizUnlocked =
        challenge3TileIndex >= 0 &&
        (background5AfterGateTileIndex >= 0
          ? background3SolvedRef.current
          : challenge5BeforeLake
            ? true
            : scienceSolvedRef.current)
      const background5QuizDom =
        !allChallengesOver &&
        background5QuizUnlocked &&
        !background5SolvedRef.current &&
        challenge3TileIndex >= 0 &&
        sx >= challenge3Scroll - 2 &&
        sx < challenge3EndScroll - 2
      const answerActiveDom =
        (lakeQuizDom && !scienceSolvedRef.current && !scienceLockedRef.current) ||
        (background3QuizDom &&
          !background3SolvedRef.current &&
          !background3LockedRef.current) ||
        (background5QuizDom &&
          !background5SolvedRef.current &&
          !background5LockedRef.current)
      const nowForAnswerTimer = performance.now()
      if (answerActiveDom && !answerTimingActiveRef.current) {
        answerTimingActiveRef.current = true
        answerTimingStartRef.current = nowForAnswerTimer
      } else if (!answerActiveDom && answerTimingActiveRef.current) {
        answerTimingAccumulatedMsRef.current += nowForAnswerTimer - answerTimingStartRef.current
        answerTimingActiveRef.current = false
        answerTimingStartRef.current = 0
      }
      if (root) {
        root.classList.toggle('game-page--lakeQuiz', lakeQuizDom)
        root.classList.toggle('game-page--background3Quiz', background3QuizDom)
        root.classList.toggle('game-page--background5Quiz', background5QuizDom)
        root.classList.toggle('game-page--bg3Celebrating', bg3CelebratingRef.current)
        root.classList.toggle('game-page--bg5Rain', bg5CelebratingRef.current)
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
          runningNorthOnBridgeFrozen || runningNorthOnBackground6Frozen,
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
        setBackground3Lives(HEARTS_PER_CHALLENGE)
        background3LivesRef.current = HEARTS_PER_CHALLENGE
        setBackground3Locked(false)
        background3LockedRef.current = false
        bg3CelebratingRef.current = false
        bg3CelebrationStartRef.current = 0
        setBg3CelebratingUI(false)
      }
      bg3QuizVisibleRef.current = background3QuizDom
      if (background5QuizDom && !bg5QuizVisibleRef.current) {
        let next = Math.floor(Math.random() * BACKGROUND5_MOCK_QUESTIONS.length)
        if (BACKGROUND5_MOCK_QUESTIONS.length > 1 && next === bg5QuestionIndexRef.current) {
          next = (next + 1) % BACKGROUND5_MOCK_QUESTIONS.length
        }
        bg5QuestionIndexRef.current = next
        setBackground5QuestionIndex(next)
        setBackground5Choice(null)
        setBackground5Solved(false)
        background5SolvedRef.current = false
        setBackground5Lives(HEARTS_PER_CHALLENGE)
        background5LivesRef.current = HEARTS_PER_CHALLENGE
        setBackground5Locked(false)
        background5LockedRef.current = false
        bg5CelebratingRef.current = false
        bg5CelebrationStartRef.current = 0
        background6NorthRunStart = 0
        background6NorthRunComplete = false
        setChallenge3TileIsBackground6(false)
      }
      bg5QuizVisibleRef.current = background5QuizDom
      imgRef.current?.classList.toggle(
        'game-page__sprite-img--runningNorthFace',
        runningNorthOnBridgeFrozen || runningNorthOnBackground6Frozen,
      )
      figureRef.current?.classList.toggle(
        'game-page__sprite--centerNorthRun',
        runningNorthOnBridgeFrozen || runningNorthOnBackground6Frozen,
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
      const challenge5ScrollPx =
        challenge3TileIndex >= 0 ? challenge3TileIndex * tw : lakeScroll
      const postChallenge5GamingBackScrollPx =
        challenge3TileIndex >= 0 ? (challenge3TileIndex + 1) * tw : lakeScroll
      const background6NorthRunPending =
        challenge3TileIsBackground6Ref.current &&
        background5SolvedRef.current &&
        !background6NorthRunComplete &&
        challenge3TileIndex >= 0
      const challenge5BeforeLake =
        challenge3TileIndex >= 0 &&
        lakeTileIndex >= 0 &&
        challenge3TileIndex < lakeTileIndex
      const challenge5BetweenGateAndLake =
        challenge5BeforeLake &&
        background4TileIndex >= 0 &&
        challenge3TileIndex > background4TileIndex

      let firstChallengeScroll = lakeScroll
      if (challenge2First && !background3SolvedRef.current) {
        firstChallengeScroll = Math.min(firstChallengeScroll, background3Scroll)
      }
      if (challenge5BeforeLake && !background5SolvedRef.current) {
        firstChallengeScroll = Math.min(firstChallengeScroll, challenge5ScrollPx)
      }

      if (!reachedGamingback2) {
        if (challenge2First && background3SolvedRef.current) {
          if (
            bg5CelebratingRef.current &&
            challenge5BeforeLake &&
            challenge3TileIndex >= 0
          ) {
            scrollPxRef.current = challenge5ScrollPx
            const celebrateFor = now - bg5CelebrationStartRef.current
            if (celebrateFor >= BACKGROUND3_BREAK_CELEBRATION_MS) {
              bg5CelebratingRef.current = false
            }
          } else if (background6NorthRunPending && challenge5BeforeLake) {
            if (background6NorthRunStart === 0) background6NorthRunStart = now
            const bg6NorthElapsed = now - background6NorthRunStart
            if (bg6NorthElapsed < BACKGROUND6_NORTH_RUN_MS) {
              scrollPxRef.current = challenge5ScrollPx
            } else {
              background6NorthRunComplete = true
              scrollPxRef.current = postChallenge5GamingBackScrollPx
            }
          } else if (bg3CelebratingRef.current) {
            const celebrateFor = now - bg3CelebrationStartRef.current
            scrollPxRef.current = background4Scroll
            if (celebrateFor >= BACKGROUND3_BREAK_CELEBRATION_MS) {
              bg3CelebratingRef.current = false
              setBg3CelebratingUI(false)
            }
          } else {
            let moveCap = lakeScroll
            if (challenge5BetweenGateAndLake && !background5SolvedRef.current) {
              moveCap = Math.min(moveCap, challenge5ScrollPx)
            }
            scrollPxRef.current = Math.max(
              background4Scroll,
              Math.min(moveCap, scrollPxRef.current + SCROLL_SPEED * dt),
            )
            if (scrollPxRef.current >= lakeScroll - 0.5) {
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
          if (
            bg5CelebratingRef.current &&
            challenge5BeforeLake &&
            challenge3TileIndex >= 0
          ) {
            scrollPxRef.current = challenge5ScrollPx
            const celebrateFor = now - bg5CelebrationStartRef.current
            if (celebrateFor >= BACKGROUND3_BREAK_CELEBRATION_MS) {
              bg5CelebratingRef.current = false
            }
          } else if (background6NorthRunPending && challenge5BeforeLake) {
            if (background6NorthRunStart === 0) background6NorthRunStart = now
            const bg6NorthElapsed = now - background6NorthRunStart
            if (bg6NorthElapsed < BACKGROUND6_NORTH_RUN_MS) {
              scrollPxRef.current = challenge5ScrollPx
            } else {
              background6NorthRunComplete = true
              scrollPxRef.current = postChallenge5GamingBackScrollPx
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
              if (fig && !lakeAriaSet && reachedGamingback2) {
                fig.setAttribute(
                  'aria-label',
                  'Character resting and watching the lake',
                )
                lakeAriaSet = true
              }
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
          // Continue forward from trail tile to challenge tiles / post-gate strip.
          const postGateGamingBackScrollPx = (background4TileIndex + 1) * tw
          const challenge3ScrollPx =
            challenge3TileIndex >= 0 ? challenge3TileIndex * tw : postGateGamingBackScrollPx
          const pastChallenge3ScrollPx =
            challenge3TileIndex >= 0
              ? (challenge3TileIndex + 1) * tw
              : postGateGamingBackScrollPx

          if (bg5CelebratingRef.current && challenge3TileIndex >= 0) {
            const celebrateFor = now - bg5CelebrationStartRef.current
            scrollPxRef.current = challenge3ScrollPx
            if (celebrateFor >= BACKGROUND3_BREAK_CELEBRATION_MS) {
              bg5CelebratingRef.current = false
            }
          } else if (background6NorthRunPending) {
            if (background6NorthRunStart === 0) background6NorthRunStart = now
            const bg6NorthElapsed = now - background6NorthRunStart
            if (bg6NorthElapsed < BACKGROUND6_NORTH_RUN_MS) {
              scrollPxRef.current = challenge3ScrollPx
            } else {
              background6NorthRunComplete = true
              scrollPxRef.current = pastChallenge3ScrollPx
            }
          } else if (background3SolvedRef.current) {
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
              if (background5AfterGateTileIndex >= 0) {
                const cap =
                  background5SolvedRef.current
                    ? pastChallenge3ScrollPx
                    : challenge3ScrollPx
                scrollPxRef.current = Math.min(
                  cap,
                  Math.max(
                    postGateGamingBackScrollPx,
                    scrollPxRef.current + SCROLL_SPEED * dt,
                  ),
                )
              } else {
                scrollPxRef.current = postGateGamingBackScrollPx
              }
            }
          } else if (!trailIdleReady) {
            scrollPxRef.current = trailScroll
          } else {
            const gateApproachScroll =
              background3TileIndex >= 0 ? background3Scroll : trailScroll
            const stopBeforeGateScroll =
              challenge3TileIndex >= 0 &&
              background3TileIndex >= 0 &&
              challenge3TileIndex < background3TileIndex &&
              !background5SolvedRef.current
                ? challenge3TileIndex * tw
                : gateApproachScroll
            scrollPxRef.current = Math.min(
              stopBeforeGateScroll,
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
          const postGateGamingBackScrollPx = (background4TileIndex + 1) * tw
          const challenge3ScrollPx =
            challenge3TileIndex >= 0 ? challenge3TileIndex * tw : 0
          const postChallenge3GamingBackScrollPx =
            challenge3TileIndex >= 0 ? (challenge3TileIndex + 1) * tw : 0
          const waitingOnChallenge3 =
            challenge3TileIndex >= 0 &&
            x >= challenge3ScrollPx - 2 &&
            x <= challenge3ScrollPx + 2 &&
            !background5SolvedRef.current &&
            !bg5CelebratingRef.current
          const runningOnBackground6North =
            challenge3TileIsBackground6Ref.current &&
            background5SolvedRef.current &&
            !background6NorthRunComplete &&
            challenge3TileIndex >= 0 &&
            x >= challenge3ScrollPx - 2 &&
            x < postChallenge3GamingBackScrollPx - 2 &&
            !bg5CelebratingRef.current
          const runningOnGamingBackAfterBg6 =
            challenge3TileIsBackground6Ref.current &&
            challenge3TileIndex >= 0 &&
            x >= postChallenge3GamingBackScrollPx - 2 &&
            x < postChallenge3GamingBackScrollPx + tw - 2 &&
            !bg3CelebratingRef.current &&
            !bg5CelebratingRef.current
          const runningPastGateTowardChallenge3 =
            background3SolvedRef.current &&
            !bg3CelebratingRef.current &&
            !bg5CelebratingRef.current &&
            background5AfterGateTileIndex >= 0 &&
            !background5SolvedRef.current &&
            x >= postGateGamingBackScrollPx - 2 &&
            x < challenge3ScrollPx - 1
          const runningPreGateFromChallenge3TowardGate =
            scienceSolvedRef.current &&
            !bg3CelebratingRef.current &&
            !bg5CelebratingRef.current &&
            challenge3TileIndex >= 0 &&
            background3TileIndex >= 0 &&
            challenge3TileIndex < background3TileIndex &&
            background5SolvedRef.current &&
            x < background3Scroll - 1 &&
            x >= challenge3ScrollPx - 2
          const runningToBackground3 =
            !waitingOnChallenge3 &&
            ((x < background3Scroll - 1 && !bg3CelebratingRef.current) ||
              runningOnBackground6North ||
              runningOnGamingBackAfterBg6 ||
              runningPastGateTowardChallenge3 ||
              runningPreGateFromChallenge3TowardGate)
          if (bg3CelebratingRef.current || bg5CelebratingRef.current) {
            const celebrateT =
              now -
              (bg5CelebratingRef.current
                ? bg5CelebrationStartRef.current
                : bg3CelebrationStartRef.current)
            targetFrame =
              Math.floor(celebrateT / IDLE_FRAME_MS) % IDLE_FRAMES.length
            const breath =
              Math.sin((celebrateT / BREATH_PERIOD_MS) * Math.PI * 2) *
              (BREATH_BOB_PX * 0.5)
            body.style.transform = `translate(0px, ${breath}px)`
          } else if (runningOnBackground6North) {
            const bg6NorthElapsed =
              background6NorthRunStart > 0 ? now - background6NorthRunStart : 0
            const bob =
              Math.sin((trailT / BOB_PERIOD_MS) * Math.PI * 2) * (RUN_BOB_PX * 0.5)
            const p = Math.min(1, Math.max(0, bg6NorthElapsed / BACKGROUND6_NORTH_RUN_MS))
            const rise =
              p *
              Math.min(
                NORTH_BRIDGE_RISE_CAP_PX,
                vh * NORTH_BRIDGE_RISE_VH_RATIO,
              )
            body.style.transform = `translate(0px, ${bob - rise}px)`
            targetFrame = Math.floor(trailT / RUN_FRAME_MS) % RUN_FRAMES.length
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
              bg3CelebratingRef.current || bg5CelebratingRef.current
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

        const xPre = scrollPxRef.current
        const challenge5EarlyScrollPxSprite =
          challenge3TileIndex >= 0 ? challenge3TileIndex * tw : 0
        const challenge5BeforeLakeSprite =
          challenge3TileIndex >= 0 &&
          lakeTileIndex >= 0 &&
          challenge3TileIndex < lakeTileIndex
        const parkedOnEarlyChallenge5 =
          challenge5BeforeLakeSprite &&
          !background5SolvedRef.current &&
          xPre >= challenge5EarlyScrollPxSprite - 2 &&
          xPre <= challenge5EarlyScrollPxSprite + 2
        const runningNorthEarlyBackground6 =
          challenge5BeforeLakeSprite &&
          challenge3TileIsBackground6Ref.current &&
          background5SolvedRef.current &&
          !background6NorthRunComplete &&
          background6NorthRunStart > 0 &&
          !bg5CelebratingRef.current &&
          xPre >= challenge5EarlyScrollPxSprite - 2 &&
          xPre <= challenge5EarlyScrollPxSprite + 2

        if (runningNorthEarlyBackground6) {
          const bg6NorthElapsed = now - background6NorthRunStart
          const bob =
            Math.sin((bg6NorthElapsed / BOB_PERIOD_MS) * Math.PI * 2) *
            (RUN_BOB_PX * 0.5)
          const p = Math.min(1, Math.max(0, bg6NorthElapsed / BACKGROUND6_NORTH_RUN_MS))
          const rise =
            p *
            Math.min(
              NORTH_BRIDGE_RISE_CAP_PX,
              vh * NORTH_BRIDGE_RISE_VH_RATIO,
            )
          body.style.transform = `translate(0px, ${bob - rise}px)`
          targetFrame = Math.floor(bg6NorthElapsed / RUN_FRAME_MS) % RUN_FRAMES.length

          if (!catchingUp && displayedFrame !== targetFrame) {
            catchingUp = true
            void catchUpSpriteFrames(RUN_FRAMES, 'run')
              .catch(() => {})
              .finally(() => {
                catchingUp = false
              })
          }
        } else if (challenge2First && bg3CelebratingRef.current) {
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
        } else if (
          bg5CelebratingRef.current &&
          challenge5BeforeLakeSprite &&
          challenge3TileIndex >= 0
        ) {
          const celebrateT = now - bg5CelebrationStartRef.current
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
        } else if (parkedOnEarlyChallenge5) {
          const breathT = now - start
          targetFrame =
            Math.floor(breathT / IDLE_FRAME_MS) % IDLE_FRAMES.length
          const breath =
            Math.sin((breathT / BREATH_PERIOD_MS) * Math.PI * 2) *
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
            {parallaxBackgrounds.map((bg, i) => {
              const tileUrl =
                challenge3TileIsBackground6 && i === challenge3ParallaxTileIndex
                  ? background6
                  : bg
              return (
                <div
                  key={i}
                  className="game-page__parallax-tile"
                  style={{ backgroundImage: `url(${tileUrl})` }}
                />
              )
            })}
          </div>
        </div>

        <div className="game-page__real-rain" aria-hidden>
          <div className="game-page__real-rain-sky" />
          <div className="game-page__real-rain-layer game-page__real-rain-layer--distant" />
          <div className="game-page__real-rain-layer game-page__real-rain-layer--mid" />
          <div className="game-page__real-rain-layer game-page__real-rain-layer--near" />
          <div className="game-page__real-rain-mist" />
        </div>

        <aside className="game-page__hud" aria-label="Game dashboard">
          <div className="game-page__hud-title">Game Dashboard</div>
          <div className="game-page__hud-row">
            <span className="game-page__hud-label">Hearts</span>
            <span className="game-page__hud-value">
              {totalHeartsRemaining}/{totalHeartsMax}
            </span>
          </div>
          <div className="game-page__hud-hearts" aria-label="Total hearts status">
            {Array.from({ length: totalHeartsMax }, (_, i) => (
              <span
                key={i}
                className={
                  i < totalHeartsRemaining
                    ? 'game-page__hud-heart game-page__hud-heart--on'
                    : 'game-page__hud-heart game-page__hud-heart--off'
                }
                aria-hidden
              >
                ♥
              </span>
            ))}
          </div>
          <div className="game-page__hud-row">
            <span className="game-page__hud-label">Damaged</span>
            <span className="game-page__hud-value">{totalHeartsDamaged}</span>
          </div>
          <div className="game-page__hud-row">
            <span className="game-page__hud-label">Score</span>
            <span className="game-page__hud-value game-page__hud-value--score">{gameScore}</span>
          </div>
          <div className="game-page__hud-row">
            <span className="game-page__hud-label">Time</span>
            <span className="game-page__hud-value game-page__hud-value--time">
              {formatDuration(displayElapsedMs)}
            </span>
          </div>
        </aside>

        {isGameOver ? (
          <section className="game-page__gameover" role="dialog" aria-modal="true">
            <div className="game-page__gameover-card">
              <img
                src={kingDead}
                alt="Sad king defeated"
                className="game-page__gameover-img"
              />
              <h2 className="game-page__gameover-title">Game Over</h2>
              <p className="game-page__gameover-text">
                All hearts are damaged. Slow down, read each MCQ carefully, and answer before
                clicking check.
              </p>
              <button
                type="button"
                className="game-page__gameover-restart"
                onClick={restartGame}
              >
                Restart Game
              </button>
            </div>
          </section>
        ) : null}
        {allChallengesOver && !isGameOver ? (
          <section className="game-page__success" role="dialog" aria-modal="true">
            <div className="game-page__success-card">
              <img
                src={winBadgeImage}
                alt={`${winGrade} badge`}
                className="game-page__success-badge-img"
              />
              <img
                src={JUMP_FRAMES[successAnimFrame] || kingHappy}
                alt="Happy king celebrating"
                className="game-page__success-img"
              />
              <h2 className="game-page__success-title">Level Complete!</h2>
              <p className="game-page__success-text">
                Great work! All challenges are completed and you are ready for the next level.
              </p>
              <div className="game-page__success-stats">
                <div className="game-page__success-stat">
                  <span className="game-page__success-stat-label">Final Score</span>
                  <span className="game-page__success-stat-value">{gameScore}</span>
                </div>
                <div className="game-page__success-stat">
                  <span className="game-page__success-stat-label">Time Taken</span>
                  <span className="game-page__success-stat-value">
                    {formatDuration(displayElapsedMs)}
                  </span>
                </div>
              </div>
              <p className="game-page__success-advice">{motivationAdvice}</p>
            </div>
          </section>
        ) : null}

        <section
          className="game-page__science-placeholder"
          aria-label="Science question"
        >
          <div className="game-page__panel game-page__science-card">
            <p className="game-page__science-eyebrow">Bridge — science checkpoint</p>
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
        <section
          className="game-page__challenge5-placeholder"
          aria-label="Background five checkpoint question"
        >
          <div className="game-page__panel game-page__challenge5-card">
            <p className="game-page__science-eyebrow">Path — cloud checkpoint</p>
            <p className="game-page__science-q" id="challenge5-mock-q-title">
              {BACKGROUND5_MOCK_QUESTIONS[background5QuestionIndex]}
            </p>
            <fieldset
              className="game-page__science-fieldset"
              aria-labelledby="challenge5-mock-q-title"
            >
              <legend className="game-page__science-legend">Choose one answer</legend>
              <div className="game-page__science-options">
                {BACKGROUND5_MOCK_CHOICES.map((c) => (
                  <label
                    key={c.id}
                    className={
                      background5Choice === c.id
                        ? 'game-page__science-option game-page__science-option--selected'
                        : 'game-page__science-option'
                    }
                  >
                    <input
                      type="radio"
                      className="game-page__science-radio"
                      name="challenge5-mock-q"
                      value={c.id}
                      checked={background5Choice === c.id}
                      onChange={() => setBackground5Choice(c.id)}
                      disabled={background5Solved || background5Locked}
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
                onClick={handleBackground5Check}
                disabled={!background5Choice || background5Solved || background5Locked}
              >
                Check answer
              </button>
            </div>
            {background5Solved ? (
              <p className="game-page__science-feedback game-page__science-feedback--ok">
                Correct.
              </p>
            ) : null}
            {background5Locked && !background5Solved ? (
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
