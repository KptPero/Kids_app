import React, { useState, useEffect, useRef, useCallback } from 'react'
import { playSound, speakText } from '../utils/sounds'
import { backBtn } from '../utils/sharedStyles'
import { useSafeTimeout } from '../hooks/useSafeTimeout'

interface Flame {
  id: number; x: number; y: number; size: number; health: number; maxHealth: number
  type: 'normal' | 'big' | 'fast'
}
interface Splash { id: number; x: number; y: number }
interface Powerup { id: number; x: number; y: number; type: 'waterbomb' | 'superhose' | 'extralife'; timer: number }

const LEVELS = [
  { name: 'Backyard BBQ', bg: '#4CAF50', icon: '🏡', target: 5, maxFlames: 5, spawnMs: 3000, flameHp: 3, desc: 'Put out 5 small fires!' },
  { name: 'Kitchen Fire', bg: '#FF9800', icon: '🍳', target: 10, maxFlames: 6, spawnMs: 2500, flameHp: 4, desc: 'Save the kitchen!' },
  { name: 'Forest Fire', bg: '#2E7D32', icon: '🌲', target: 18, maxFlames: 8, spawnMs: 2000, flameHp: 5, desc: 'Protect the forest!' },
  { name: 'City Blaze', bg: '#E65100', icon: '🏙️', target: 25, maxFlames: 10, spawnMs: 1500, flameHp: 6, desc: 'Save the city!' },
  { name: 'Volcano Escape', bg: '#B71C1C', icon: '🌋', target: 35, maxFlames: 12, spawnMs: 1200, flameHp: 7, desc: 'Survive the volcano!' },
]

export default function FireFighter({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [flames, setFlames] = useState<Flame[]>([])
  const [splashes, setSplashes] = useState<Splash[]>([])
  const [powerups, setPowerups] = useState<Powerup[]>([])
  const [score, setScore] = useState(0)
  const [levelIdx, setLevelIdx] = useState(0)
  const [lives, setLives] = useState(3)
  const [gameState, setGameState] = useState<'menu' | 'levelselect' | 'playing' | 'levelcomplete' | 'gameover'>('menu')
  const [spraying, setSpraying] = useState(false)
  const [hosePos, setHosePos] = useState({ x: 0, y: 0 })
  const [flamePut, setFlamePut] = useState(0)
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [activePowerup, setActivePowerup] = useState<string | null>(null)
  const [powerupTime, setPowerupTime] = useState(0)
  const [unlockedLevels, setUnlockedLevels] = useState(1)
  const [sprayRadius, setSprayRadius] = useState(55)
  const [sprayDamage, setSprayDamage] = useState(1)

  const gameRef = useRef<HTMLDivElement>(null)
  const flameIdRef = useRef(0)
  const splashIdRef = useRef(0)
  const powerupIdRef = useRef(0)
  const spawnTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const powerupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const level = LEVELS[levelIdx]

  const safeTimeout = useSafeTimeout()

  const cleanup = useCallback(() => {
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current)
    if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    if (powerupTimerRef.current) clearInterval(powerupTimerRef.current)
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
    spawnTimerRef.current = null; gameLoopRef.current = null; powerupTimerRef.current = null
  }, [])

  useEffect(() => cleanup, [cleanup])

  function spawnFlame() {
    const gameEl = gameRef.current; if (!gameEl) return
    const rect = gameEl.getBoundingClientRect()
    const x = 60 + Math.random() * (rect.width - 120)
    const y = 80 + Math.random() * (rect.height - 180)
    const isSpecial = Math.random() < 0.15 + levelIdx * 0.05
    const type: Flame['type'] = isSpecial ? (Math.random() > 0.5 ? 'big' : 'fast') : 'normal'
    const hp = type === 'big' ? level.flameHp * 2 : level.flameHp
    setFlames(prev => [...prev, {
      id: ++flameIdRef.current, x, y,
      size: type === 'big' ? 50 : 30 + Math.random() * 15,
      health: hp, maxHealth: hp, type
    }])
  }

  function spawnPowerup() {
    const gameEl = gameRef.current; if (!gameEl) return
    const rect = gameEl.getBoundingClientRect()
    const types: Powerup['type'][] = ['waterbomb', 'superhose', 'extralife']
    const type = types[Math.floor(Math.random() * types.length)]
    const x = 60 + Math.random() * (rect.width - 120)
    const y = 80 + Math.random() * (rect.height - 180)
    setPowerups(prev => [...prev, { id: ++powerupIdRef.current, x, y, type, timer: 6000 }])
    // Auto-remove after 6s
    const pid = powerupIdRef.current
    safeTimeout(() => setPowerups(prev => prev.filter(p => p.id !== pid)), 6000)
  }

  function startLevel(idx: number) {
    cleanup()
    setLevelIdx(idx)
    const lv = LEVELS[idx]
    setFlames([]); setSplashes([]); setPowerups([])
    setScore(0); setLives(3); setFlamePut(0); setCombo(0)
    setActivePowerup(null); setPowerupTime(0); setSprayRadius(55); setSprayDamage(1)
    setGameState('playing')
    playSound('success')
    speakText(lv.name + '! ' + lv.desc)

    safeTimeout(() => { for (let i = 0; i < 3; i++) safeTimeout(() => spawnFlame(), i * 300) }, 500)

    spawnTimerRef.current = setInterval(() => {
      setFlames(prev => { if (prev.length < lv.maxFlames) safeTimeout(() => spawnFlame(), 0); return prev })
    }, lv.spawnMs)

    // Powerup spawner
    powerupTimerRef.current = setInterval(() => {
      if (Math.random() < 0.4) spawnPowerup()
    }, 5000)

    gameLoopRef.current = setInterval(() => {
      setFlames(prev => {
        if (prev.length >= lv.maxFlames + 3) {
          setLives(l => { const nl = l - 1; if (nl <= 0) safeTimeout(() => setGameState('gameover'), 100); return nl })
        }
        return prev
      })
    }, 5000)
  }

  // Level complete check
  useEffect(() => {
    if (gameState === 'playing' && flamePut >= level.target) {
      cleanup()
      playSound('tada')
      speakText('Level complete! Great job!')
      setUnlockedLevels(u => Math.max(u, levelIdx + 2))
      safeTimeout(() => setGameState('levelcomplete'), 500)
    }
  }, [flamePut, gameState])

  function collectPowerup(p: Powerup) {
    setPowerups(prev => prev.filter(pp => pp.id !== p.id))
    playSound('tada')
    switch (p.type) {
      case 'waterbomb':
        // Damage all flames on screen
        setFlames(prev => {
          const damaged = prev.map(f => ({ ...f, health: f.health - 3 }))
          const alive = damaged.filter(f => f.health > 0)
          const killed = damaged.length - alive.length
          if (killed > 0) { setFlamePut(fp => fp + killed); setScore(s => s + killed * 15) }
          return alive
        })
        speakText('Water bomb!')
        break

      case 'superhose':
        setActivePowerup('superhose'); setPowerupTime(8); setSprayRadius(120); setSprayDamage(3)
        safeTimeout(() => { setActivePowerup(null); setSprayRadius(55); setSprayDamage(1) }, 8000)
        speakText('Super hose!')
        break
      case 'extralife':
        setLives(l => Math.min(l + 1, 5))
        speakText('Extra life!')
        break
    }
  }

  // Powerup countdown
  useEffect(() => {
    if (powerupTime <= 0) return
    const t = setInterval(() => setPowerupTime(p => { if (p <= 1) { clearInterval(t); return 0 }; return p - 1 }), 1000)
    return () => clearInterval(t)
  }, [powerupTime > 0])

  function getRelativePos(e: React.TouchEvent | React.MouseEvent) {
    const gameEl = gameRef.current; if (!gameEl) return { x: 0, y: 0 }
    const rect = gameEl.getBoundingClientRect()
    const [cx, cy] = 'touches' in e ? [e.touches[0].clientX, e.touches[0].clientY] : [e.clientX, e.clientY]
    return { x: cx - rect.left, y: cy - rect.top }
  }

  function handleSprayStart(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault(); setSpraying(true); const pos = getRelativePos(e); setHosePos(pos); sprayAt(pos)
  }
  function handleSprayMove(e: React.TouchEvent | React.MouseEvent) {
    if (!spraying) return; e.preventDefault(); const pos = getRelativePos(e); setHosePos(pos); sprayAt(pos)
  }
  function handleSprayEnd() { setSpraying(false) }

  function sprayAt(pos: { x: number; y: number }) {
    setSplashes(prev => [...prev, { id: ++splashIdRef.current, x: pos.x, y: pos.y }])
    const sid = splashIdRef.current
    safeTimeout(() => setSplashes(prev => prev.filter(s => s.id !== sid)), 400)

    // Check powerup pickups
    setPowerups(prev => {
      const remaining: Powerup[] = []
      prev.forEach(p => {
        if (Math.hypot(p.x - pos.x, p.y - pos.y) < 50) collectPowerup(p)
        else remaining.push(p)
      })
      return remaining
    })

    // Hit flames
    setFlames(prev => {
      let hit = false
      const updated = prev.map(f => {
        if (Math.hypot(f.x - pos.x, f.y - pos.y) < sprayRadius) {
          hit = true; return { ...f, health: f.health - sprayDamage }
        }
        return f
      })
      if (hit) playSound('click')
      const remaining = updated.filter(f => f.health > 0)
      const ext = updated.length - remaining.length
      if (ext > 0) {
        playSound('tada')
        setScore(s => s + ext * 10 * (1 + combo))
        setFlamePut(fp => fp + ext)
        setCombo(c => c + ext); setShowCombo(true)
        if (comboTimerRef.current) clearTimeout(comboTimerRef.current)
        comboTimerRef.current = setTimeout(() => { setCombo(0); setShowCombo(false) }, 2000)
      }
      return remaining
    })
  }

  const POWERUP_INFO: Record<string, { emoji: string; label: string }> = {
    waterbomb: { emoji: '💣', label: 'Water Bomb' },
    superhose: { emoji: '🌊', label: 'Super Hose' },
    extralife: { emoji: '💖', label: 'Extra Life' },
  }

  // ── Menu ──
  if (gameState === 'menu') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #fef5e7 0%, #ffecd2 50%, #fffde8 100%)', minHeight: '100vh', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={() => { playSound('click'); onBack() }} style={backBtn}>← Back</button>
          {pet && <span style={{ fontSize: 32 }}>{pet}</span>}
        </div>
        <div style={{ maxWidth: 450, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 24, padding: 30, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 70, marginBottom: 10 }}>🚒</div>
            <h1 style={{ fontSize: 28, color: '#e17055', margin: '0 0 10px 0', fontWeight: 800 }}>Fire Fighter!</h1>
            <p style={{ fontSize: 16, color: '#666', marginBottom: 8 }}>Spray water to put out fires!</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
              {Object.entries(POWERUP_INFO).map(([k, v]) => (
                <div key={k} style={{ textAlign: 'center', fontSize: 11, color: '#888' }}>
                  <div style={{ fontSize: 24 }}>{v.emoji}</div>{v.label}
                </div>
              ))}
            </div>
            <button onClick={() => setGameState('levelselect')} style={{
              background: '#e17055', color: '#fff', border: 'none',
              borderRadius: 18, padding: '18px 50px', fontSize: 20, fontWeight: 700, cursor: 'pointer'
            }}>🧑‍🚒 Select Level</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Level Select ──
  if (gameState === 'levelselect') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #fef5e7 0%, #ffecd2 50%, #fffde8 100%)', minHeight: '100vh', padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <button onClick={() => setGameState('menu')} style={backBtn}>← Back</button>
          <h2 style={{ color: '#2d3436', margin: 0, flex: 1, textAlign: 'center', fontSize: 20, fontWeight: 800 }}>Choose Level</h2>
        </div>
        <div style={{ maxWidth: 400, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LEVELS.map((lv, i) => {
            const locked = i + 1 > unlockedLevels
            return (
              <button key={i} onClick={() => !locked && startLevel(i)} disabled={locked} style={{
                background: locked ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.65)',
                border: locked ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.4)',
                borderRadius: 18, padding: '16px 20px', cursor: locked ? 'not-allowed': 'pointer',
                display: 'flex', alignItems: 'center', gap: 15, textAlign: 'left',
                opacity: locked ? 0.6 : 1, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)'
              }}>
                <span style={{ fontSize: 36 }}>{locked ? '🔒' : lv.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: locked ? '#b2bec3' : '#2d3436' }}>
                    Level {i + 1}: {lv.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>{lv.desc}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>🔥 Target: {lv.target} fires</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Level Complete ──
  if (gameState === 'levelcomplete') {
    const stars = flamePut >= level.target * 1.5 ? 3 : flamePut >= level.target * 1.2 ? 2 : 1
    const hasNext = levelIdx + 1 < LEVELS.length
    return (
      <div style={{ background: `linear-gradient(135deg, ${level.bg}44, #fffde8)`, minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 24, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 60 }}>{level.icon}</div>
          <h2 style={{ color: '#e17055', margin: '10px 0' }}>Level Complete!</h2>
          <div style={{ fontSize: 40, marginBottom: 10 }}>{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
          <p style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Score: {score}</p>
          <p style={{ fontSize: 14, color: '#666' }}>Fires: {flamePut} / {level.target}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' }}>
            <button onClick={() => startLevel(levelIdx)} style={playBtn}>🔄 Replay</button>
            {hasNext && <button onClick={() => startLevel(levelIdx + 1)} style={{
              ...playBtn, background: 'linear-gradient(135deg, #4CAF50, #66BB6A)'
            }}>▶ Next Level</button>}
            <button onClick={() => setGameState('levelselect')} style={{ ...playBtn, background: '#999' }}>📋 Levels</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Game Over ──
  if (gameState === 'gameover') {
    return (
      <div style={{ background: 'linear-gradient(135deg, #fef5e7 0%, #ffecd2 50%, #fffde8 100%)', minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 24, padding: 40, textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 60, marginBottom: 10 }}>🚒</div>
          <h2 style={{ color: '#e17055', margin: '0 0 10px 0' }}>Keep Trying!</h2>
          <p style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Score: {score}</p>
          <p style={{ fontSize: 14, color: '#666' }}>Fires: {flamePut} / {level.target}</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <button onClick={() => startLevel(levelIdx)} style={playBtn}>🔄 Try Again</button>
            <button onClick={() => setGameState('levelselect')} style={{ ...playBtn, background: '#999' }}>📋 Levels</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Playing ──
  return (
    <div ref={gameRef}
      onTouchStart={handleSprayStart} onTouchMove={handleSprayMove} onTouchEnd={handleSprayEnd}
      onMouseDown={handleSprayStart} onMouseMove={handleSprayMove} onMouseUp={handleSprayEnd} onMouseLeave={handleSprayEnd}
      style={{
        background: `linear-gradient(180deg, #1a1a2e 0%, ${level.bg}44 60%, ${level.bg}88 100%)`,
        minHeight: '100vh', position: 'relative', overflow: 'hidden',
        touchAction: 'none', cursor: spraying ? 'none' : 'crosshair'
      }}>
      {/* HUD */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.5)', zIndex: 10 }}>
        <button onClick={() => { cleanup(); setGameState('levelselect') }} style={{ background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 20, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 'bold', color: '#fff' }}>← Quit</button>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ color: '#FFD700', fontWeight: 'bold', fontSize: 14 }}>⭐{score}</span>
          <span style={{ color: '#FF6B35', fontWeight: 'bold', fontSize: 14 }}>Lv.{levelIdx + 1}</span>
          <span style={{ color: '#fff', fontSize: 12 }}>🔥{flamePut}/{level.target}</span>
          <span style={{ color: '#FF4444', fontWeight: 'bold', fontSize: 14 }}>{'❤️'.repeat(Math.max(0, lives))}</span>
        </div>
      </div>

      {/* Active powerup indicator */}
      {activePowerup && (
        <div style={{ position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.6)', borderRadius: 20, padding: '6px 16px', zIndex: 10, color: '#fff', fontSize: 14, fontWeight: 'bold' }}>
          {POWERUP_INFO[activePowerup].emoji} {POWERUP_INFO[activePowerup].label} ({powerupTime}s)
        </div>
      )}

      {/* Progress bar */}
      <div style={{ position: 'absolute', top: 44, left: 15, right: 15, height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3, zIndex: 10 }}>
        <div style={{ height: '100%', width: `${Math.min(100, (flamePut / level.target) * 100)}%`, background: 'linear-gradient(90deg, #FFD54F, #FF8F00)', borderRadius: 3, transition: 'width 0.3s' }} />
      </div>

      {/* Flames */}
      {flames.map(flame => {
        const hpPct = flame.health / flame.maxHealth
        return (
          <div key={flame.id} style={{
            position: 'absolute', left: flame.x - flame.size / 2, top: flame.y - flame.size / 2,
            fontSize: flame.size * (0.8 + hpPct * 0.4), pointerEvents: 'none',
            filter: hpPct < 0.5 ? 'brightness(0.7)' : 'none',
            animation: flame.type === 'fast' ? 'flameWiggle 0.15s ease-in-out infinite alternate' : 'flameWiggle 0.3s ease-in-out infinite alternate',
          }}>
            {flame.type === 'big' ? '🔥🔥' : '🔥'}
            <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 30, height: 4, background: 'rgba(0,0,0,0.4)', borderRadius: 2 }}>
              <div style={{ width: `${hpPct * 100}%`, height: '100%', background: hpPct > 0.5 ? '#FF6B35' : '#FF4444', borderRadius: 2, transition: 'width 0.2s' }} />
            </div>
          </div>
        )
      })}

      {/* Powerup pickups */}
      {powerups.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.x - 22, top: p.y - 22, fontSize: 40,
          animation: 'powerupBounce 0.6s ease-in-out infinite alternate',
          pointerEvents: 'none', filter: 'drop-shadow(0 0 8px rgba(255,255,0,0.6))', zIndex: 4
        }}>{POWERUP_INFO[p.type].emoji}</div>
      ))}

      {/* Splashes */}
      {splashes.map(s => (
        <div key={s.id} style={{ position: 'absolute', left: s.x - 15, top: s.y - 15, fontSize: activePowerup === 'superhose' ? 36 : 28, pointerEvents: 'none', animation: 'splashFade 0.4s ease-out forwards' }}>💦</div>
      ))}

      {/* Hose cursor */}
      {spraying && (
        <div style={{ position: 'absolute', left: hosePos.x - 20, top: hosePos.y - 20, fontSize: 36, pointerEvents: 'none', filter: 'drop-shadow(0 0 8px rgba(100,180,255,0.6))', zIndex: 5 }}>🚿</div>
      )}

      {/* Combo */}
      {showCombo && combo > 1 && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 28, fontWeight: 'bold', color: '#FFD700', textShadow: '0 0 10px rgba(255,215,0,0.8)', pointerEvents: 'none', zIndex: 10, animation: 'ffComboPopIn 0.3s ease-out' }}>
          🔥 x{combo} COMBO! 🔥
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: 12, opacity: 0.5, pointerEvents: 'none', zIndex: 5 }}>
        🧯 {flamePut}/{level.target} fires — {level.name}
      </div>

    </div>
  )
}

const playBtn: React.CSSProperties = {
  background: '#e17055', color: '#fff', border: 'none',
  borderRadius: 16, padding: '15px 30px', fontSize: 16, fontWeight: 700, cursor: 'pointer'
}
