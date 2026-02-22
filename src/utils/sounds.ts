import { logError, logWarn, logInfo, ErrorCode } from './errorLogger'

let audioContext: AudioContext | null = null
let backgroundOsc: OscillatorNode | null = null
let isMuted = false
try {
  isMuted = typeof window !== 'undefined' && localStorage.getItem('muted') === 'true'
} catch (e) {
  logWarn(ErrorCode.STR_READ, 'Failed to read mute state from localStorage', { error: e })
}
let ttsRate = 0.85
let ttsPitch = 1.2
let cachedVoices: SpeechSynthesisVoice[] = []

// Pre-load voices (they load async on many browsers)
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  try {
    cachedVoices = window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedVoices = window.speechSynthesis.getVoices()
    })
  } catch (e) {
    logWarn(ErrorCode.SPK_VOICES, 'Failed to pre-load speech voices', { error: e })
  }
}

/** Create / resume AudioContext. Returns a Promise that resolves with the running context. */
async function ensureAudioContext(): Promise<AudioContext | null> {
  if (!audioContext && typeof window !== 'undefined') {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (e) {
      logError(ErrorCode.AUD_CTX_CREATE, 'Failed to create AudioContext', { error: e })
      return null
    }
  }
  // iOS Safari requires resume() after user gesture – actually await it
  if (audioContext && audioContext.state === 'suspended') {
    try {
      await audioContext.resume()
    } catch (e) {
      logWarn(ErrorCode.AUD_CTX_RESUME, 'AudioContext.resume() failed', { error: e })
    }
  }
  return audioContext
}

/** Synchronous getter (for callers that already ensured audio is running). */
function getAudioContext() {
  if (!audioContext && typeof window !== 'undefined') {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (e) {
      logError(ErrorCode.AUD_CTX_CREATE, 'Failed to create AudioContext', { error: e })
      return null
    }
  }
  if (audioContext && audioContext.state === 'suspended') {
    audioContext.resume().catch((e: unknown) => {
      logWarn(ErrorCode.AUD_CTX_RESUME, 'AudioContext.resume() failed', { error: e })
    })
  }
  return audioContext
}

// ── Auto-init AudioContext on first user gesture ──────────
// This ensures the context is resumed before any game code tries to play sound.
if (typeof window !== 'undefined') {
  const _initAudio = () => {
    ensureAudioContext()
    window.removeEventListener('pointerdown', _initAudio, true)
    window.removeEventListener('keydown', _initAudio, true)
  }
  window.addEventListener('pointerdown', _initAudio, true)
  window.addEventListener('keydown', _initAudio, true)
}

function selectNaturalVoice() {
  if (!('speechSynthesis' in window)) return null
  
  // Use cached voices (handles async loading)
  const voices = cachedVoices.length > 0 ? cachedVoices : window.speechSynthesis.getVoices()
  if (voices.length === 0) return null
  // Prioritize natural-sounding voices for story narration
  let preferred = voices.find(v => v.name.includes('Google UK English Female')) ||
                  voices.find(v => v.name.includes('Victoria')) ||
                  voices.find(v => v.name.includes('Zira')) ||
                  voices.find(v => v.name.includes('Google UK English')) ||
                  voices.find(v => v.name.includes('Google US English Female')) ||
                  voices.find(v => v.name.includes('Google Neural')) ||
                  voices[0]
  return preferred || null
}

export function setTTSParams(rate: number, pitch: number) {
  ttsRate = rate
  ttsPitch = pitch
}

/**
 * High-quality humanized speech synthesis
 * Improved voice characteristics for professional narration
 * @param onEnd - optional callback when speech finishes
 */
export function speakText(text: string, onEnd?: (() => void) | number, pitch?: number) {
  if (!('speechSynthesis' in window) || isMuted) return
  
  try { window.speechSynthesis.cancel() } catch (e) {
    logWarn(ErrorCode.SPK_CANCEL, 'speechSynthesis.cancel() failed', { error: e })
  }
  const u = new SpeechSynthesisUtterance(text)
  
  // Support both (text, callback) and (text, rate, pitch) signatures
  if (typeof onEnd === 'function') {
    u.rate = ttsRate
    u.pitch = ttsPitch
    u.onend = onEnd
  } else {
    u.rate = onEnd ?? ttsRate
    u.pitch = pitch ?? ttsPitch
  }
  u.volume = 1
  u.lang = 'en-US'
  
  const voice = selectNaturalVoice()
  if (voice) {
    u.voice = voice
  }
  
  // Chrome stops speech after ~15s; keepalive workaround
  let keepAlive: ReturnType<typeof setInterval> | null = null
  u.onstart = () => {
    keepAlive = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause()
        window.speechSynthesis.resume()
      }
    }, 10000)
  }
  const originalOnEnd = u.onend
  u.onend = (ev) => {
    if (keepAlive) clearInterval(keepAlive)
    if (typeof originalOnEnd === 'function') (originalOnEnd as (ev: SpeechSynthesisEvent) => void)(ev)
  }
  u.onerror = (ev) => {
    if (keepAlive) clearInterval(keepAlive)
    logError(ErrorCode.SPK_UTTERANCE, 'SpeechSynthesisUtterance error', { detail: (ev as any)?.error || 'unknown' })
  }
  
  try {
    window.speechSynthesis.speak(u)
  } catch (e) {
    logError(ErrorCode.SPK_SYNTH, 'speechSynthesis.speak() threw', { error: e })
  }
  return u
}

export function playPhoneticSound(letter: string) {
  if (isMuted || typeof window === 'undefined') return
  try {

  const letterUpper = letter.toUpperCase()
  
  // Real phonetic pronunciations using speech synthesis
  // Each maps to the actual sound the letter makes
  const phoneticSounds: Record<string, string> = {
    'A': 'aah',
    'B': 'buh',
    'C': 'kuh',
    'D': 'duh',
    'E': 'eh',
    'F': 'fff',
    'G': 'guh',
    'H': 'huh',
    'I': 'ih',
    'J': 'juh',
    'K': 'kuh',
    'L': 'lll',
    'M': 'mmm',
    'N': 'nnn',
    'O': 'awe',
    'P': 'puh',
    'Q': 'kwuh',
    'R': 'rrr',
    'S': 'sss',
    'T': 'tuh',
    'U': 'uh',
    'V': 'vvv',
    'W': 'wuh',
    'X': 'ks',
    'Y': 'yuh',
    'Z': 'zzz'
  }

  const sound = phoneticSounds[letterUpper]
  if (!sound) return

  // Use speech synthesis for real phonetic sounds
  speakText(sound, 0.7, 1.1)
  } catch (e) {
    logError(ErrorCode.SPK_PHONETIC, `Phonetic sound failed for letter "${letter}"`, { error: e })
  }
}

export function playSound(type: 'click' | 'success' | 'tada') {
  if (isMuted || typeof window === 'undefined') return
  
  // Use async path to guarantee context is resumed before scheduling
  ensureAudioContext().then(ctx => {
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      
      osc.connect(gain)
      gain.connect(ctx.destination)
      
      let freq = 440
      let duration = 0.1

      switch(type) {
        case 'click':
          freq = 600
          duration = 0.08
          gain.gain.setValueAtTime(0.15, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
          break
        case 'success':
          freq = 800
          duration = 0.2
          gain.gain.setValueAtTime(0.2, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
          break
        case 'tada':
          freq = 1000
          duration = 0.3
          gain.gain.setValueAtTime(0.25, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
          break
      }

      osc.frequency.value = freq
      osc.start(now)
      osc.stop(now + duration)
    } catch (e) {
      logError(ErrorCode.AUD_PLAY_SOUND, `playSound("${type}") failed`, { error: e })
    }
  })
}

export function startBackgroundMusic() {
  if (typeof window === 'undefined' || isMuted || backgroundOsc) return

  ensureAudioContext().then(ctx => {
    if (!ctx || backgroundOsc) return
    try {
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      
      oscillator.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      
      oscillator.type = 'sine'
      oscillator.frequency.value = 400
      gain.gain.setValueAtTime(0.05, ctx.currentTime)
      
      oscillator.start()
      backgroundOsc = oscillator
      logInfo(ErrorCode.AUD_BG_START, 'Background music started')
    } catch (e) {
      logWarn(ErrorCode.AUD_BG_START, 'Background music requires user interaction first', { error: e })
    }
  })
}

export function stopBackgroundMusic() {
  if (backgroundOsc) {
    try { backgroundOsc.stop() } catch (e) {
      logWarn(ErrorCode.AUD_BG_STOP, 'backgroundOsc.stop() failed', { error: e })
    }
    backgroundOsc = null
  }
}

export function toggleMute() {
  isMuted = !isMuted
  try {
    localStorage.setItem('muted', String(isMuted))
  } catch (e) {
    logWarn(ErrorCode.STR_WRITE, 'Failed to persist mute state', { error: e })
  }
  if (isMuted) {
    try { window.speechSynthesis?.cancel() } catch (e) {
      logWarn(ErrorCode.SPK_CANCEL, 'speechSynthesis.cancel() failed on mute', { error: e })
    }
    stopBackgroundMusic()
  }
  return isMuted
}

export function getMuteState() {
  return isMuted
}
