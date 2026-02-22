import React, { useState, useRef, useEffect } from 'react'
import { playSound, speakText } from '../utils/sounds'

interface ColorDef { id: string; name: string; r: number; g: number; b: number; emoji: string }

const PALETTE: ColorDef[] = [
  { id: 'red', name: 'Red', r: 230, g: 50, b: 50, emoji: '🔴' },
  { id: 'blue', name: 'Blue', r: 40, g: 100, b: 230, emoji: '🔵' },
  { id: 'yellow', name: 'Yellow', r: 255, g: 230, b: 50, emoji: '🟡' },
  { id: 'white', name: 'White', r: 250, g: 250, b: 250, emoji: '⚪' },
  { id: 'black', name: 'Black', r: 30, g: 30, b: 30, emoji: '⚫' },
  { id: 'green', name: 'Green', r: 50, g: 180, b: 60, emoji: '🟢' },
  { id: 'orange', name: 'Orange', r: 255, g: 140, b: 30, emoji: '🟠' },
  { id: 'purple', name: 'Purple', r: 150, g: 50, b: 200, emoji: '🟣' },
]

// Named colors for discovery
interface NamedColor { name: string; r: number; g: number; b: number; emoji: string; threshold: number }
const NAMED_COLORS: NamedColor[] = [
  { name: 'Pink', r: 240, g: 150, b: 150, emoji: '🩷', threshold: 60 },
  { name: 'Light Blue', r: 145, g: 175, b: 240, emoji: '🩵', threshold: 60 },
  { name: 'Orange', r: 242, g: 140, b: 50, emoji: '🟠', threshold: 50 },
  { name: 'Purple', r: 135, g: 75, b: 215, emoji: '🟣', threshold: 60 },
  { name: 'Green', r: 145, g: 190, b: 55, emoji: '🟢', threshold: 60 },
  { name: 'Brown', r: 140, g: 90, b: 40, emoji: '🟤', threshold: 55 },
  { name: 'Teal', r: 45, g: 140, b: 145, emoji: '🩵', threshold: 55 },
  { name: 'Coral', r: 240, g: 128, b: 128, emoji: '🩷', threshold: 50 },
  { name: 'Lime', r: 152, g: 205, b: 55, emoji: '🟢', threshold: 50 },
  { name: 'Lavender', r: 190, g: 150, b: 220, emoji: '🟣', threshold: 50 },
  { name: 'Peach', r: 255, g: 200, b: 160, emoji: '🟠', threshold: 50 },
  { name: 'Sky Blue', r: 100, g: 175, b: 240, emoji: '🔵', threshold: 55 },
  { name: 'Olive', r: 128, g: 128, b: 0, emoji: '🟢', threshold: 55 },
  { name: 'Maroon', r: 128, g: 40, b: 40, emoji: '🔴', threshold: 50 },
  { name: 'Navy', r: 35, g: 35, b: 128, emoji: '🔵', threshold: 50 },
  { name: 'Gold', r: 255, g: 200, b: 0, emoji: '🟡', threshold: 50 },
  { name: 'Turquoise', r: 64, g: 224, b: 208, emoji: '🩵', threshold: 55 },
  { name: 'Magenta', r: 255, g: 0, b: 255, emoji: '🟣', threshold: 55 },
]

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
}

function mixRGB(colors: ColorDef[]): { r: number; g: number; b: number } {
  if (colors.length === 0) return { r: 200, g: 200, b: 200 }
  // Subtractive color mixing approximation
  let r = 0, g = 0, b = 0
  colors.forEach(c => { r += c.r; g += c.g; b += c.b })
  r = Math.round(r / colors.length)
  g = Math.round(g / colors.length)
  b = Math.round(b / colors.length)
  return { r, g, b }
}

function findClosestName(r: number, g: number, b: number): NamedColor | null {
  let best: NamedColor | null = null
  let bestDist = Infinity
  for (const nc of NAMED_COLORS) {
    const d = colorDist(r, g, b, nc.r, nc.g, nc.b)
    if (d < nc.threshold && d < bestDist) { best = nc; bestDist = d }
  }
  return best
}

function toHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')
}

export default function ColorMixer({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [selected, setSelected] = useState<ColorDef[]>([])
  const [showResult, setShowResult] = useState(false)
  const [discovered, setDiscovered] = useState<string[]>([])
  const [animating, setAnimating] = useState(false)
  const [mode, setMode] = useState<'mix' | 'free'>('mix')
  const [freeR, setFreeR] = useState(128)
  const [freeG, setFreeG] = useState(128)
  const [freeB, setFreeB] = useState(128)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)) }
  }, [])
  function safeTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms); timersRef.current.push(id); return id
  }

  function handleColorTap(color: ColorDef) {
    if (animating || selected.length >= 4) return
    playSound('click')
    const newSel = [...selected, color]
    setSelected(newSel)

    if (newSel.length >= 2) {
      setAnimating(true)
      safeTimeout(() => {
        setShowResult(true)
        const mix = mixRGB(newSel)
        const match = findClosestName(mix.r, mix.g, mix.b)
        if (match) {
          playSound('tada')
          speakText(`You made ${match.name}!`)
          if (!discovered.includes(match.name)) setDiscovered(d => [...d, match.name])
        } else {
          playSound('success')
          speakText('Interesting colour!')
        }
        setAnimating(false)
      }, 500)
    }
  }

  function resetMix() {
    setSelected([]); setShowResult(false); playSound('click')
  }

  function addMore() {
    setShowResult(false)
  }

  const mix = mixRGB(selected)
  const mixHex = toHex(mix.r, mix.g, mix.b)
  const matchedName = findClosestName(mix.r, mix.g, mix.b)
  const freeHex = toHex(freeR, freeG, freeB)
  const freeName = findClosestName(freeR, freeG, freeB)

  return (
    <div style={{ background: 'linear-gradient(135deg, #FCE4EC 0%, #F3E5F5 50%, #E8EAF6 100%)', minHeight: '100vh', padding: 20, fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #7B1FA2', borderRadius: 25, padding: '12px 20px', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', color: '#7B1FA2' }}>← Back</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setMode('mix'); playSound('click') }} style={{ background: mode === 'mix' ? '#7B1FA2' : '#E1BEE7', color: mode === 'mix' ? '#fff' : '#7B1FA2', border: 'none', borderRadius: 15, padding: '8px 14px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>🎨 Mix</button>
          <button onClick={() => { setMode('free'); playSound('click') }} style={{ background: mode === 'free' ? '#7B1FA2' : '#E1BEE7', color: mode === 'free' ? '#fff' : '#7B1FA2', border: 'none', borderRadius: 15, padding: '8px 14px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer' }}>🌈 Free</button>
        </div>
        {pet && <span style={{ fontSize: 28 }}>{pet}</span>}
      </div>

      <div style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, color: '#7B1FA2', margin: '0 0 8px 0' }}>🎨 Color Mixer</h2>

        {mode === 'free' ? (
          /* Free color creator mode */
          <div>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px 0' }}>Slide to make any colour!</p>
            <div style={{ background: '#fff', borderRadius: 25, padding: 20, marginBottom: 15, boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 15px', background: freeHex, boxShadow: `0 6px 20px ${freeHex}66`, border: '4px solid #fff' }} />
              {freeName && <div style={{ fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 10 }}>{freeName.emoji} {freeName.name}</div>}
              <div style={{ fontSize: 12, color: '#999', marginBottom: 15 }}>{freeHex}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: '🔴 Red', value: freeR, set: setFreeR, color: '#F44336' },
                  { label: '🟢 Green', value: freeG, set: setFreeG, color: '#4CAF50' },
                  { label: '🔵 Blue', value: freeB, set: setFreeB, color: '#2196F3' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 'bold', width: 75, textAlign: 'left' }}>{s.label}</span>
                    <input type="range" min={0} max={255} value={s.value}
                      onChange={e => s.set(Number(e.target.value))}
                      style={{ flex: 1, accentColor: s.color, height: 24 }} />
                    <span style={{ fontSize: 12, color: '#888', width: 30, textAlign: 'right' }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Mix mode */
          <div>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px 0' }}>Pick 2-4 colours to mix!</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 15, flexWrap: 'wrap' }}>
              {PALETTE.map(color => {
                const hex = toHex(color.r, color.g, color.b)
                const selCount = selected.filter(s => s.id === color.id).length
                return (
                  <button key={color.id} onClick={() => handleColorTap(color)} style={{
                    width: 60, height: 60, borderRadius: '50%',
                    background: `radial-gradient(circle at 35% 35%, ${hex}cc, ${hex})`,
                    border: selCount > 0 ? '4px solid #333' : '3px solid rgba(255,255,255,0.8)',
                    cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                    transform: selCount > 0 ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: selCount > 0 ? `0 4px 16px ${hex}88` : `0 2px 8px ${hex}44`
                  }}>
                    {selCount > 1 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#333', color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x{selCount}</span>}
                  </button>
                )
              })}
            </div>

            {/* Selected display */}
            {selected.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {selected.map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ fontSize: 20, color: '#7B1FA2' }}>+</span>}
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: toHex(c.r, c.g, c.b), border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
                  </React.Fragment>
                ))}
                <span style={{ fontSize: 20, color: '#7B1FA2', marginLeft: 6 }}>=</span>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: mixHex, border: '3px solid #fff', boxShadow: `0 4px 12px ${mixHex}66` }} />
              </div>
            )}

            {/* Result */}
            {showResult && (
              <div style={{ background: '#fff', borderRadius: 25, padding: 20, marginBottom: 15, boxShadow: '0 8px 30px rgba(0,0,0,0.1)', animation: 'fadeIn 0.4s ease' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 10px', background: `radial-gradient(circle at 35% 35%, ${mixHex}cc, ${mixHex})`, boxShadow: `0 6px 20px ${mixHex}66` }} />
                {matchedName ? (
                  <h3 style={{ color: mixHex, margin: '0 0 5px 0', fontSize: 20 }}>{matchedName.emoji} {matchedName.name}!</h3>
                ) : (
                  <h3 style={{ color: '#666', margin: '0 0 5px 0', fontSize: 18 }}>New Colour!</h3>
                )}
                <p style={{ color: '#888', margin: 0, fontSize: 13 }}>{mixHex}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                  <button onClick={resetMix} style={{ background: 'linear-gradient(135deg, #AB47BC, #7B1FA2)', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 22px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>🔄 New Mix</button>
                  {selected.length < 4 && <button onClick={addMore} style={{ background: 'linear-gradient(135deg, #4CAF50, #66BB6A)', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 22px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>+ Add More</button>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Discovered */}
        <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: 12, marginTop: 8 }}>
          <h3 style={{ color: '#7B1FA2', margin: '0 0 8px 0', fontSize: 15 }}>🏆 Discovered ({discovered.length}/{NAMED_COLORS.length})</h3>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            {NAMED_COLORS.map(nc => (
              <div key={nc.name} title={nc.name} style={{
                width: 32, height: 32, borderRadius: '50%',
                background: discovered.includes(nc.name) ? toHex(nc.r, nc.g, nc.b) : '#E0E0E0',
                border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, transition: 'all 0.3s'
              }}>
                {discovered.includes(nc.name) ? <span style={{ fontSize: 10 }}>✓</span> : '?'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
