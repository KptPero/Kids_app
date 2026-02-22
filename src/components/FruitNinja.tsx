import React, { useState, useEffect, useRef, useCallback } from 'react'
import { playSound, speakText } from '../utils/sounds'
import { backBtnDark } from '../utils/sharedStyles'
import { useSafeTimeout } from '../hooks/useSafeTimeout'

interface Fruit {
  id: number
  emoji: string
  name: string
  x: number
  y: number
  vx: number
  vy: number
  size: number
  sliced: boolean
  points: number
}

interface SliceTrail {
  id: number
  x: number
  y: number
  age: number
}

interface SplashEffect {
  id: number
  x: number
  y: number
  emoji: string
  color: string
}

const FRUITS = [
  { emoji: '🍎', name: 'Apple', points: 1, color: '#E53935' },
  { emoji: '🍊', name: 'Orange', points: 1, color: '#FF9800' },
  { emoji: '🍋', name: 'Lemon', points: 1, color: '#FDD835' },
  { emoji: '🍉', name: 'Watermelon', points: 2, color: '#4CAF50' },
  { emoji: '🍇', name: 'Grapes', points: 2, color: '#7B1FA2' },
  { emoji: '🍓', name: 'Strawberry', points: 1, color: '#D32F2F' },
  { emoji: '🍑', name: 'Peach', points: 2, color: '#FFAB91' },
  { emoji: '🥝', name: 'Kiwi', points: 2, color: '#689F38' },
  { emoji: '🍍', name: 'Pineapple', points: 3, color: '#F9A825' },
  { emoji: '🥭', name: 'Mango', points: 3, color: '#FF6F00' },
  { emoji: '🫐', name: 'Blueberry', points: 3, color: '#283593' },
  { emoji: '🍒', name: 'Cherry', points: 2, color: '#C62828' },
]

interface LevelDef {
  name: string
  icon: string
  target: number
  duration: number
  wavePause: [number, number] // min/max pause between waves (ms)
  waveSize: [number, number]  // min/max fruits per wave
  desc: string
}

const LEVELS: LevelDef[] = [
  { name: 'Fruit Stand', icon: '🍎', target: 15, duration: 35, wavePause: [1800, 2800], waveSize: [2, 3], desc: 'Slice 15 fruits!' },
  { name: 'Fruit Market', icon: '🍊', target: 25, duration: 35, wavePause: [1500, 2400], waveSize: [2, 4], desc: 'Faster fruits!' },
  { name: 'Fruit Storm', icon: '🍉', target: 40, duration: 40, wavePause: [1200, 2000], waveSize: [3, 5], desc: 'A storm of fruit!' },
  { name: 'Fruit Frenzy', icon: '🍇', target: 55, duration: 40, wavePause: [1000, 1600], waveSize: [3, 6], desc: 'Frenzy mode!' },
  { name: 'Fruit Master', icon: '👑', target: 70, duration: 45, wavePause: [800, 1400], waveSize: [4, 7], desc: 'Ultimate challenge!' },
]

const GRAVITY = 0.09

export default function FruitNinja({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [screen, setScreen] = useState<'select' | 'play' | 'complete' | 'timeup'>('select')
  const [levelIdx, setLevelIdx] = useState(0)
  const [unlocked, setUnlocked] = useState([true, false, false, false, false])
  const [fruits, setFruits] = useState<Fruit[]>([])
  const [score, setScore] = useState(0)
  const [sliced, setSliced] = useState(0)
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [stars, setStars] = useState(0)
  const [bestScore, setBestScore] = useState(0)
  const [trail, setTrail] = useState<SliceTrail[]>([])
  const [splashes, setSplashes] = useState<SplashEffect[]>([])
  const [swiping, setSwiping] = useState(false)

  const fruitsRef = useRef<Fruit[]>([])
  const frameRef = useRef<number>(0)
  const nextId = useRef(0)
  const splashId = useRef(0)
  const trailId = useRef(0)
  const spawnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scoreRef = useRef(0)
  const slicedRef = useRef(0)
  const gameRef = useRef<HTMLDivElement>(null)

  const [gameWidth, setGameWidth] = useState(() => Math.min(400, typeof window !== 'undefined' ? window.innerWidth - 16 : 400))
  const [gameHeight, setGameHeight] = useState(() => Math.min(560, typeof window !== 'undefined' ? window.innerHeight - 100 : 560))

  useEffect(() => {
    const onResize = () => {
      setGameWidth(Math.min(400, window.innerWidth - 16))
      setGameHeight(Math.min(560, window.innerHeight - 100))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const safeTimeout = useSafeTimeout()

  useEffect(() => {
    return () => {
      cancelAnimationFrame(frameRef.current)
      if (spawnTimer.current) clearTimeout(spawnTimer.current)
      if (comboTimer.current) clearTimeout(comboTimer.current)
    }
  }, [])

  // Spawn patterns like real Fruit Ninja: fruits thrown up from bottom in bursts
  const spawnWave = useCallback((count: number) => {
    // Pick a launch zone: left third, center, or right third
    const zones = [
      { xMin: 0.05, xMax: 0.3 },   // left
      { xMin: 0.3, xMax: 0.7 },    // center
      { xMin: 0.7, xMax: 0.95 },   // right
    ]
    // Use 1-2 zones per wave for clustering
    const zoneCount = count <= 2 ? 1 : (Math.random() > 0.5 ? 2 : 1)
    const chosenZones = [...zones].sort(() => Math.random() - 0.5).slice(0, zoneCount)

    for (let i = 0; i < count; i++) {
      const zone = chosenZones[i % chosenZones.length]
      const template = FRUITS[Math.floor(Math.random() * FRUITS.length)]
      const x = gameWidth * (zone.xMin + Math.random() * (zone.xMax - zone.xMin))
      // Aim fruits toward center with gentle arcs
      const centerX = gameWidth / 2
      const vx = (centerX - x) * (0.005 + Math.random() * 0.01) + (Math.random() - 0.5) * 0.8
      const vy = -(3.5 + Math.random() * 2) // slower upward launch

      // Stagger each fruit in the wave slightly
      safeTimeout(() => {
        const fruit: Fruit = {
          id: nextId.current++,
          emoji: template.emoji,
          name: template.name,
          x,
          y: gameHeight + 20,
          vx,
          vy,
          size: 40 + Math.random() * 10,
          sliced: false,
          points: template.points,
        }
        fruitsRef.current = [...fruitsRef.current, fruit]
      }, i * (80 + Math.random() * 120)) // stagger 80-200ms apart
    }
  }, [gameWidth, gameHeight])

  function startLevel(idx: number) {
    const lv = LEVELS[idx]
    setLevelIdx(idx)
    setScore(0); scoreRef.current = 0
    setSliced(0); slicedRef.current = 0
    setCombo(0); setShowCombo(false)
    setTimeLeft(lv.duration)
    fruitsRef.current = []
    setFruits([]); setTrail([]); setSplashes([])
    nextId.current = 0
    setScreen('play')
    playSound('click')
    speakText(`${lv.name}! ${lv.desc}`)

    // Wave-based spawn loop like real Fruit Ninja
    if (spawnTimer.current) clearTimeout(spawnTimer.current)
    const scheduleWave = () => {
      const pause = lv.wavePause[0] + Math.random() * (lv.wavePause[1] - lv.wavePause[0])
      spawnTimer.current = setTimeout(() => {
        const count = lv.waveSize[0] + Math.floor(Math.random() * (lv.waveSize[1] - lv.waveSize[0] + 1))
        spawnWave(count)
        scheduleWave()
      }, pause)
    }
    // First wave comes quickly
    safeTimeout(() => {
      spawnWave(lv.waveSize[0])
      scheduleWave()
    }, 600)
  }

  // Timer
  useEffect(() => {
    if (screen !== 'play') return
    const t = setInterval(() => {
      setTimeLeft(tl => {
        if (tl <= 1) {
          clearInterval(t)
          if (spawnTimer.current) { clearTimeout(spawnTimer.current); spawnTimer.current = null }
          const lv = LEVELS[levelIdx]
          if (slicedRef.current >= lv.target) {
            const s = scoreRef.current >= lv.target * 3 ? 3 : scoreRef.current >= lv.target * 2 ? 2 : 1
            setStars(s)
            if (levelIdx < LEVELS.length - 1) setUnlocked(u => { const n = [...u]; n[levelIdx + 1] = true; return n })
            setScreen('complete')
            playSound('tada')
            speakText('Great slicing!')
          } else {
            setScreen('timeup')
            playSound('click')
            speakText("Time's up!")
          }
          setBestScore(prev => Math.max(prev, scoreRef.current))
          return 0
        }
        return tl - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [screen, levelIdx])

  // Physics loop
  useEffect(() => {
    if (screen !== 'play') return
    let running = true
    const loop = () => {
      if (!running) return
      fruitsRef.current = fruitsRef.current
        .map(f => ({
          ...f,
          x: f.x + f.vx,
          y: f.y + f.vy,
          vy: f.vy + GRAVITY,
        }))
        .filter(f => f.y < gameHeight + 80) // remove when fallen off
      setFruits([...fruitsRef.current])

      // Decay trail
      setTrail(prev => prev.map(t => ({ ...t, age: t.age + 1 })).filter(t => t.age < 8))

      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => { running = false; cancelAnimationFrame(frameRef.current) }
  }, [screen, gameHeight])

  function getPos(e: React.TouchEvent | React.MouseEvent) {
    const el = gameRef.current
    if (!el) return { x: 0, y: 0 }
    const rect = el.getBoundingClientRect()
    const [cx, cy] = 'touches' in e ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY]
    return { x: cx - rect.left, y: cy - rect.top }
  }

  function handleSwipeStart(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    setSwiping(true)
    const pos = getPos(e)
    checkSlice(pos)
    addTrail(pos)
  }

  function handleSwipeMove(e: React.TouchEvent | React.MouseEvent) {
    if (!swiping) return
    e.preventDefault()
    const pos = getPos(e)
    checkSlice(pos)
    addTrail(pos)
  }

  function handleSwipeEnd() {
    setSwiping(false)
  }

  function addTrail(pos: { x: number; y: number }) {
    setTrail(prev => [...prev, { id: trailId.current++, x: pos.x, y: pos.y, age: 0 }])
  }

  function checkSlice(pos: { x: number; y: number }) {
    let slicedAny = false
    fruitsRef.current = fruitsRef.current.map(f => {
      if (f.sliced) return f
      const dist = Math.hypot(f.x + f.size / 2 - pos.x, f.y + f.size / 2 - pos.y)
      if (dist < f.size * 0.7) {
        slicedAny = true
        const fruitDef = FRUITS.find(fd => fd.emoji === f.emoji)

        // Splash effect
        setSplashes(prev => [...prev, {
          id: splashId.current++,
          x: f.x, y: f.y,
          emoji: f.emoji,
          color: fruitDef?.color || '#FF5722'
        }])
        const sid = splashId.current - 1
        safeTimeout(() => setSplashes(prev => prev.filter(s => s.id !== sid)), 600)

        // Score
        const pts = f.points
        scoreRef.current += pts
        setScore(scoreRef.current)
        slicedRef.current++
        setSliced(slicedRef.current)

        // Combo
        setCombo(c => {
          const next = c + 1
          if (next >= 3) {
            setShowCombo(true)
            scoreRef.current += next
            setScore(scoreRef.current)
            if (comboTimer.current) clearTimeout(comboTimer.current)
            comboTimer.current = setTimeout(() => setShowCombo(false), 800)
          }
          return next
        })
        if (comboTimer.current) clearTimeout(comboTimer.current)
        comboTimer.current = setTimeout(() => setCombo(0), 1000)

        playSound('tada')
        return { ...f, sliced: true }
      }
      return f
    })
    if (slicedAny) setFruits([...fruitsRef.current])
  }

  // ── Level Select ──
  if (screen === 'select') {
    return (
      <div className="page" style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <button onClick={() => { playSound('click'); onBack() }} style={{ ...backBtnDark, color: '#C8E6C9' }}>← Back</button>
          {pet && <span style={{ fontSize: 28 }}>{pet}</span>}
        </div>
        <h2 style={{ textAlign: 'center', color: '#C8E6C9', fontSize: 24, margin: '0 0 5px 0', fontWeight: 800 }}>🍉 Fruit Ninja</h2>
        {bestScore > 0 && <p style={{ textAlign: 'center', color: '#A5D6A7', fontSize: 13, margin: '0 0 15px 0' }}>🏆 Best: {bestScore}</p>}
        <div style={{ maxWidth: 400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {LEVELS.map((lv, i) => (
            <button key={lv.name} onClick={() => unlocked[i] && startLevel(i)} disabled={!unlocked[i]} style={{
              background: unlocked[i] ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)',
              borderRadius: 20, padding: 16, border: unlocked[i] ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
              cursor: unlocked[i] ? 'pointer' : 'not-allowed', opacity: unlocked[i] ? 1 : 0.4, textAlign: 'center'
            }}>
              <div style={{ fontSize: 32 }}>{unlocked[i] ? lv.icon : '🔒'}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#C8E6C9', marginTop: 4 }}>{lv.name}</div>
              <div style={{ fontSize: 12, color: '#A5D6A7', marginTop: 2 }}>{lv.desc}</div>
              <div style={{ fontSize: 12, color: '#81C784', marginTop: 4 }}>⏱ {lv.duration}s • 🎯 {lv.target}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── Level Complete ──
  if (screen === 'complete') {
    return (
      <div className="page" style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 35, textAlign: 'center', maxWidth: 360, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: 55 }}>🎉</div>
          <h2 style={{ color: '#C8E6C9', margin: '8px 0', fontWeight: 800 }}>Level Complete!</h2>
          <div style={{ fontSize: 36, marginBottom: 5 }}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
          <p style={{ color: '#A5D6A7', fontSize: 14, margin: '0 0 15px 0' }}>Score: {score} • Sliced: {sliced}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => startLevel(levelIdx)} style={{ background: '#00b894', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>🔄 Retry</button>
            {levelIdx < LEVELS.length - 1 && <button onClick={() => startLevel(levelIdx + 1)} style={{ background: '#e17055', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Next ➜</button>}
            <button onClick={() => setScreen('select')} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: 14, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>📋 Levels</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Time's Up ──
  if (screen === 'timeup') {
    return (
      <div className="page" style={{ background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 35, textAlign: 'center', maxWidth: 360, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.15)' }}>
          <div style={{ fontSize: 55 }}>⏰</div>
          <h2 style={{ color: '#C8E6C9', margin: '8px 0', fontWeight: 800 }}>Time's Up!</h2>
          <div style={{ fontSize: 40, color: '#fff', fontWeight: 700, marginBottom: 5 }}>{score}</div>
          <p style={{ color: '#A5D6A7', fontSize: 14, margin: '0 0 5px 0' }}>Sliced: {sliced} / {LEVELS[levelIdx].target}</p>
          <p style={{ color: '#81C784', fontSize: 12, margin: '0 0 15px 0' }}>Keep trying, you'll get it!</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => startLevel(levelIdx)} style={{ background: '#00b894', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>🔄 Again</button>
            <button onClick={() => setScreen('select')} style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>📋 Levels</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Gameplay ──
  const lv = LEVELS[levelIdx]
  const progress = Math.min(100, (sliced / lv.target) * 100)

  return (
    <div className="page" style={{ background: 'linear-gradient(180deg, #1B5E20 0%, #2E7D32 30%, #388E3C 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: gameWidth, padding: '10px 14px', boxSizing: 'border-box', alignItems: 'center' }}>
        <button onClick={() => { if (spawnTimer.current) clearTimeout(spawnTimer.current); setScreen('select'); playSound('click') }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 15, padding: '6px 12px', color: '#A5D6A7', fontSize: 13, cursor: 'pointer' }}>← Back</button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: '#FFA726', fontSize: 18, fontWeight: 700 }}>🍉 {score}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#A5D6A7', fontSize: 12 }}>{sliced}/{lv.target}</span>
          <span style={{ color: timeLeft <= 5 ? '#EF5350' : '#A5D6A7', fontSize: 16, fontWeight: 700 }}>⏱ {timeLeft}s</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: gameWidth - 20, height: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 3, marginBottom: 4 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #66BB6A, #FFA726)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Game area */}
      <div
        ref={gameRef}
        onMouseDown={handleSwipeStart}
        onMouseMove={handleSwipeMove}
        onMouseUp={handleSwipeEnd}
        onMouseLeave={handleSwipeEnd}
        onTouchStart={handleSwipeStart}
        onTouchMove={handleSwipeMove}
        onTouchEnd={handleSwipeEnd}
        style={{
          width: gameWidth, height: gameHeight, position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 100%, #1B5E2044, transparent)',
          borderRadius: 20, border: '2px solid rgba(255,255,255,0.08)',
          touchAction: 'none', cursor: 'crosshair',
        }}
      >

        {/* Swipe trail */}
        {trail.map(t => (
          <div key={t.id} style={{
            position: 'absolute', left: t.x - 3, top: t.y - 3,
            width: 6, height: 6, borderRadius: '50%',
            background: `rgba(255, 255, 255, ${Math.max(0, 1 - t.age * 0.15)})`,
            boxShadow: `0 0 8px rgba(255,255,255,${Math.max(0, 0.5 - t.age * 0.08)})`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Splash effects */}
        {splashes.map(s => (
          <div key={s.id} style={{
            position: 'absolute', left: s.x, top: s.y,
            pointerEvents: 'none', zIndex: 15,
          }}>
            <div style={{
              fontSize: 24,
              animation: 'fruitSplashL 0.5s ease-out forwards',
            }}>{s.emoji}</div>
            <div style={{
              fontSize: 24, position: 'absolute', top: 0, left: 0,
              animation: 'fruitSplashR 0.5s ease-out forwards',
            }}>{s.emoji}</div>
            <div style={{
              position: 'absolute', top: 10, left: -5,
              width: 40, height: 40, borderRadius: '50%',
              background: `radial-gradient(circle, ${s.color}88, transparent)`,
              animation: 'splashGrow 0.5s ease-out forwards',
            }} />
          </div>
        ))}

        {/* Combo indicator */}
        {showCombo && (
          <div style={{
            position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: 42, fontWeight: 'bold', color: '#FFA726', zIndex: 20,
            textShadow: '0 2px 10px rgba(255,167,38,0.6)',
            animation: 'comboPopIn 0.4s ease-out', pointerEvents: 'none',
          }}>
            {combo}x Combo! 🔥
          </div>
        )}

        {/* Fruits */}
        {fruits.map(f => (
          <div key={f.id} style={{
            position: 'absolute',
            left: f.x, top: f.y,
            fontSize: f.size,
            opacity: f.sliced ? 0 : 1,
            transition: 'opacity 0.15s',
            userSelect: 'none', WebkitUserSelect: 'none',
            pointerEvents: f.sliced ? 'none' : 'auto',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
            zIndex: 5,
          }}>
            {f.emoji}
          </div>
        ))}

        {/* Decorative elements */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(0deg, #1B5E20, transparent)', pointerEvents: 'none' }} />

        {pet && <div style={{ position: 'absolute', bottom: 10, right: 10, fontSize: 28, opacity: 0.7, pointerEvents: 'none' }}>{pet}</div>}
      </div>

    </div>
  )
}
