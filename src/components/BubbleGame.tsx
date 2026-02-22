import React, { useState, useEffect, useRef, useCallback } from 'react'
import { playSound, speakText } from '../utils/sounds'
import { backBtn } from '../utils/sharedStyles'

type BubbleType = 'normal' | 'golden' | 'rainbow' | 'armored' | 'bomb'

interface Bubble {
  id: number; x: number; y: number; size: number; color: string
  speedY: number; wobbleOffset: number; wobbleSpeed: number
  letter?: string; emoji?: string; opacity: number; type: BubbleType; hp: number
}

interface Powerup {
  id: string; name: string; emoji: string; desc: string; duration: number
}

const POWERUPS: Powerup[] = [
  { id: 'freeze', name: 'Freeze', emoji: '❄️', desc: 'Freeze all bubbles!', duration: 5 },
  { id: 'double', name: 'Double Points', emoji: '✖️2️⃣', desc: 'Double points!', duration: 8 },
  { id: 'magnet', name: 'Magnet', emoji: '🧲', desc: 'Bubbles come to you!', duration: 6 },
  { id: 'mega', name: 'Mega Pop', emoji: '💥', desc: 'Pop nearby bubbles!', duration: 0 },
]

const colors = ['#FF6B9D', '#FFB74D', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#00BCD4', '#E91E63', '#8BC34A', '#FF9800']
const emojis = ['⭐', '🌈', '💖', '🦋', '🌸', '🐠', '🍭', '🎈', '✨', '🌻']

interface LevelDef { name: string; icon: string; target: number; maxBubbles: number; spawnMs: number; armorChance: number; bombChance: number; goldenChance: number }

const LEVELS: LevelDef[] = [
  { name: 'Warm Up', icon: '🌊', target: 15, maxBubbles: 15, spawnMs: 2200, armorChance: 0, bombChance: 0, goldenChance: 0.05 },
  { name: 'Getting Bubbly', icon: '🫧', target: 25, maxBubbles: 18, spawnMs: 1800, armorChance: 0.1, bombChance: 0, goldenChance: 0.08 },
  { name: 'Bubble Bath', icon: '🛁', target: 40, maxBubbles: 22, spawnMs: 1400, armorChance: 0.15, bombChance: 0.05, goldenChance: 0.1 },
  { name: 'Bubble Storm', icon: '🌪️', target: 60, maxBubbles: 25, spawnMs: 1000, armorChance: 0.2, bombChance: 0.08, goldenChance: 0.12 },
  { name: 'Bubble Master', icon: '👑', target: 80, maxBubbles: 28, spawnMs: 800, armorChance: 0.25, bombChance: 0.1, goldenChance: 0.15 },
]

export default function BubbleGame({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [screen, setScreen] = useState<'select' | 'play' | 'complete'>('select')
  const [levelIdx, setLevelIdx] = useState(0)
  const [unlocked, setUnlocked] = useState([true, false, false, false, false])
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [pops, setPops] = useState<{ id: number; x: number; y: number; text: string }[]>([])
  const [activePower, setActivePower] = useState<string | null>(null)
  const [powerTimer, setPowerTimer] = useState(0)
  const [popsCount, setPopsCount] = useState(0)
  const [stars, setStars] = useState(0)
  const [powerupBubble, setPowerupBubble] = useState<{ id: number; x: number; y: number; power: Powerup } | null>(null)

  const animRef = useRef<number>(0)
  const bubbleId = useRef(0)
  const bubblesRef = useRef<Bubble[]>([])
  const renderTickRef = useRef(0)
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const comboShowTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const popTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const activePowerRef = useRef<string | null>(null)
  const popsCountRef = useRef(0)
  const scoreRef = useRef(0)

  const spawnBubble = useCallback((lv: LevelDef, baseX?: number, baseY?: number) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const r = Math.random()
    let btype: BubbleType = 'normal'
    let hp = 1
    if (r < lv.bombChance) { btype = 'bomb'; hp = 1 }
    else if (r < lv.bombChance + lv.goldenChance) { btype = 'golden'; hp = 1 }
    else if (r < lv.bombChance + lv.goldenChance + lv.armorChance) { btype = 'armored'; hp = 2 }

    const hasLetter = btype === 'normal' && Math.random() > 0.6
    const hasEmoji = !hasLetter && btype === 'normal' && Math.random() > 0.5
    const b: Bubble = {
      id: bubbleId.current++,
      x: baseX != null ? Math.max(5, Math.min(85, baseX + (Math.random() - 0.5) * 20)) : Math.random() * 80 + 10,
      y: baseY != null ? Math.min(105, baseY + 10) : 105 + Math.random() * 10,
      size: btype === 'golden' ? 55 : Math.random() * 25 + 45,
      color: btype === 'golden' ? '#FFD700' : btype === 'bomb' ? '#333' : btype === 'armored' ? '#78909C' : colors[Math.floor(Math.random() * colors.length)],
      speedY: activePowerRef.current === 'freeze' ? 0 : Math.random() * 0.08 + 0.06,
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.01 + 0.008,
      letter: hasLetter ? letters[Math.floor(Math.random() * 26)] : undefined,
      emoji: btype === 'golden' ? '⭐' : btype === 'bomb' ? '💣' : btype === 'armored' ? '🛡️' : hasEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : undefined,
      opacity: 1, type: btype, hp
    }
    bubblesRef.current = [...bubblesRef.current, b]
  }, [])

  function startLevel(idx: number) {
    const lv = LEVELS[idx]
    setLevelIdx(idx); setScore(0); scoreRef.current = 0; setCombo(0); setPopsCount(0); popsCountRef.current = 0
    setActivePower(null); activePowerRef.current = null; setPowerTimer(0); setPowerupBubble(null)
    bubblesRef.current = []; bubbleId.current = 0
    // Pre-fill with bubbles
    for (let i = 0; i < 10; i++) {
      const b: Bubble = {
        id: bubbleId.current++, x: Math.random() * 80 + 10, y: Math.random() * 80 + 5,
        size: Math.random() * 25 + 45, color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 0.08 + 0.06, wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.01 + 0.008, opacity: 1, type: 'normal', hp: 1,
        letter: Math.random() > 0.6 ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)] : undefined,
        emoji: Math.random() > 0.7 ? emojis[Math.floor(Math.random() * emojis.length)] : undefined
      }
      bubblesRef.current.push(b)
    }
    setBubbles([...bubblesRef.current])
    setScreen('play'); playSound('click'); speakText(`Level ${idx + 1}: ${lv.name}!`)
  }

  // Spawn + animate
  useEffect(() => {
    if (screen !== 'play') return
    const lv = LEVELS[levelIdx]
    const spawnInt = setInterval(() => {
      if (bubblesRef.current.length < lv.maxBubbles) spawnBubble(lv)
    }, lv.spawnMs)

    // Powerup spawn
    const powerInt = setInterval(() => {
      if (powerupBubble || activePowerRef.current) return
      if (Math.random() < 0.3) {
        const pw = POWERUPS[Math.floor(Math.random() * POWERUPS.length)]
        setPowerupBubble({ id: Date.now(), x: Math.random() * 70 + 15, y: Math.random() * 60 + 10, power: pw })
        setTimeout(() => setPowerupBubble(p => p?.id === Date.now() ? null : p), 5000)
      }
    }, 8000)

    let fc = 0
    const animate = () => {
      fc++
      const frozen = activePowerRef.current === 'freeze'
      bubblesRef.current = bubblesRef.current.filter(b => b.y > -10).map(b => ({
        ...b,
        y: frozen ? b.y : b.y - b.speedY,
        x: b.x + Math.sin(fc * b.wobbleSpeed + b.wobbleOffset) * (frozen ? 0.02 : 0.12)
      }))
      renderTickRef.current++
      if (renderTickRef.current % 2 === 0) setBubbles([...bubblesRef.current])
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { clearInterval(spawnInt); clearInterval(powerInt); cancelAnimationFrame(animRef.current) }
  }, [screen, levelIdx, spawnBubble])

  useEffect(() => { return () => { if (comboTimer.current) clearTimeout(comboTimer.current); if (comboShowTimer.current) clearTimeout(comboShowTimer.current); popTimers.current.forEach(t => clearTimeout(t)) } }, [])

  // Power timer
  useEffect(() => {
    if (!activePower || powerTimer <= 0) return
    const t = setTimeout(() => {
      if (powerTimer <= 1) { setActivePower(null); activePowerRef.current = null; setPowerTimer(0) }
      else setPowerTimer(p => p - 1)
    }, 1000)
    return () => clearTimeout(t)
  }, [activePower, powerTimer])

  function popBubble(id: number, x: number, y: number, type: BubbleType, hp: number) {
    if (type === 'bomb') {
      playSound('click')
      setScore(s => { const n = Math.max(0, s - 5); scoreRef.current = n; return n })
      setPops(p => [...p, { id, x, y, text: '-5 💣' }])
      bubblesRef.current = bubblesRef.current.filter(b => b.id !== id)
      setBubbles([...bubblesRef.current])
      const pt = setTimeout(() => setPops(p => p.filter(pp => pp.id !== id)), 600)
      popTimers.current.push(pt)
      return
    }

    if (type === 'armored' && hp > 1) {
      playSound('click')
      bubblesRef.current = bubblesRef.current.map(b => b.id === id ? { ...b, hp: b.hp - 1, emoji: undefined, color: '#B0BEC5' } : b)
      setBubbles([...bubblesRef.current])
      return
    }

    playSound('tada')
    bubblesRef.current = bubblesRef.current.filter(b => b.id !== id)
    setBubbles([...bubblesRef.current])

    const pts = type === 'golden' ? 5 : activePowerRef.current === 'double' ? 2 : 1
    setScore(s => { const n = s + pts; scoreRef.current = n; return n })
    popsCountRef.current++; setPopsCount(popsCountRef.current)

    // Check level complete
    const lv = LEVELS[levelIdx]
    if (popsCountRef.current >= lv.target) {
      const s = scoreRef.current >= lv.target * 2 ? 3 : scoreRef.current >= lv.target * 1.3 ? 2 : 1
      setStars(s); setScreen('complete')
      if (levelIdx < LEVELS.length - 1) setUnlocked(u => { const n = [...u]; n[levelIdx + 1] = true; return n })
      playSound('tada'); speakText('Level complete!')
      return
    }

    setCombo(c => {
      const next = c + 1
      if (next >= 3) { setShowCombo(true); if (comboShowTimer.current) clearTimeout(comboShowTimer.current); comboShowTimer.current = setTimeout(() => setShowCombo(false), 1200) }
      return next
    })
    if (comboTimer.current) clearTimeout(comboTimer.current)
    comboTimer.current = setTimeout(() => setCombo(0), 1500)

    setPops(p => [...p, { id, x, y, text: `+${pts}` }])
    const pt = setTimeout(() => setPops(p => p.filter(pp => pp.id !== id)), 600)
    popTimers.current.push(pt)

    // Mega pop effect
    if (activePowerRef.current === 'mega') {
      const nearby = bubblesRef.current.filter(b => Math.abs(b.x - x) < 15 && Math.abs(b.y - y) < 15 && b.type !== 'bomb')
      nearby.forEach(b => {
        bubblesRef.current = bubblesRef.current.filter(bb => bb.id !== b.id)
        popsCountRef.current++
        setScore(s => { const n = s + 1; scoreRef.current = n; return n })
      })
      setPopsCount(popsCountRef.current)
      setActivePower(null); activePowerRef.current = null; setPowerTimer(0)
    }

    const count = Math.random() > 0.5 ? 2 : 1
    for (let i = 0; i < count; i++) spawnBubble(LEVELS[levelIdx], x, y)
  }

  function collectPowerup() {
    if (!powerupBubble) return
    const pw = powerupBubble.power
    playSound('tada'); speakText(pw.desc)
    setPowerupBubble(null)
    if (pw.duration > 0) { setActivePower(pw.id); activePowerRef.current = pw.id; setPowerTimer(pw.duration) }
    else if (pw.id === 'mega') { setActivePower('mega'); activePowerRef.current = 'mega'; setPowerTimer(1) }
  }

  // Level Select
  if (screen === 'select') {
    return (
      <div style={{ background: 'linear-gradient(180deg, #eaf6ff 0%, #f0f8ff 40%, #faf0ff 80%, #fff0f5 100%)', minHeight: '100vh', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <button onClick={() => { playSound('click'); onBack() }} style={backBtn}>← Back</button>
          {pet && <span style={{ fontSize: 28 }}>{pet}</span>}
        </div>
        <h2 style={{ textAlign: 'center', color: '#0984e3', fontSize: 22, margin: '0 0 20px 0', fontWeight: 800 }}>🫧 Bubble Pop</h2>
        <div style={{ maxWidth: 400, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {LEVELS.map((lv, i) => (
            <button key={lv.name} onClick={() => unlocked[i] && startLevel(i)} disabled={!unlocked[i]} style={{
              background: unlocked[i] ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.04)', borderRadius: 18, padding: 16, border: '1px solid rgba(255,255,255,0.4)',
              cursor: unlocked[i] ? 'pointer' : 'not-allowed', opacity: unlocked[i] ? 1 : 0.5,
              boxShadow: unlocked[i] ? '0 2px 8px rgba(0,0,0,0.06)' : 'none', textAlign: 'center',
              backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'
            }}>
              <div style={{ fontSize: 32 }}>{unlocked[i] ? lv.icon : '🔒'}</div>
              <div style={{ fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 4 }}>{lv.name}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Pop {lv.target} bubbles</div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Level Complete
  if (screen === 'complete') {
    return (
      <div style={{ background: 'linear-gradient(180deg, #eaf6ff 0%, #faf0ff 100%)', minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 24, padding: 35, textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.06)', maxWidth: 380 }}>
          <div style={{ fontSize: 55 }}>🎉</div>
          <h2 style={{ color: '#0984e3', margin: '8px 0' }}>Level Complete!</h2>
          <div style={{ fontSize: 36, marginBottom: 5 }}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
          <p style={{ color: '#888', fontSize: 14, margin: '0 0 15px 0' }}>Score: {score} • Popped: {popsCount}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => startLevel(levelIdx)} style={{ background: '#0984e3', color: '#fff', border: 'none', borderRadius: 16, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>🔄 Retry</button>
            {levelIdx < LEVELS.length - 1 && <button onClick={() => startLevel(levelIdx + 1)} style={{ background: '#00b894', color: '#fff', border: 'none', borderRadius: 16, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Next ➜</button>}
            <button onClick={() => setScreen('select')} style={{ background: 'rgba(0,0,0,0.06)', color: '#636e72', border: 'none', borderRadius: 16, padding: '12px 24px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>📋 Levels</button>
          </div>
        </div>
      </div>
    )
  }

  const lv = LEVELS[levelIdx]
  const progress = Math.min(100, (popsCount / lv.target) * 100)

  return (
    <div style={{
      background: 'linear-gradient(180deg, #eaf6ff 0%, #f0f8ff 40%, #faf0ff 80%, #fff0f5 100%)',
      minHeight: '100vh', position: 'relative', overflow: 'hidden', touchAction: 'none'
    }}>
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10,
        background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderRadius: '0 0 18px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <button onClick={() => { setScreen('select'); playSound('click') }} style={{
          background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 16, padding: '8px 14px', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#2d3436'
        }}>← Levels</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>🫧</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#0984e3' }}>{score}</span>
        </div>
        <div style={{ fontSize: 12, color: '#888' }}>{popsCount}/{lv.target}</div>
        {pet && <div style={{ fontSize: 28 }}>{pet}</div>}
      </div>

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 52, left: 10, right: 10, height: 6, background: 'rgba(0,0,0,0.08)', borderRadius: 3, zIndex: 10 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg, #4FC3F7, #0288D1)', borderRadius: 3, width: `${progress}%`, transition: 'width 0.3s' }} />
      </div>

      {/* Active powerup */}
      {activePower && (
        <div style={{ position: 'absolute', top: 65, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,255,255,0.9)', borderRadius: 15, padding: '4px 12px', fontSize: 13, fontWeight: 'bold', color: '#0288D1', zIndex: 10 }}>
          {POWERUPS.find(p => p.id === activePower)?.emoji} {powerTimer}s
        </div>
      )}

      {/* Combo */}
      {showCombo && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 48, fontWeight: 'bold', color: '#FF6B9D', zIndex: 20, textShadow: '0 2px 8px rgba(255,107,157,0.5)', animation: 'comboPopIn 0.4s ease-out', pointerEvents: 'none' }}>
          {combo}x Combo! 🎉
        </div>
      )}

      {/* Pop effects */}
      {pops.map(p => (
        <div key={p.id} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, color: p.text.includes('-') ? '#F44336' : '#FFD54F', fontSize: 20, fontWeight: 'bold', animation: 'popBurst 0.5s ease-out forwards', pointerEvents: 'none', zIndex: 15 }}>{p.text}</div>
      ))}

      {/* Powerup bubble */}
      {powerupBubble && (
        <div onClick={collectPowerup} style={{
          position: 'absolute', left: `${powerupBubble.x}%`, top: `${powerupBubble.y}%`,
          width: 55, height: 55, borderRadius: '50%', background: 'radial-gradient(circle at 30% 25%, #fff, #FFD700)', border: '3px solid #FFA000',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, cursor: 'pointer', zIndex: 12,
          boxShadow: '0 4px 20px rgba(255, 215, 0, 0.5)', animation: 'powerFloat 1.5s ease-in-out infinite'
        }}>{powerupBubble.power.emoji}</div>
      )}

      {/* Bubbles */}
      {bubbles.map(b => (
        <div key={b.id} onClick={() => popBubble(b.id, b.x, b.y, b.type, b.hp)} style={{
          position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: b.size, height: b.size,
          borderRadius: '50%',
          background: b.type === 'golden' ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.9), #FFD700, #FFA000)` :
            b.type === 'bomb' ? `radial-gradient(circle at 30% 25%, #666, #333, #111)` :
              b.type === 'armored' ? `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.9), #90A4AE, #607D8B)` :
                `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.9), ${b.color}88, ${b.color})`,
          boxShadow: b.type === 'golden' ? '0 4px 20px rgba(255,215,0,0.5)' : `0 4px 20px ${b.color}44, inset 0 -4px 12px rgba(0,0,0,0.08), inset 0 4px 8px rgba(255,255,255,0.6)`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: b.emoji ? b.size * 0.35 : b.letter ? b.size * 0.4 : 0,
          fontWeight: 'bold', color: '#fff', textShadow: b.letter ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none',
          zIndex: 5, border: b.type === 'armored' ? '2px solid #455A64' : undefined
        }}>{b.emoji || b.letter || ''}</div>
      ))}

    </div>
  )
}

