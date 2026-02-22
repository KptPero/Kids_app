import React, { useState, useEffect, useRef, useCallback } from 'react'
import { playSound, speakText } from '../utils/sounds'

interface FallingItem {
  id: number; x: number; y: number; emoji: string; speed: number; size: number; points: number; type: 'good' | 'power'
}

const GOOD_ITEMS = [
  { emoji: '⭐', points: 1 }, { emoji: '🌟', points: 2 }, { emoji: '💫', points: 1 }, { emoji: '✨', points: 1 },
  { emoji: '🍎', points: 3 }, { emoji: '🍪', points: 3 }, { emoji: '🧁', points: 5 }, { emoji: '🌈', points: 5 },
  { emoji: '🍬', points: 2 }, { emoji: '🎁', points: 4 }, { emoji: '💎', points: 6 }, { emoji: '🦋', points: 3 },
]
const POWER_ITEMS = [
  { emoji: '⏱️', points: 0, effect: 'time' },     // +5s
  { emoji: '🧲', points: 0, effect: 'magnet' },   // slow items
  { emoji: '2️⃣', points: 0, effect: 'double' },   // double pts 5s
]

interface WaveDef { name: string; icon: string; duration: number; spawnMs: number; powerChance: number; speedMul: number }

const WAVES: WaveDef[] = [
  { name: 'Starlight', icon: '✨', duration: 25, spawnMs: 700, powerChance: 0.05, speedMul: 1 },
  { name: 'Comet Shower', icon: '☄️', duration: 25, spawnMs: 550, powerChance: 0.08, speedMul: 1.2 },
  { name: 'Meteor Storm', icon: '🌠', duration: 30, spawnMs: 450, powerChance: 0.1, speedMul: 1.4 },
  { name: 'Galaxy Rush', icon: '🌌', duration: 30, spawnMs: 350, powerChance: 0.12, speedMul: 1.6 },
  { name: 'Supernova', icon: '💥', duration: 35, spawnMs: 300, powerChance: 0.15, speedMul: 1.8 },
]

export default function CatchStars({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [score, setScore] = useState(0)
  const [items, setItems] = useState<FallingItem[]>([])
  const [timeLeft, setTimeLeft] = useState(25)
  const [gameState, setGameState] = useState<'select' | 'playing' | 'waveComplete' | 'done'>('select')
  const [waveIdx, setWaveIdx] = useState(0)
  const [unlocked, setUnlocked] = useState([true, false, false, false, false])
  const [catchAnim, setCatchAnim] = useState<{ x: number; y: number; emoji: string } | null>(null)
  const [highScore, setHighScore] = useState(0)
  const [activePower, setActivePower] = useState<string | null>(null)
  const [powerTimer, setPowerTimer] = useState(0)
  const [stars, setStars] = useState(0)
  const [caught, setCaught] = useState(0)
  const [missed, setMissed] = useState(0)

  const highScoreRef = useRef(0)
  const scoreRef = useRef(0)
  const nextId = useRef(0)
  const frameRef = useRef<number>(0)
  const lastSpawn = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const activePowerRef = useRef<string | null>(null)
  const caughtRef = useRef(0)
  const missedRef = useRef(0)

  const gameWidth = Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 16 : 360)
  const gameHeight = Math.min(500, typeof window !== 'undefined' ? window.innerHeight - 120 : 500)

  useEffect(() => { return () => { cancelAnimationFrame(frameRef.current); timersRef.current.forEach(t => clearTimeout(t)) } }, [])

  function safeTimeout(fn: () => void, ms: number) { const id = setTimeout(fn, ms); timersRef.current.push(id); return id }

  const spawn = useCallback((wave: WaveDef) => {
    const r = Math.random()
    let template: any, type: 'good' | 'power' = 'good'
    if (r < wave.powerChance) { template = POWER_ITEMS[Math.floor(Math.random() * POWER_ITEMS.length)]; type = 'power' }
    else { template = GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)] }

    const speedBase = 1.5 + Math.random() * 2
    const item: FallingItem = {
      id: nextId.current++, x: 20 + Math.random() * (gameWidth - 60), y: -40,
      emoji: template.emoji, speed: speedBase * wave.speedMul * (activePowerRef.current === 'magnet' ? 0.5 : 1),
      size: 32 + Math.random() * 14, points: template.points, type
    }
    setItems(prev => [...prev, item])
  }, [gameWidth])

  function startWave(idx: number) {
    const wave = WAVES[idx]
    setWaveIdx(idx); setScore(0); scoreRef.current = 0; setTimeLeft(wave.duration); setItems([]); nextId.current = 0; lastSpawn.current = 0
    setActivePower(null); activePowerRef.current = null; setPowerTimer(0)
    setCaught(0); caughtRef.current = 0; setMissed(0); missedRef.current = 0
    setGameState('playing'); playSound('click'); speakText(`Wave ${idx + 1}: ${wave.name}!`)
  }

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return
    const timer = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timer)
          const s = caughtRef.current >= 20 ? 3 : caughtRef.current >= 12 ? 2 : caughtRef.current >= 5 ? 1 : 0
          setStars(s)
          if (s > 0) {
            setGameState('waveComplete')
            if (waveIdx < WAVES.length - 1) setUnlocked(u => { const n = [...u]; n[waveIdx + 1] = true; return n })
          } else {
            setGameState('done')
          }
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameState, waveIdx])

  useEffect(() => {
    if (gameState === 'done' || gameState === 'waveComplete') {
      playSound('tada')
      const hs = highScoreRef.current
      const s = scoreRef.current
      if (s > hs) { highScoreRef.current = s; setHighScore(s); speakText(`New high score! ${s} points!`) }
      else speakText(gameState === 'waveComplete' ? 'Wave complete!' : `Great catching! ${s} points!`)
    }
  }, [gameState])

  // Power timer
  useEffect(() => {
    if (!activePower || powerTimer <= 0) return
    const t = setTimeout(() => {
      if (powerTimer <= 1) { setActivePower(null); activePowerRef.current = null; setPowerTimer(0) }
      else setPowerTimer(p => p - 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [activePower, powerTimer])

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return
    const wave = WAVES[waveIdx]
    let running = true
    const loop = (time: number) => {
      if (!running) return
      if (time - lastSpawn.current > wave.spawnMs) { spawn(wave); lastSpawn.current = time }
      setItems(prev => {
        const filtered = prev.map(item => ({ ...item, y: item.y + item.speed }))
        const alive: FallingItem[] = []
        filtered.forEach(item => {
          if (item.y >= gameHeight + 50) {
            if (item.type === 'good') { missedRef.current++; setMissed(missedRef.current) }
          } else { alive.push(item) }
        })
        return alive
      })
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)
    return () => { running = false; cancelAnimationFrame(frameRef.current) }
  }, [gameState, waveIdx, spawn, gameHeight])

  function catchItem(item: FallingItem, e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault(); e.stopPropagation()

    if (item.type === 'power') {
      playSound('tada')
      const pw = POWER_ITEMS.find(p => p.emoji === item.emoji)
      if (pw) {
        if (pw.effect === 'time') { setTimeLeft(t => t + 5); setCatchAnim({ x: item.x, y: item.y, emoji: '+5s ⏱️' }) }
        else { setActivePower(pw.effect); activePowerRef.current = pw.effect; setPowerTimer(5); setCatchAnim({ x: item.x, y: item.y, emoji: pw.emoji }) }
      }
    } else {
      playSound('click')
      const pts = activePowerRef.current === 'double' ? item.points * 2 : item.points
      setScore(s => { const n = s + pts; scoreRef.current = n; return n })
      caughtRef.current++; setCaught(caughtRef.current)
      setCatchAnim({ x: item.x, y: item.y, emoji: `+${pts}` })
    }

    setItems(prev => prev.filter(i => i.id !== item.id))
    safeTimeout(() => setCatchAnim(null), 400)
  }

  // Level select
  if (gameState === 'select') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B2838 50%, #0D1B2A 100%)', minHeight: '100vh', padding: 20, fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'transparent', color: '#78909C', border: '2px solid #78909C', borderRadius: 25, padding: '10px 18px', fontSize: 15, cursor: 'pointer', fontWeight: 'bold' }}>← Back</button>
          {pet && <span style={{ fontSize: 28 }}>{pet}</span>}
        </div>
        <h2 style={{ textAlign: 'center', color: '#FFD54F', fontSize: 24, margin: '0 0 8px 0' }}>⭐ Catch the Stars</h2>
        {highScore > 0 && <p style={{ textAlign: 'center', color: '#78909C', fontSize: 13, margin: '0 0 15px 0' }}>🏆 High Score: {highScore}</p>}
        <div style={{ maxWidth: 400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {WAVES.map((w, i) => (
            <button key={w.name} onClick={() => unlocked[i] && startWave(i)} disabled={!unlocked[i]} style={{
              background: unlocked[i] ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 16,
              border: unlocked[i] ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)',
              cursor: unlocked[i] ? 'pointer' : 'not-allowed', opacity: unlocked[i] ? 1 : 0.4, textAlign: 'center'
            }}>
              <div style={{ fontSize: 32 }}>{unlocked[i] ? w.icon : '🔒'}</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#FFD54F', marginTop: 4 }}>{w.name}</div>
              <div style={{ fontSize: 11, color: '#78909C', marginTop: 2 }}>{w.duration}s • Speed ×{w.speedMul}</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Wave Complete
  if (gameState === 'waveComplete') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B2838 50%, #0D1B2A 100%)', minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 30, padding: 35, textAlign: 'center', maxWidth: 350, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 55 }}>🎉</div>
          <h2 style={{ color: '#FFD54F', margin: '8px 0' }}>Wave Complete!</h2>
          <div style={{ fontSize: 36, marginBottom: 5 }}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
          <p style={{ color: '#78909C', fontSize: 14, margin: '0 0 15px 0' }}>Score: {score} • Caught: {caught}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => startWave(waveIdx)} style={{ background: 'linear-gradient(135deg, #FFD54F, #FF8F00)', color: '#333', border: 'none', borderRadius: 25, padding: '12px 24px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}>🔄 Retry</button>
            {waveIdx < WAVES.length - 1 && <button onClick={() => startWave(waveIdx + 1)} style={{ background: 'linear-gradient(135deg, #66BB6A, #43A047)', color: '#fff', border: 'none', borderRadius: 25, padding: '12px 24px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}>Next ➜</button>}
            <button onClick={() => setGameState('select')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 25, padding: '12px 24px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}>📋 Waves</button>
          </div>
        </div>
      </div>
    )
  }

  // Done (failed)
  if (gameState === 'done') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1B2838 50%, #0D1B2A 100%)', minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 30, padding: 35, textAlign: 'center', maxWidth: 350, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 55 }}>⏰</div>
          <h2 style={{ color: '#FFD54F', margin: '8px 0' }}>Time's Up!</h2>
          <div style={{ fontSize: 40, color: '#FFF', fontWeight: 'bold', marginBottom: 5 }}>{score}</div>
          <p style={{ color: '#78909C', fontSize: 14, margin: '0 0 15px 0' }}>Caught: {caught} • Missed: {missed}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => startWave(waveIdx)} style={{ background: 'linear-gradient(135deg, #FFD54F, #FF8F00)', color: '#333', border: 'none', borderRadius: 25, padding: '14px 28px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>🔄 Again</button>
            <button onClick={() => setGameState('select')} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 25, padding: '14px 28px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>📋 Waves</button>
          </div>
        </div>
      </div>
    )
  }

  const wave = WAVES[waveIdx]
  return (
    <div style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #1B2838 60%, #263238 100%)', minHeight: '100vh', padding: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: "'Nunito', sans-serif" }}>
      {/* HUD */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: gameWidth, padding: '10px 14px', boxSizing: 'border-box', alignItems: 'center' }}>
        <button onClick={() => { setGameState('select'); playSound('click') }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 15, padding: '6px 12px', color: '#B0BEC5', fontSize: 13, cursor: 'pointer' }}>← Back</button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: '#FFD54F', fontSize: 18, fontWeight: 'bold' }}>⭐ {score}</span>
          {activePower && <span style={{ fontSize: 13, color: '#4FC3F7' }}>{activePower === 'magnet' ? '🧲' : '2️⃣'} {powerTimer}s</span>}
        </div>
        <span style={{ color: timeLeft <= 5 ? '#EF5350' : '#B0BEC5', fontSize: 16, fontWeight: 'bold' }}>⏱ {timeLeft}s</span>
      </div>

      {/* Wave label */}
      <div style={{ color: '#78909C', fontSize: 12, marginBottom: 4 }}>{wave.icon} Wave {waveIdx + 1}: {wave.name}</div>

      {/* Game area */}
      <div style={{ width: gameWidth, height: gameHeight, position: 'relative', overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 0%, #1a237e22, transparent)', borderRadius: 20, border: '2px solid rgba(255,255,255,0.05)' }}>
        {[...Array(20)].map((_, i) => (
          <div key={`bg-${i}`} style={{ position: 'absolute', left: `${(i * 19 + 7) % 100}%`, top: `${(i * 13 + 11) % 100}%`, width: 2 + (i % 3), height: 2 + (i % 3), borderRadius: '50%', background: '#fff', opacity: 0.2 + (i % 4) * 0.1 }} />
        ))}

        {items.map(item => (
          <div key={item.id} onMouseDown={e => catchItem(item, e)} onTouchStart={e => catchItem(item, e)} style={{
            position: 'absolute', left: item.x, top: item.y, fontSize: item.size, cursor: 'pointer', userSelect: 'none',
            WebkitUserSelect: 'none', touchAction: 'none',
            filter: item.type === 'power' ? 'drop-shadow(0 2px 8px rgba(79,195,247,0.6))' : 'drop-shadow(0 2px 6px rgba(255,215,0,0.5))',
          }}>{item.emoji}</div>
        ))}

        {catchAnim && (
          <div style={{ position: 'absolute', left: catchAnim.x, top: catchAnim.y, color: catchAnim.emoji.includes('-') ? '#EF5350' : '#FFD54F', fontSize: 22, fontWeight: 'bold', animation: 'floatUp 0.4s ease-out forwards', pointerEvents: 'none' }}>{catchAnim.emoji}</div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(0deg, #1B5E20, #2E7D32)', borderRadius: '0 0 18px 18px' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: 'linear-gradient(0deg, #4CAF50, transparent)' }} />
        </div>
      </div>

      <style>{`@keyframes floatUp { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-40px) scale(1.3)} }`}</style>
    </div>
  )
}
