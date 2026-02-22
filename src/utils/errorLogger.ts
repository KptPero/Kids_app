/**
 * Centralized error logging with error codes for the Kids' Learning PWA.
 *
 * Error code format: E<category><number>
 *   Category prefixes:
 *     AUD  – Audio / Web Audio API
 *     SPK  – Speech synthesis
 *     CNV  – Canvas / drawing
 *     GAM  – Game logic
 *     NAV  – Navigation / routing
 *     STR  – Storage (localStorage, caches)
 *     SVC  – Service worker
 *     RND  – Render / React component
 *     GEN  – General / uncategorized
 */

export const ErrorCode = {
  // ── Audio ──────────────────────────────────────────────
  AUD_CTX_CREATE:   'E-AUD-001',  // AudioContext creation failed
  AUD_CTX_RESUME:   'E-AUD-002',  // AudioContext.resume() failed
  AUD_OSC_START:    'E-AUD-003',  // OscillatorNode.start() failed
  AUD_OSC_STOP:     'E-AUD-004',  // OscillatorNode.stop() failed
  AUD_PLAY_NOTE:    'E-AUD-005',  // Note playback failed
  AUD_PLAY_SOUND:   'E-AUD-006',  // Sound effect playback failed
  AUD_BG_START:     'E-AUD-007',  // Background music start failed
  AUD_BG_STOP:      'E-AUD-008',  // Background music stop failed
  AUD_SOOTHING:     'E-AUD-009',  // Soothing ambient sound error
  AUD_LULLABY:      'E-AUD-010',  // Lullaby playback error

  // ── Speech ─────────────────────────────────────────────
  SPK_SYNTH:        'E-SPK-001',  // speechSynthesis.speak() failed
  SPK_CANCEL:       'E-SPK-002',  // speechSynthesis.cancel() failed
  SPK_VOICES:       'E-SPK-003',  // Voice loading failed
  SPK_PHONETIC:     'E-SPK-004',  // Phonetic sound playback failed
  SPK_UTTERANCE:    'E-SPK-005',  // SpeechSynthesisUtterance error event

  // ── Canvas ─────────────────────────────────────────────
  CNV_INIT:         'E-CNV-001',  // Canvas initialization failed
  CNV_DRAW:         'E-CNV-002',  // Drawing operation failed
  CNV_FLOOD_FILL:   'E-CNV-003',  // Flood fill failed
  CNV_VALIDATE:     'E-CNV-004',  // Tracing validation failed
  CNV_CLEAR:        'E-CNV-005',  // Canvas clear failed

  // ── Game ───────────────────────────────────────────────
  GAM_BUBBLE:       'E-GAM-001',  // Bubble game error
  GAM_MEMORY:       'E-GAM-002',  // Memory game error
  GAM_PHONICS:      'E-GAM-003',  // Phonics game error
  GAM_SPINNER:      'E-GAM-004',  // Fidget spinner error
  GAM_MATH:         'E-GAM-005',  // Math game error
  GAM_STORY:        'E-GAM-006',  // Story playback error
  GAM_RECORDING:    'E-GAM-007',  // Music recording/playback error

  // ── Storage ────────────────────────────────────────────
  STR_READ:         'E-STR-001',  // localStorage read failed
  STR_WRITE:        'E-STR-002',  // localStorage write failed
  STR_CACHE:        'E-STR-003',  // Cache API failed

  // ── Service worker ────────────────────────────────────
  SVC_REGISTER:     'E-SVC-001',  // SW registration failed
  SVC_INSTALL:      'E-SVC-002',  // SW install event failed
  SVC_FETCH:        'E-SVC-003',  // SW fetch handler failed

  // ── Render ─────────────────────────────────────────────
  RND_BOUNDARY:     'E-RND-001',  // React ErrorBoundary caught
  RND_MOUNT:        'E-RND-002',  // Component mount error
  RND_UPDATE:       'E-RND-003',  // Component update error

  // ── General ────────────────────────────────────────────
  GEN_UNKNOWN:      'E-GEN-001',  // Uncategorized error
} as const

export type ErrorCodeValue = typeof ErrorCode[keyof typeof ErrorCode]

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO  = 'INFO',
  WARN  = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  code: ErrorCodeValue
  message: string
  detail?: string
  component?: string
}

const MAX_LOG_ENTRIES = 200
const STORAGE_KEY = 'app_error_log'

/**
 * Retrieve persisted log entries (most-recent-first).
 */
export function getLogEntries(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Clear all persisted log entries.
 */
export function clearLogEntries(): void {
  try { localStorage.removeItem(STORAGE_KEY) } catch {}
}

function persist(entry: LogEntry) {
  try {
    const entries = getLogEntries()
    entries.unshift(entry)
    if (entries.length > MAX_LOG_ENTRIES) entries.length = MAX_LOG_ENTRIES
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage full or unavailable – silently drop
  }
}

/**
 * Core logging function.
 */
function log(
  level: LogLevel,
  code: ErrorCodeValue,
  message: string,
  extra?: { detail?: string; component?: string; error?: unknown }
) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    code,
    message,
    detail: extra?.detail ?? (extra?.error instanceof Error ? extra.error.message : undefined),
    component: extra?.component,
  }

  // Console output
  const tag = `[${code}]`
  switch (level) {
    case LogLevel.ERROR:
      console.error(tag, message, extra?.error ?? extra?.detail ?? '')
      break
    case LogLevel.WARN:
      console.warn(tag, message, extra?.detail ?? '')
      break
    case LogLevel.INFO:
      console.info(tag, message, extra?.detail ?? '')
      break
    case LogLevel.DEBUG:
      console.debug(tag, message, extra?.detail ?? '')
      break
  }

  // Persist WARN and ERROR to localStorage
  if (level === LogLevel.WARN || level === LogLevel.ERROR) {
    persist(entry)
  }
}

// ── Public helpers ───────────────────────────────────────

export function logError(
  code: ErrorCodeValue,
  message: string,
  extra?: { detail?: string; component?: string; error?: unknown }
) {
  log(LogLevel.ERROR, code, message, extra)
}

export function logWarn(
  code: ErrorCodeValue,
  message: string,
  extra?: { detail?: string; component?: string; error?: unknown }
) {
  log(LogLevel.WARN, code, message, extra)
}

export function logInfo(
  code: ErrorCodeValue,
  message: string,
  extra?: { detail?: string; component?: string; error?: unknown }
) {
  log(LogLevel.INFO, code, message, extra)
}

export function logDebug(
  code: ErrorCodeValue,
  message: string,
  extra?: { detail?: string; component?: string; error?: unknown }
) {
  log(LogLevel.DEBUG, code, message, extra)
}

// ── Global unhandled-error listeners ─────────────────────

if (typeof window !== 'undefined') {
  window.addEventListener('error', (ev) => {
    logError(ErrorCode.GEN_UNKNOWN, 'Unhandled error', {
      detail: ev.message,
      error: ev.error,
    })
  })

  window.addEventListener('unhandledrejection', (ev) => {
    logError(ErrorCode.GEN_UNKNOWN, 'Unhandled promise rejection', {
      detail: String(ev.reason),
      error: ev.reason,
    })
  })
}
