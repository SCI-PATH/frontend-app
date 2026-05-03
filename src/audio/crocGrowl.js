/**
 * Short low growl using Web Audio (no asset file). Replace with HTMLAudioElement + MP3 if you add one.
 */
export function playCrocGrowl(getAudioContext) {
  const ctx = typeof getAudioContext === 'function' ? getAudioContext() : null
  if (!ctx) return

  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {})
  }

  const dur = 0.38
  const n = Math.floor(ctx.sampleRate * dur)
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let brown = 0
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1
    brown = (brown + 0.04 * white) / 1.04
    const t = i / n
    const env = Math.pow(1 - t, 1.4)
    const pulse = 0.55 + 0.45 * Math.sin(i * 0.085)
    data[i] = brown * env * pulse * 0.42
  }

  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(420, ctx.currentTime)
  filter.Q.value = 0.7
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.85, ctx.currentTime)

  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  src.start()
}

/** Short impact thud (punch / hit). */
export function playHitThud(getAudioContext) {
  const ctx = typeof getAudioContext === 'function' ? getAudioContext() : null
  if (!ctx) return
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {})
  }

  const dur = 0.12
  const n = Math.floor(ctx.sampleRate * dur)
  const buffer = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < n; i++) {
    const t = i / n
    const env = Math.pow(1 - t, 3.5)
    const hit = (Math.random() * 2 - 1) * 0.4
    data[i] = hit * env
  }
  const src = ctx.createBufferSource()
  src.buffer = buffer
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(180, ctx.currentTime)
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.55, ctx.currentTime)
  src.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  src.start()
}
