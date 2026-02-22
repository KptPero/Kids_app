import React, { useState, useRef, useEffect } from 'react'
import { playSound, speakText } from '../utils/sounds'

interface Shape {
  id: string; name: string; emoji: string; color: string; svg: string
}

const SHAPES: Shape[] = [
  { id: 'circle', name: 'Circle', emoji: '🔴', color: '#F44336', svg: '<circle cx="40" cy="40" r="35" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'square', name: 'Square', emoji: '🟦', color: '#2196F3', svg: '<rect x="5" y="5" width="70" height="70" rx="4" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'triangle', name: 'Triangle', emoji: '🔺', color: '#FF9800', svg: '<polygon points="40,5 75,75 5,75" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'star', name: 'Star', emoji: '⭐', color: '#FFC107', svg: '<polygon points="40,5 48,30 75,30 53,47 61,75 40,57 19,75 27,47 5,30 32,30" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'heart', name: 'Heart', emoji: '❤️', color: '#E91E63', svg: '<path d="M40,70 C20,50 0,35 10,18 C18,5 32,5 40,20 C48,5 62,5 70,18 C80,35 60,50 40,70Z" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', color: '#00BCD4', svg: '<polygon points="40,5 75,40 40,75 5,40" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'pentagon', name: 'Pentagon', emoji: '⬠', color: '#9C27B0', svg: '<polygon points="40,5 73,28 63,70 17,70 7,28" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'oval', name: 'Oval', emoji: '🥚', color: '#8BC34A', svg: '<ellipse cx="40" cy="40" rx="35" ry="25" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'cross', name: 'Cross', emoji: '✚', color: '#FF5722', svg: '<path d="M28,5 L52,5 L52,28 L75,28 L75,52 L52,52 L52,75 L28,75 L28,52 L5,52 L5,28 L28,28Z" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'crescent', name: 'Moon', emoji: '🌙', color: '#FDD835', svg: '<path d="M50,5 A35,35 0 1,1 50,75 A25,25 0 1,0 50,5Z" fill="FILL" stroke="#333" stroke-width="2"/>' },
]

interface LevelDef {
  name: string; icon: string; count: number; desc: string; timeLimit?: number; rotateHoles?: boolean
}

const LEVELS: LevelDef[] = [
  { name: 'Beginner', icon: '🌱', count: 3, desc: '3 simple shapes' },
  { name: 'Easy', icon: '🌻', count: 4, desc: '4 shapes to sort' },
  { name: 'Medium', icon: '🌟', count: 5, desc: '5 shapes, trickier!' },
  { name: 'Hard', icon: '🔥', count: 7, desc: '7 shapes challenge' },
  { name: 'Expert', icon: '👑', count: 8, desc: 'All shapes + timing!', timeLimit: 45 },
  { name: 'Master', icon: '💎', count: 10, desc: 'All shapes + rotated!', timeLimit: 60, rotateHoles: true },
]

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }; return a
}

export default function ShapeSorter({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [levelIdx, setLevelIdx] = useState(0)
  const [unlocked, setUnlocked] = useState([true, false, false, false, false, false])
  const [screen, setScreen] = useState<'select' | 'play' | 'complete'>('select')
  const [picked, setPicked] = useState<Shape[]>([])
  const [holes, setHoles] = useState<Shape[]>([])
  const [holeRotations, setHoleRotations] = useState<number[]>([])
  const [sorted, setSorted] = useState<string[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [stars, setStars] = useState(0)
  const [hints, setHints] = useState(3)
  const [hintShape, setHintShape] = useState<string | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => { return () => { timersRef.current.forEach(t => clearTimeout(t)) } }, [])
  function safeTimeout(fn: () => void, ms: number) { const id = setTimeout(fn, ms); timersRef.current.push(id); return id }

  function startLevel(idx: number) {
    const lv = LEVELS[idx]
    const shapes = shuffleArr(SHAPES).slice(0, lv.count)
    setPicked(shapes)
    setHoles(shuffleArr(shapes))
    setHoleRotations(shapes.map(() => lv.rotateHoles ? [0, 90, 180, 270][Math.floor(Math.random() * 4)] : 0))
    setSorted([])
    setDragging(null)
    setFeedback('')
    setStreak(0)
    setHintShape(null)
    setTimeLeft(lv.timeLimit ?? null)
    setScreen('play')
    setLevelIdx(idx)
    playSound('click')
    speakText(`Level ${idx + 1}: ${lv.name}!`)
  }

  // Timer
  useEffect(() => {
    if (screen !== 'play' || timeLeft === null) return
    if (timeLeft <= 0) {
      setScreen('complete')
      setStars(0)
      speakText('Time is up!')
      return
    }
    const t = setTimeout(() => setTimeLeft(tl => tl !== null ? tl - 1 : null), 1000)
    return () => clearTimeout(t)
  }, [screen, timeLeft])

  function handleTapShape(shapeId: string) {
    if (sorted.includes(shapeId)) return
    setDragging(shapeId); playSound('click')
  }

  function handleTapHole(holeId: string) {
    if (!dragging) return
    if (dragging === holeId) {
      playSound('tada')
      const shape = SHAPES.find(s => s.id === dragging)
      speakText(shape?.name || '')
      setFeedback('✅ ' + (shape?.name || '') + '!')
      const ns = [...sorted, dragging]
      setSorted(ns)
      setStreak(s => { const n = s + 1; if (n > bestStreak) setBestStreak(n); return n })
      if (ns.length === picked.length) {
        safeTimeout(() => {
          const lv = LEVELS[levelIdx]
          let s = 3
          if (lv.timeLimit && timeLeft !== null) {
            if (timeLeft < lv.timeLimit * 0.3) s = 1
            else if (timeLeft < lv.timeLimit * 0.6) s = 2
          }
          if (streak < picked.length * 0.5) s = Math.max(1, s - 1)
          setStars(s)
          setScreen('complete')
          // Unlock next
          if (levelIdx < LEVELS.length - 1) {
            setUnlocked(u => { const n = [...u]; n[levelIdx + 1] = true; return n })
          }
          speakText('Well done! You sorted all the shapes!')
        }, 600)
      }
    } else {
      playSound('click')
      setFeedback('Try again! 🤔')
      setStreak(0)
    }
    setDragging(null)
    safeTimeout(() => setFeedback(''), 1200)
  }

  function useHint() {
    if (hints <= 0 || sorted.length >= picked.length) return
    const remaining = picked.filter(s => !sorted.includes(s.id))
    if (remaining.length === 0) return
    const h = remaining[Math.floor(Math.random() * remaining.length)]
    setHintShape(h.id)
    setHints(n => n - 1)
    playSound('click')
    speakText(h.name)
    safeTimeout(() => setHintShape(null), 2000)
  }

  function renderSvg(shape: Shape, fill: string, size: number, rotation?: number) {
    return (
      <svg viewBox="0 0 80 80" width={size} height={size} style={{ transform: rotation ? `rotate(${rotation}deg)` : undefined }}>
        <g dangerouslySetInnerHTML={{ __html: shape.svg.replace('FILL', fill) }} />
      </svg>
    )
  }

  // Level Select
  if (screen === 'select') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #E8EAF6 100%)', minHeight: '100vh', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #1565C0', borderRadius: 25, padding: '12px 20px', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', color: '#1565C0' }}>← Back</button>
          {pet && <span style={{ fontSize: 28 }}>{pet}</span>}
        </div>
        <h2 style={{ textAlign: 'center', color: '#1565C0', fontSize: 24, margin: '0 0 20px 0' }}>🔵 Shape Sorter</h2>
        <div style={{ maxWidth: 400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {LEVELS.map((lv, i) => (
            <button key={lv.name} onClick={() => unlocked[i] && startLevel(i)} disabled={!unlocked[i]} style={{
              background: unlocked[i] ? '#fff' : '#E0E0E0', borderRadius: 20, padding: 16, border: 'none',
              cursor: unlocked[i] ? 'pointer' : 'not-allowed', opacity: unlocked[i] ? 1 : 0.5,
              boxShadow: unlocked[i] ? '0 4px 15px rgba(0,0,0,0.1)' : 'none', textAlign: 'center'
            }}>
              <div style={{ fontSize: 32 }}>{unlocked[i] ? lv.icon : '🔒'}</div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 4 }}>{lv.name}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{lv.desc}</div>
              {lv.timeLimit && <div style={{ fontSize: 10, color: '#E65100', marginTop: 4 }}>⏱ {lv.timeLimit}s</div>}
            </button>
          ))}
        </div>
        {bestStreak > 0 && <p style={{ textAlign: 'center', color: '#888', marginTop: 15, fontSize: 13 }}>🔥 Best streak: {bestStreak}</p>}
      </div>
    )
  }

  // Level Complete
  if (screen === 'complete') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)', minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 30, padding: 35, textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', maxWidth: 380 }}>
          <div style={{ fontSize: 55 }}>{stars > 0 ? '🎉' : '⏰'}</div>
          <h2 style={{ color: '#1565C0', margin: '8px 0' }}>{stars > 0 ? 'Level Complete!' : "Time's Up!"}</h2>
          <div style={{ fontSize: 36, marginBottom: 10 }}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
          <p style={{ color: '#777', fontSize: 14, margin: '0 0 15px 0' }}>Streak: {streak} • Best: {bestStreak}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => startLevel(levelIdx)} style={{ background: 'linear-gradient(135deg, #42A5F5, #1E88E5)', color: '#fff', border: 'none', borderRadius: 20, padding: '12px 24px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}>🔄 Retry</button>
            {stars > 0 && levelIdx < LEVELS.length - 1 && <button onClick={() => startLevel(levelIdx + 1)} style={{ background: 'linear-gradient(135deg, #66BB6A, #43A047)', color: '#fff', border: 'none', borderRadius: 20, padding: '12px 24px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}>Next ➜</button>}
            <button onClick={() => setScreen('select')} style={{ background: '#E0E0E0', color: '#555', border: 'none', borderRadius: 20, padding: '12px 24px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer' }}>📋 Levels</button>
          </div>
        </div>
      </div>
    )
  }

  // Gameplay
  const lv = LEVELS[levelIdx]
  return (
    <div style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #E8EAF6 100%)', minHeight: '100vh', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <button onClick={() => { setScreen('select'); playSound('click') }} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #1565C0', borderRadius: 25, padding: '10px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 'bold', color: '#1565C0' }}>← Levels</button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {timeLeft !== null && <span style={{ fontSize: 16, fontWeight: 'bold', color: timeLeft <= 10 ? '#D32F2F' : '#1565C0' }}>⏱ {timeLeft}s</span>}
          <span style={{ fontSize: 14, color: '#888' }}>🔥{streak}</span>
          <button onClick={useHint} disabled={hints <= 0} style={{ background: hints > 0 ? '#FFF9C4' : '#EEE', border: 'none', borderRadius: 12, padding: '6px 10px', fontSize: 13, fontWeight: 'bold', cursor: hints > 0 ? 'pointer' : 'not-allowed', color: '#F57F17' }}>💡{hints}</button>
        </div>
        {pet && <span style={{ fontSize: 24 }}>{pet}</span>}
      </div>

      <div style={{ maxWidth: 450, margin: '0 auto', textAlign: 'center' }}>
        <h3 style={{ fontSize: 18, color: '#1565C0', margin: '0 0 5px 0' }}>{lv.icon} {lv.name}</h3>
        <p style={{ fontSize: 12, color: '#888', margin: '0 0 10px 0' }}>Tap a shape, then tap its matching hole!</p>

        {/* Progress bar */}
        <div style={{ background: '#E0E0E0', borderRadius: 10, height: 8, marginBottom: 12, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(90deg, #42A5F5, #1E88E5)', height: '100%', width: `${(sorted.length / picked.length) * 100}%`, borderRadius: 10, transition: 'width 0.3s' }} />
        </div>

        {/* Shapes to pick */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 18, padding: 12, background: 'rgba(255,255,255,0.7)', borderRadius: 18 }}>
          {picked.filter(s => !sorted.includes(s.id)).map(shape => (
            <button key={shape.id} onClick={() => handleTapShape(shape.id)} style={{
              background: dragging === shape.id ? '#FFF9C4' : hintShape === shape.id ? '#C8E6C9' : '#fff',
              border: `3px solid ${dragging === shape.id ? '#FFA000' : hintShape === shape.id ? '#4CAF50' : shape.color}`,
              borderRadius: 16, padding: 8, cursor: 'pointer',
              transform: dragging === shape.id ? 'scale(1.15)' : hintShape === shape.id ? 'scale(1.1)' : 'scale(1)',
              transition: 'all 0.2s', boxShadow: dragging === shape.id ? '0 6px 20px rgba(0,0,0,0.2)' : '0 2px 6px rgba(0,0,0,0.08)',
              animation: hintShape === shape.id ? 'hintPulse 0.6s ease infinite' : undefined
            }}>
              {renderSvg(shape, shape.color, 48)}
              <div style={{ fontSize: 10, fontWeight: 'bold', color: '#555', marginTop: 2 }}>{shape.name}</div>
            </button>
          ))}
          {picked.filter(s => !sorted.includes(s.id)).length === 0 && <div style={{ fontSize: 14, color: '#999', padding: 15 }}>All sorted! 🎉</div>}
        </div>

        {/* Holes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center', padding: 12, background: 'rgba(0,0,0,0.05)', borderRadius: 18, border: '3px dashed #90CAF9' }}>
          <div style={{ width: '100%', fontSize: 12, color: '#888', marginBottom: 4 }}>⬇️ Drop here ⬇️</div>
          {holes.map((shape, i) => {
            const done = sorted.includes(shape.id)
            const isHint = hintShape === shape.id
            return (
              <button key={shape.id} onClick={() => handleTapHole(shape.id)} disabled={done} style={{
                background: done ? shape.color + '33' : isHint ? '#C8E6C9' : 'rgba(255,255,255,0.5)',
                border: `3px dashed ${done ? shape.color : isHint ? '#4CAF50' : '#BDBDBD'}`,
                borderRadius: 16, padding: 8, cursor: done ? 'default' : 'pointer',
                opacity: done ? 0.6 : 1, minWidth: 65, minHeight: 65,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                animation: isHint ? 'hintPulse 0.6s ease infinite' : undefined
              }}>
                {renderSvg(shape, done ? shape.color : '#E0E0E0', 44, holeRotations[i])}
                {done && <div style={{ fontSize: 10, color: shape.color, fontWeight: 'bold', marginTop: 2 }}>✓</div>}
              </button>
            )
          })}
        </div>

        {feedback && (
          <div style={{ marginTop: 12, padding: 10, borderRadius: 14, fontSize: 16, fontWeight: 'bold',
            background: feedback.includes('✅') ? '#E8F5E9' : '#FFF3E0',
            color: feedback.includes('✅') ? '#2E7D32' : '#E65100'
          }}>{feedback}</div>
        )}
      </div>

      <style>{`@keyframes hintPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(76,175,80,0.4) } 50% { box-shadow: 0 0 0 8px rgba(76,175,80,0) } }`}</style>
    </div>
  )
}
