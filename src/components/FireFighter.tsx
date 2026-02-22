import React, { useState, useEffect, useRef, useCallback } from 'react'
import { playSound } from '../utils/sounds'

interface Flame {
  id: number
  x: number
  y: number
  size: number
  health: number
  maxHealth: number
  emoji: string
}

interface Splash {
  id: number
  x: number
  y: number
}

const FLAME_EMOJIS = ['🔥', '🔥', '🔥', '🔥', '🔥', '🔥']
const BUILDING_EMOJIS = ['🏠', '🏢', '🏫', '🏪', '🏥', '🏦']

export default function FireFighter({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [flames, setFlames] = useState<Flame[]>([])
  const [splashes, setSplashes] = useState<Splash[]>([])
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [lives, setLives] = useState(3)
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'gameover'>('menu')
  const [spraying, setSpraying] = useState(false)
  const [hosePos, setHosePos] = useState({ x: 0, y: 0 })
  const [flamePut, setFlamePut] = useState(0)
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [building] = useState(() => BUILDING_EMOJIS[Math.floor(Math.random() * BUILDING_EMOJIS.length)])

  const gameRef = useRef<HTMLDivElement>(null)
  const flameIdRef = useRef(0)
  const splashIdRef = useRef(0)
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function safeTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  const cleanup = useCallback(() => {
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    timersRef.current.forEach(t => clearTimeout(t))
    timersRef.current = []
    spawnTimerRef.current = null
    gameLoopRef.current = null
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  function spawnFlame() {
    const gameEl = gameRef.current
    if (!gameEl) return
    const rect = gameEl.getBoundingClientRect()
    const margin = 60
    const x = margin + Math.random() * (rect.width - margin * 2)
    const y = 100 + Math.random() * (rect.height - 200)
    const health = 3 + level
    const newFlame: Flame = {
      id: ++flameIdRef.current,
      x,
      y,
      size: 30 + Math.random() * 20,
      health,
      maxHealth: health,
      emoji: FLAME_EMOJIS[Math.floor(Math.random() * FLAME_EMOJIS.length)]
    }
    setFlames(prev => [...prev, newFlame])
  }

  function startGame() {
    cleanup()
    playSound('success')
    setFlames([])
    setSplashes([])
    setScore(0)
    setLevel(1)
    setLives(3)
    setFlamePut(0)
    setCombo(0)
    setGameState('playing')

    // Spawn initial flames
    safeTimeout(() => {
      for (let i = 0; i < 3; i++) {
        safeTimeout(() => spawnFlame(), i * 300)
      }
    }, 500)

    // Spawn new flames periodically
    spawnTimerRef.current = setInterval(() => {
      setFlames(prev => {
        if (prev.length < 8 + level) {
          safeTimeout(() => spawnFlame(), 0)
        }
        return prev
      })
    }, 2500 - Math.min(level * 200, 1500))

    // Game loop: flames that linger too long cause damage
    gameLoopRef.current = setInterval(() => {
      setFlames(prev => {
        const tooMany = prev.length >= 10
        if (tooMany) {
          setLives(l => {
            const nl = l - 1
            if (nl <= 0) {
              safeTimeout(() => setGameState('gameover'), 100)
            }
            return nl
          })
        }
        return prev
      })
    }, 5000)
  }

  // Level up every 10 flames extinguished
  useEffect(() => {
    if (gameState === 'playing' && flamePut > 0 && flamePut % 10 === 0) {
      const newLevel = Math.floor(flamePut / 10) + 1
      setLevel(newLevel)
      playSound('tada')
    }
  }, [flamePut, gameState])

  function getRelativePos(e: React.TouchEvent | React.MouseEvent) {
    const gameEl = gameRef.current
    if (!gameEl) return { x: 0, y: 0 }
    const rect = gameEl.getBoundingClientRect()
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return { x: clientX - rect.left, y: clientY - rect.top }
  }

  function handleSprayStart(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    setSpraying(true)
    const pos = getRelativePos(e)
    setHosePos(pos)
    sprayAt(pos)
  }

  function handleSprayMove(e: React.TouchEvent | React.MouseEvent) {
    if (!spraying) return
    e.preventDefault()
    const pos = getRelativePos(e)
    setHosePos(pos)
    sprayAt(pos)
  }

  function handleSprayEnd() {
    setSpraying(false)
  }

  function sprayAt(pos: { x: number; y: number }) {
    // Add splash effect
    setSplashes(prev => [...prev, { id: ++splashIdRef.current, x: pos.x, y: pos.y }])
    safeTimeout(() => {
      setSplashes(prev => prev.filter(s => s.id !== splashIdRef.current))
    }, 400)

    // Check if hitting any flames (generous hit radius for kids)
    const hitRadius = 55
    setFlames(prev => {
      let hit = false
      const updated = prev.map(f => {
        const dist = Math.hypot(f.x - pos.x, f.y - pos.y)
        if (dist < hitRadius) {
          hit = true
          return { ...f, health: f.health - 1 }
        }
        return f
      })

      if (hit) {
        playSound('click')
      }

      // Remove extinguished flames
      const remaining = updated.filter(f => f.health > 0)
      const extinguished = updated.length - remaining.length
      if (extinguished > 0) {
        playSound('tada')
        setScore(s => s + extinguished * 10 * (1 + combo))
        setFlamePut(fp => fp + extinguished)
        setCombo(c => c + extinguished)
        setShowCombo(true)
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
        comboTimerRef.current = setTimeout(() => {
          setCombo(0)
          setShowCombo(false)
        }, 2000)
      }
      return remaining
    })
  }

  // Menu screen
  if (gameState === 'menu') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #FFB347 50%, #FFF176 100%)',
        minHeight: '100vh', padding: 20, position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 30, left: 20, fontSize: 55, opacity: 0.1 }}>🚒</div>
        <div style={{ position: 'absolute', bottom: 60, right: 30, fontSize: 50, opacity: 0.1 }}>🧑‍🚒</div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, position: 'relative', zIndex: 2 }}>
          <button onClick={() => { playSound('click'); onBack() }} style={{
            background: 'rgba(255,255,255,0.95)', border: '3px solid #FF6B35',
            borderRadius: 25, padding: '12px 20px', cursor: 'pointer',
            fontSize: 16, fontWeight: 'bold', color: '#FF6B35'
          }}>← Back</button>
          {pet && <div style={{ fontSize: 32 }}>{pet}</div>}
        </div>

        <div style={{ maxWidth: 450, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <div style={{
            background: 'rgba(255,255,255,0.95)', borderRadius: 30, padding: 30,
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: 70, marginBottom: 10 }}>🚒</div>
            <h1 style={{ fontSize: 32, color: '#FF6B35', margin: '0 0 10px 0' }}>Fire Fighter!</h1>
            <p style={{ fontSize: 16, color: '#666', marginBottom: 10 }}>
              Spray water on the flames to put them out!
            </p>
            <div style={{ fontSize: 14, color: '#999', marginBottom: 20 }}>
              Touch & drag to aim your hose 💦
            </div>

            <div style={{ display: 'flex', gap: 15, justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30 }}>🔥</div>
                <div style={{ fontSize: 12, color: '#888' }}>Fires</div>
              </div>
              <div style={{ fontSize: 24, color: '#ccc', alignSelf: 'center' }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30 }}>💦</div>
                <div style={{ fontSize: 12, color: '#888' }}>Spray</div>
              </div>
              <div style={{ fontSize: 24, color: '#ccc', alignSelf: 'center' }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30 }}>⭐</div>
                <div style={{ fontSize: 12, color: '#888' }}>Score!</div>
              </div>
            </div>

            <button onClick={startGame} style={{
              background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
              color: '#fff', border: 'none', borderRadius: 25, padding: '18px 50px',
              fontSize: 20, fontWeight: 'bold', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(255,107,53,0.4)'
            }}>
              🧑‍🚒 Start Fighting Fires!
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Game over screen
  if (gameState === 'gameover') {
    const stars = score >= 200 ? 3 : score >= 100 ? 2 : 1
    return (
      <div style={{
        background: 'linear-gradient(135deg, #FF6B35 0%, #FFB347 50%, #FFF176 100%)',
        minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.95)', borderRadius: 30, padding: 40,
          textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', maxWidth: 400
        }}>
          <div style={{ fontSize: 60, marginBottom: 10 }}>🚒</div>
          <h2 style={{ color: '#FF6B35', margin: '0 0 10px 0' }}>Great Job, Hero!</h2>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{'⭐'.repeat(stars)}</div>
          <p style={{ fontSize: 20, fontWeight: 'bold', color: '#333' }}>Score: {score}</p>
          <p style={{ fontSize: 16, color: '#666' }}>Fires extinguished: {flamePut}</p>
          <p style={{ fontSize: 16, color: '#666' }}>Level reached: {level}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button onClick={startGame} style={{
              background: 'linear-gradient(135deg, #FF6B35, #FF8C42)',
              color: '#fff', border: 'none', borderRadius: 25, padding: '15px 30px',
              fontSize: 16, fontWeight: 'bold', cursor: 'pointer'
            }}>🔄 Play Again</button>
            <button onClick={() => { playSound('click'); setGameState('menu') }} style={{
              background: 'linear-gradient(135deg, #999, #bbb)',
              color: '#fff', border: 'none', borderRadius: 25, padding: '15px 30px',
              fontSize: 16, fontWeight: 'bold', cursor: 'pointer'
            }}>🏠 Menu</button>
          </div>
        </div>
      </div>
    )
  }

  // Playing screen
  return (
    <div
      ref={gameRef}
      onTouchStart={handleSprayStart}
      onTouchMove={handleSprayMove}
      onTouchEnd={handleSprayEnd}
      onMouseDown={handleSprayStart}
      onMouseMove={handleSprayMove}
      onMouseUp={handleSprayEnd}
      onMouseLeave={handleSprayEnd}
      style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #533483 100%)',
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        touchAction: 'none', cursor: spraying ? 'none' : 'crosshair'
      }}
    >
      {/* HUD */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 15px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(0,0,0,0.4)', zIndex: 10
      }}>
        <button onClick={() => { playSound('click'); cleanup(); setGameState('menu') }} style={{
          background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)',
          borderRadius: 20, padding: '8px 16px', cursor: 'pointer',
          fontSize: 14, fontWeight: 'bold', color: '#fff'
        }}>← Quit</button>
        <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
          <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 16 }}>⭐ {score}</span>
          <span style={{ color: '#FF6B35', fontWeight: 'bold', fontSize: 16 }}>Lv.{level}</span>
          <span style={{ color: '#FF4444', fontWeight: 'bold', fontSize: 16 }}>
            {'❤️'.repeat(Math.max(0, lives))}
          </span>
        </div>
      </div>

      {/* Buildings at bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', justifyContent: 'space-around', padding: '0 10px',
        fontSize: 50, opacity: 0.4
      }}>
        {[building, '🏠', '🏢', building].map((b, i) => (
          <span key={i}>{b}</span>
        ))}
      </div>

      {/* Flames */}
      {flames.map(flame => {
        const healthPct = flame.health / flame.maxHealth
        const flicker = healthPct < 0.5
        return (
          <div
            key={flame.id}
            style={{
              position: 'absolute',
              left: flame.x - flame.size / 2,
              top: flame.y - flame.size / 2,
              fontSize: flame.size * (0.8 + healthPct * 0.4),
              transition: 'font-size 0.2s',
              filter: flicker ? 'brightness(0.7)' : 'none',
              animation: 'flameWiggle 0.3s ease-in-out infinite alternate',
              pointerEvents: 'none'
            }}
          >
            {flame.emoji}
            {/* Health bar */}
            <div style={{
              position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)',
              width: 30, height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2
            }}>
              <div style={{
                width: `${healthPct * 100}%`, height: '100%',
                background: healthPct > 0.5 ? '#FF6B35' : '#FF4444',
                borderRadius: 2, transition: 'width 0.2s'
              }} />
            </div>
          </div>
        )
      })}

      {/* Water splashes */}
      {splashes.map(s => (
        <div key={s.id} style={{
          position: 'absolute',
          left: s.x - 15,
          top: s.y - 15,
          fontSize: 28,
          pointerEvents: 'none',
          animation: 'splashFade 0.4s ease-out forwards'
        }}>
          💦
        </div>
      ))}

      {/* Hose cursor when spraying */}
      {spraying && (
        <div style={{
          position: 'absolute',
          left: hosePos.x - 20,
          top: hosePos.y - 20,
          fontSize: 36,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 0 8px rgba(100,180,255,0.6))',
          zIndex: 5
        }}>
          🚿
        </div>
      )}

      {/* Combo indicator */}
      {showCombo && combo > 1 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: 28, fontWeight: 'bold', color: '#FFD700',
          textShadow: '0 0 10px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.5)',
          pointerEvents: 'none', zIndex: 10,
          animation: 'comboPopIn 0.3s ease-out'
        }}>
          🔥 x{combo} COMBO! 🔥
        </div>
      )}

      {/* Flames extinguished counter */}
      <div style={{
        position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
        color: '#fff', fontSize: 14, opacity: 0.6, pointerEvents: 'none', zIndex: 5
      }}>
        🧯 {flamePut} fires put out
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes flameWiggle {
          0% { transform: rotate(-5deg) scale(1); }
          100% { transform: rotate(5deg) scale(1.05); }
        }
        @keyframes splashFade {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.8); }
        }
        @keyframes comboPopIn {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
          50% { transform: translate(-50%, -50%) scale(1.2); }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
