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

// Recipe-based paint mixing (subtractive color mixing like real paint!)
interface MixResult { r: number; g: number; b: number; name: string; emoji: string; paletteId: string }

const MIX_RECIPES: Record<string, MixResult> = {
  // Primary paint mixes
  'blue+red': { r: 150, g: 50, b: 200, name: 'Purple', emoji: '🟣', paletteId: 'purple' },
  'blue+yellow': { r: 50, g: 180, b: 60, name: 'Green', emoji: '🟢', paletteId: 'green' },
  'red+yellow': { r: 255, g: 140, b: 30, name: 'Orange', emoji: '🟠', paletteId: 'orange' },
  // White mixes (tinting)
  'red+white': { r: 240, g: 150, b: 150, name: 'Pink', emoji: '🩷', paletteId: 'red' },
  'blue+white': { r: 145, g: 175, b: 240, name: 'Light Blue', emoji: '🩵', paletteId: 'blue' },
  'green+white': { r: 150, g: 215, b: 150, name: 'Mint', emoji: '🟢', paletteId: 'green' },
  'purple+white': { r: 190, g: 150, b: 220, name: 'Lavender', emoji: '🟣', paletteId: 'purple' },
  'orange+white': { r: 255, g: 200, b: 160, name: 'Peach', emoji: '🟠', paletteId: 'orange' },
  'yellow+white': { r: 255, g: 255, b: 200, name: 'Cream', emoji: '🟡', paletteId: 'yellow' },
  'black+white': { r: 140, g: 140, b: 140, name: 'Gray', emoji: '⚪', paletteId: 'white' },
  // Black mixes (shading)
  'black+red': { r: 128, g: 40, b: 40, name: 'Maroon', emoji: '🔴', paletteId: 'red' },
  'black+blue': { r: 35, g: 35, b: 128, name: 'Navy', emoji: '🔵', paletteId: 'blue' },
  'black+green': { r: 40, g: 90, b: 30, name: 'Dark Green', emoji: '🟢', paletteId: 'green' },
  'black+yellow': { r: 128, g: 128, b: 0, name: 'Olive', emoji: '🟢', paletteId: 'green' },
  'black+orange': { r: 139, g: 69, b: 19, name: 'Brown', emoji: '🟤', paletteId: 'orange' },
  'black+purple': { r: 75, g: 25, b: 100, name: 'Dark Purple', emoji: '🟣', paletteId: 'purple' },
  // Secondary combinations
  'green+red': { r: 140, g: 90, b: 40, name: 'Brown', emoji: '🟤', paletteId: 'orange' },
  'blue+orange': { r: 100, g: 90, b: 80, name: 'Brown', emoji: '🟤', paletteId: 'orange' },
  'purple+yellow': { r: 140, g: 90, b: 40, name: 'Brown', emoji: '🟤', paletteId: 'orange' },
  'blue+green': { r: 45, g: 140, b: 145, name: 'Teal', emoji: '🩵', paletteId: 'blue' },
  'green+yellow': { r: 152, g: 205, b: 55, name: 'Lime', emoji: '🟢', paletteId: 'green' },
  'orange+yellow': { r: 255, g: 200, b: 0, name: 'Gold', emoji: '🟡', paletteId: 'yellow' },
  'orange+red': { r: 220, g: 80, b: 30, name: 'Red Orange', emoji: '🟠', paletteId: 'orange' },
  'purple+red': { r: 200, g: 30, b: 150, name: 'Magenta', emoji: '🟣', paletteId: 'purple' },
  'blue+purple': { r: 60, g: 50, b: 200, name: 'Indigo', emoji: '🔵', paletteId: 'blue' },
  'green+orange': { r: 140, g: 130, b: 30, name: 'Olive', emoji: '🟢', paletteId: 'green' },
  'green+purple': { r: 100, g: 80, b: 80, name: 'Brown', emoji: '🟤', paletteId: 'orange' },
  'orange+purple': { r: 160, g: 70, b: 90, name: 'Plum', emoji: '🟣', paletteId: 'purple' },
}

function getMixKey(a: string, b: string): string {
  return [a, b].sort().join('+')
}

function mixColors(colors: ColorDef[]): { r: number; g: number; b: number; name: string; emoji: string } {
  if (colors.length === 0) return { r: 200, g: 200, b: 200, name: '', emoji: '' }
  if (colors.length === 1) return { r: colors[0].r, g: colors[0].g, b: colors[0].b, name: '', emoji: '' }
  // All same color → no mix
  if (colors.every(c => c.id === colors[0].id)) {
    return { r: colors[0].r, g: colors[0].g, b: colors[0].b, name: '', emoji: '' }
  }

  let curId = colors[0].id
  let curR = colors[0].r, curG = colors[0].g, curB = colors[0].b
  let curName = '', curEmoji = ''

  for (let i = 1; i < colors.length; i++) {
    const nextId = colors[i].id
    if (curId === nextId) continue
    const key = getMixKey(curId, nextId)
    const recipe = MIX_RECIPES[key]
    if (recipe) {
      curR = recipe.r; curG = recipe.g; curB = recipe.b
      curName = recipe.name; curEmoji = recipe.emoji
      curId = recipe.paletteId
    } else {
      curR = Math.round((curR + colors[i].r) / 2)
      curG = Math.round((curG + colors[i].g) / 2)
      curB = Math.round((curB + colors[i].b) / 2)
      curName = 'Mystery Mix'; curEmoji = '🎨'
      curId = closestPaletteId(curR, curG, curB)
    }
  }
  return { r: curR, g: curG, b: curB, name: curName, emoji: curEmoji }
}

function closestPaletteId(r: number, g: number, b: number): string {
  let bestId = 'red', bestDist = Infinity
  for (const c of PALETTE) {
    const d = colorDist(r, g, b, c.r, c.g, c.b)
    if (d < bestDist) { bestDist = d; bestId = c.id }
  }
  return bestId
}

// Named colors for discovery
interface NamedColor { name: string; r: number; g: number; b: number; emoji: string; threshold: number }
const NAMED_COLORS: NamedColor[] = [
  // Primary mixes
  { name: 'Purple', r: 150, g: 50, b: 200, emoji: '🟣', threshold: 60 },
  { name: 'Green', r: 50, g: 180, b: 60, emoji: '🟢', threshold: 60 },
  { name: 'Orange', r: 255, g: 140, b: 30, emoji: '🟠', threshold: 50 },
  // White mixes
  { name: 'Pink', r: 240, g: 150, b: 150, emoji: '🩷', threshold: 60 },
  { name: 'Light Blue', r: 145, g: 175, b: 240, emoji: '🩵', threshold: 60 },
  { name: 'Mint', r: 150, g: 215, b: 150, emoji: '🟢', threshold: 55 },
  { name: 'Lavender', r: 190, g: 150, b: 220, emoji: '🟣', threshold: 55 },
  { name: 'Peach', r: 255, g: 200, b: 160, emoji: '🟠', threshold: 50 },
  { name: 'Cream', r: 255, g: 255, b: 200, emoji: '🟡', threshold: 55 },
  { name: 'Gray', r: 140, g: 140, b: 140, emoji: '⚪', threshold: 55 },
  // Black mixes
  { name: 'Maroon', r: 128, g: 40, b: 40, emoji: '🔴', threshold: 50 },
  { name: 'Navy', r: 35, g: 35, b: 128, emoji: '🔵', threshold: 50 },
  { name: 'Dark Green', r: 40, g: 90, b: 30, emoji: '🟢', threshold: 55 },
  { name: 'Olive', r: 128, g: 128, b: 0, emoji: '🟢', threshold: 55 },
  { name: 'Brown', r: 140, g: 90, b: 40, emoji: '🟤', threshold: 55 },
  { name: 'Dark Purple', r: 75, g: 25, b: 100, emoji: '🟣', threshold: 50 },
  // Secondary mixes
  { name: 'Teal', r: 45, g: 140, b: 145, emoji: '🩵', threshold: 55 },
  { name: 'Lime', r: 152, g: 205, b: 55, emoji: '🟢', threshold: 50 },
  { name: 'Gold', r: 255, g: 200, b: 0, emoji: '🟡', threshold: 50 },
  { name: 'Red Orange', r: 220, g: 80, b: 30, emoji: '🟠', threshold: 50 },
  { name: 'Magenta', r: 200, g: 30, b: 150, emoji: '🟣', threshold: 55 },
  { name: 'Indigo', r: 60, g: 50, b: 200, emoji: '🔵', threshold: 55 },
  { name: 'Plum', r: 160, g: 70, b: 90, emoji: '🟣', threshold: 50 },
]

function colorDist(r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2)
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
        const mix = mixColors(newSel)
        if (mix.name && mix.name !== 'Mystery Mix') {
          playSound('tada')
          speakText(`You made ${mix.name}!`)
          if (!discovered.includes(mix.name)) setDiscovered(d => [...d, mix.name])
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

  const mix = mixColors(selected)
  const mixHex = toHex(mix.r, mix.g, mix.b)
  const freeHex = toHex(freeR, freeG, freeB)
  const freeName = findClosestName(freeR, freeG, freeB)

  return (
    <div style={{ background: 'linear-gradient(135deg, #fce4ec 0%, #f3eeff 50%, #eef0ff 100%)', minHeight: '100vh', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 16, padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#2d3436' }}>← Back</button>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => { setMode('mix'); playSound('click') }} style={{ background: mode === 'mix' ? '#6c5ce7' : 'rgba(108,92,231,0.12)', color: mode === 'mix' ? '#fff' : '#6c5ce7', border: 'none', borderRadius: 14, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🎨 Mix</button>
          <button onClick={() => { setMode('free'); playSound('click') }} style={{ background: mode === 'free' ? '#6c5ce7' : 'rgba(108,92,231,0.12)', color: mode === 'free' ? '#fff' : '#6c5ce7', border: 'none', borderRadius: 14, padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>🌈 Free</button>
        </div>
        {pet && <span style={{ fontSize: 28 }}>{pet}</span>}
      </div>

      <div style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, color: '#6c5ce7', margin: '0 0 8px 0', fontWeight: 800 }}>🎨 Color Mixer</h2>

        {mode === 'free' ? (
          /* Free color creator mode */
          <div>
            <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px 0' }}>Slide to make any colour!</p>
            <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 24, padding: 20, marginBottom: 15, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 100, height: 100, borderRadius: '50%', margin: '0 auto 15px', background: freeHex, boxShadow: `0 6px 20px ${freeHex}66`, border: '2px solid #fff' }} />
              {freeName && <div style={{ fontSize: 18, fontWeight: 700, color: '#2d3436', marginBottom: 10 }}>{freeName.emoji} {freeName.name}</div>}
              <div style={{ fontSize: 12, color: '#b2bec3', marginBottom: 15 }}>{freeHex}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: '🔴 Red', value: freeR, set: setFreeR, color: '#F44336' },
                  { label: '🟢 Green', value: freeG, set: setFreeG, color: '#4CAF50' },
                  { label: '🔵 Blue', value: freeB, set: setFreeB, color: '#2196F3' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, width: 75, textAlign: 'left' }}>{s.label}</span>
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
                    border: selCount > 0 ? '3px solid #2d3436' : '2px solid rgba(255,255,255,0.7)',
                    cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                    transform: selCount > 0 ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: selCount > 0 ? `0 4px 16px ${hex}88` : `0 2px 8px ${hex}44`
                  }}>
                    {selCount > 1 && <span style={{ position: 'absolute', top: -6, right: -6, background: '#2d3436', color: '#fff', borderRadius: '50%', width: 20, height: 20, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>x{selCount}</span>}
                  </button>
                )
              })}
            </div>

            {/* Selected display */}
            {selected.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
                {selected.map((c, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span style={{ fontSize: 20, color: '#6c5ce7' }}>+</span>}
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: toHex(c.r, c.g, c.b), border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }} />
                  </React.Fragment>
                ))}
                <span style={{ fontSize: 20, color: '#6c5ce7', marginLeft: 6 }}>=</span>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: mixHex, border: '2px solid #fff', boxShadow: `0 4px 12px ${mixHex}66` }} />
              </div>
            )}

            {/* Result */}
            {showResult && (
              <div style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 24, padding: 20, marginBottom: 15, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', animation: 'fadeIn 0.4s ease' }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 10px', background: `radial-gradient(circle at 35% 35%, ${mixHex}cc, ${mixHex})`, boxShadow: `0 6px 20px ${mixHex}66` }} />
                {mix.name ? (
                  <h3 style={{ color: mixHex, margin: '0 0 5px 0', fontSize: 20 }}>{mix.emoji} {mix.name}!</h3>
                ) : (
                  <h3 style={{ color: '#666', margin: '0 0 5px 0', fontSize: 18 }}>New Colour!</h3>
                )}
                <p style={{ color: '#888', margin: 0, fontSize: 13 }}>{mixHex}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                  <button onClick={resetMix} style={{ background: '#6c5ce7', color: '#fff', border: 'none', borderRadius: 14, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>🔄 New Mix</button>
                  {selected.length < 4 && <button onClick={addMore} style={{ background: '#00b894', color: '#fff', border: 'none', borderRadius: 14, padding: '10px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Add More</button>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Discovered */}
        <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: 12, marginTop: 8 }}>
          <h3 style={{ color: '#6c5ce7', margin: '0 0 8px 0', fontSize: 15, fontWeight: 700 }}>🏆 Discovered ({discovered.length}/{NAMED_COLORS.length})</h3>
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
