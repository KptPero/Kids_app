import React, { useState, useEffect, useRef, useCallback } from 'react'
import { playSound, speakText } from '../utils/sounds'

interface FallingItem {
  id: number
  x: number
  y: number
  emoji: string
  speed: number
  size: number
  points: number
}

const ITEMS = [
  { emoji: '⭐', points: 1 },
  { emoji: '🌟', points: 2 },
  { emoji: '💫', points: 1 },
  { emoji: '✨', points: 1 },
  { emoji: '🍎', points: 3 },
  { emoji: '🍪', points: 3 },
  { emoji: '🧁', points: 5 },
  { emoji: '🌈', points: 5 },
]

export default function CatchStars({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [score, setScore] = useState(0)
  const [items, setItems] = useState<FallingItem[]>([])
  const [timeLeft, setTimeLeft] = useState(30)
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'done'>('ready')
  const [catchAnim, setCatchAnim] = useState<{ x: number; y: number; emoji: string } | null>(null)
  const [highScore, setHighScore] = useState(0)
  const nextId = useRef(0)
  const frameRef = useRef<number>(0)
  const lastSpawn = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const gameWidth = 360
  const gameHeight = 500

  const spawn = useCallback(() => {
    const template = ITEMS[Math.floor(Math.random() * ITEMS.length)]
    const item: FallingItem = {
      id: nextId.current++,
      x: 20 + Math.random() * (gameWidth - 60),
      y: -40,
      emoji: template.emoji,
      speed: 1.5 + Math.random() * 2,
      size: 32 + Math.random() * 14,
      points: template.points,
    }
    setItems(prev => [...prev, item])
  }, [])

  useEffect(() => {
    if (gameState !== 'playing') return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          setGameState('done')
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameState])

  useEffect(() => {
    if (gameState === 'done') {
      playSound('tada')
      setScore(s => {
        if (s > highScore) {
          setHighScore(s)
          speakText(`Amazing! New high score! ${s} points!`)
        } else {
          speakText(`Great catching! You got ${s} points!`)
        }
        return s
      })
    }
  }, [gameState])

  useEffect(() => {
    if (gameState !== 'playing') return

    let running = true
    const loop = (time: number) => {
      if (!running) return

      // Spawn items
      if (time - lastSpawn.current > 600) {
        spawn()
        lastSpawn.current = time
      }

      // Move items
      setItems(prev => prev
        .map(item => ({ ...item, y: item.y + item.speed }))
        .filter(item => item.y < gameHeight + 50)
      )

      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(frameRef.current)
    }
  }, [gameState, spawn])

  function catchItem(item: FallingItem, e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    e.stopPropagation()
    playSound('click')
    setScore(s => s + item.points)
    setItems(prev => prev.filter(i => i.id !== item.id))
    setCatchAnim({ x: item.x, y: item.y, emoji: `+${item.points}` })
    setTimeout(() => setCatchAnim(null), 400)
  }

  function startGame() {
    setScore(0)
    setTimeLeft(30)
    setItems([])
    nextId.current = 0
    lastSpawn.current = 0
    setGameState('playing')
    playSound('click')
    speakText('Catch the stars!')
  }

  if (gameState === 'ready') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B2838 50%, #0D1B2A 100%)', minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 70, marginBottom: 10 }}>⭐</div>
          <h2 style={{ color: '#FFD54F', fontSize: 28, margin: '0 0 10px 0' }}>Catch the Stars!</h2>
          <p style={{ color: '#B0BEC5', fontSize: 15, marginBottom: 25 }}>Tap stars and treats as they fall!</p>
          <button onClick={startGame} style={{
            background: 'linear-gradient(135deg, #FFD54F, #FF8F00)', color: '#333',
            border: 'none', borderRadius: 30, padding: '18px 40px', fontSize: 20, fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(255,213,79,0.4)'
          }}>▶ Start!</button>
          <br />
          <button onClick={() => { playSound('click'); onBack() }} style={{
            marginTop: 15, background: 'transparent', color: '#78909C', border: '2px solid #78909C',
            borderRadius: 25, padding: '12px 28px', fontSize: 15, cursor: 'pointer'
          }}>← Back</button>
        </div>
      </div>
    )
  }

  if (gameState === 'done') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B2838 50%, #0D1B2A 100%)', minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 30, padding: 35, textAlign: 'center', maxWidth: 350, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 55, marginBottom: 8 }}>🎉</div>
          <h2 style={{ color: '#FFD54F', margin: '0 0 10px 0', fontSize: 24 }}>Time's Up!</h2>
          <div style={{ fontSize: 48, color: '#FFF', fontWeight: 'bold', marginBottom: 5 }}>{score}</div>
          <div style={{ color: '#B0BEC5', fontSize: 15, marginBottom: 15 }}>⭐ {score >= highScore ? 'New ' : ''}High Score: {Math.max(score, highScore)}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={startGame} style={{ background: 'linear-gradient(135deg, #FFD54F, #FF8F00)', color: '#333', border: 'none', borderRadius: 25, padding: '14px 28px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>🔄 Again</button>
            <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 25, padding: '14px 28px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>🏠 Home</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1B2838 60%, #263238 100%)', minHeight: '100vh', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: gameWidth, padding: '12px 15px', boxSizing: 'border-box' }}>
        <button onClick={() => { setGameState('ready'); playSound('click') }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 15, padding: '8px 14px', color: '#B0BEC5', fontSize: 14, cursor: 'pointer' }}>← Back</button>
        <div style={{ color: '#FFD54F', fontSize: 20, fontWeight: 'bold' }}>⭐ {score}</div>
        <div style={{ color: timeLeft <= 5 ? '#EF5350' : '#B0BEC5', fontSize: 18, fontWeight: 'bold' }}>⏱ {timeLeft}s</div>
      </div>

      {/* Game area */}
      <div ref={containerRef} style={{
        width: gameWidth, height: gameHeight, position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 0%, #1a237e22, transparent)',
        borderRadius: 20, border: '2px solid rgba(255,255,255,0.05)'
      }}>
        {/* Twinkle stars background */}
        {[...Array(15)].map((_, i) => (
          <div key={`bg-${i}`} style={{
            position: 'absolute',
            left: `${(i * 23 + 7) % 100}%`, top: `${(i * 17 + 11) % 100}%`,
            width: 3, height: 3, borderRadius: '50%', background: '#fff',
            opacity: 0.3 + (i % 3) * 0.2
          }} />
        ))}

        {/* Falling items */}
        {items.map(item => (
          <div key={item.id}
            onMouseDown={e => catchItem(item, e)}
            onTouchStart={e => catchItem(item, e)}
            style={{
              position: 'absolute', left: item.x, top: item.y,
              fontSize: item.size, cursor: 'pointer', userSelect: 'none',
              WebkitUserSelect: 'none', touchAction: 'none',
              filter: 'drop-shadow(0 2px 6px rgba(255,215,0,0.5))',
              transition: 'transform 0.1s',
            }}
          >{item.emoji}</div>
        ))}

        {/* Catch animation */}
        {catchAnim && (
          <div style={{
            position: 'absolute', left: catchAnim.x, top: catchAnim.y,
            color: '#FFD54F', fontSize: 22, fontWeight: 'bold',
            animation: 'floatUp 0.4s ease-out forwards', pointerEvents: 'none'
          }}>{catchAnim.emoji}</div>
        )}

        {/* Ground */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
          background: 'linear-gradient(0deg, #1B5E20, #2E7D32)', borderRadius: '0 0 18px 18px'
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8,
            background: 'linear-gradient(0deg, #4CAF50, transparent)'
          }} />
        </div>
      </div>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-40px) scale(1.3); }
        }
      `}</style>
    </div>
  )
}
