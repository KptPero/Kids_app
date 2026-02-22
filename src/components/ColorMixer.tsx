import React, { useState, useRef } from 'react'
import { playSound, speakText } from '../utils/sounds'

interface ColorBlob {
  id: string
  name: string
  hex: string
  emoji: string
}

interface MixResult {
  color1: string
  color2: string
  result: string
  resultName: string
  resultHex: string
  emoji: string
}

const COLORS: ColorBlob[] = [
  { id: 'red', name: 'Red', hex: '#F44336', emoji: '🔴' },
  { id: 'blue', name: 'Blue', hex: '#2196F3', emoji: '🔵' },
  { id: 'yellow', name: 'Yellow', hex: '#FFEB3B', emoji: '🟡' },
  { id: 'white', name: 'White', hex: '#FAFAFA', emoji: '⚪' },
]

const MIXES: MixResult[] = [
  { color1: 'red', color2: 'blue', result: 'purple', resultName: 'Purple', resultHex: '#9C27B0', emoji: '🟣' },
  { color1: 'red', color2: 'yellow', result: 'orange', resultName: 'Orange', resultHex: '#FF9800', emoji: '🟠' },
  { color1: 'blue', color2: 'yellow', result: 'green', resultName: 'Green', resultHex: '#4CAF50', emoji: '🟢' },
  { color1: 'red', color2: 'white', result: 'pink', resultName: 'Pink', resultHex: '#E91E63', emoji: '🩷' },
  { color1: 'blue', color2: 'white', result: 'lightblue', resultName: 'Light Blue', resultHex: '#03A9F4', emoji: '🩵' },
]

export default function ColorMixer({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [selected, setSelected] = useState<string[]>([])
  const [mixResult, setMixResult] = useState<MixResult | null>(null)
  const [showMix, setShowMix] = useState(false)
  const [discovered, setDiscovered] = useState<string[]>([])
  const [animating, setAnimating] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  function safeTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  function handleColorTap(colorId: string) {
    if (animating) return
    if (selected.includes(colorId)) {
      setSelected(selected.filter(c => c !== colorId))
      return
    }
    playSound('click')
    const newSelected = [...selected, colorId]
    setSelected(newSelected)

    if (newSelected.length === 2) {
      const [a, b] = newSelected
      const mix = MIXES.find(m =>
        (m.color1 === a && m.color2 === b) || (m.color1 === b && m.color2 === a)
      )
      setAnimating(true)
      safeTimeout(() => {
        if (mix) {
          setMixResult(mix)
          setShowMix(true)
          playSound('tada')
          speakText(`${COLORS.find(c => c.id === a)?.name} and ${COLORS.find(c => c.id === b)?.name} make ${mix.resultName}!`)
          if (!discovered.includes(mix.result)) {
            setDiscovered([...discovered, mix.result])
          }
        } else {
          setMixResult(null)
          setShowMix(true)
          playSound('click')
          speakText('Hmm, try a different combination!')
        }
        safeTimeout(() => {
          setAnimating(false)
        }, 200)
      }, 600)
    }
  }

  function resetMix() {
    setSelected([])
    setMixResult(null)
    setShowMix(false)
    playSound('click')
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #FCE4EC 0%, #F3E5F5 50%, #E8EAF6 100%)', minHeight: '100vh', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #7B1FA2', borderRadius: 25, padding: '12px 20px', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', color: '#7B1FA2' }}>← Back</button>
        {pet && <div style={{ fontSize: 28 }}>{pet}</div>}
      </div>

      <div style={{ maxWidth: 420, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, color: '#7B1FA2', margin: '0 0 8px 0' }}>🎨 Color Mixer</h2>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 15px 0' }}>Pick two colours to mix them!</p>

        {/* Color palette */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 15, marginBottom: 20, flexWrap: 'wrap' }}>
          {COLORS.map(color => {
            const isSelected = selected.includes(color.id)
            return (
              <button key={color.id} onClick={() => handleColorTap(color.id)} style={{
                width: 80, height: 80, borderRadius: '50%',
                background: `radial-gradient(circle at 35% 35%, ${color.hex}cc, ${color.hex})`,
                border: isSelected ? '4px solid #333' : '4px solid rgba(255,255,255,0.7)',
                cursor: 'pointer', transition: 'all 0.2s',
                transform: isSelected ? 'scale(1.2)' : 'scale(1)',
                boxShadow: isSelected ? `0 6px 20px ${color.hex}88` : `0 3px 10px ${color.hex}44`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                <span style={{ fontSize: 24 }}>{color.emoji}</span>
              </button>
            )
          })}
        </div>

        {/* Selected colors display */}
        {selected.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 15 }}>
            {selected.map((id, i) => {
              const c = COLORS.find(col => col.id === id)!
              return (
                <React.Fragment key={id}>
                  <div style={{ width: 50, height: 50, borderRadius: '50%', background: c.hex, border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                  {i === 0 && selected.length === 1 && <span style={{ fontSize: 28, color: '#999' }}>+ ?</span>}
                  {i === 0 && selected.length === 2 && <span style={{ fontSize: 28, color: '#7B1FA2' }}>+</span>}
                </React.Fragment>
              )
            })}
          </div>
        )}

        {/* Mix result */}
        {showMix && (
          <div style={{
            background: '#fff', borderRadius: 25, padding: 25, marginBottom: 20,
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
            animation: 'fadeIn 0.5s ease'
          }}>
            {mixResult ? (
              <>
                <div style={{ fontSize: 50, marginBottom: 8 }}>{mixResult.emoji}</div>
                <div style={{ width: 80, height: 80, borderRadius: '50%', margin: '0 auto 10px',
                  background: `radial-gradient(circle at 35% 35%, ${mixResult.resultHex}cc, ${mixResult.resultHex})`,
                  boxShadow: `0 6px 20px ${mixResult.resultHex}66`
                }} />
                <h3 style={{ color: mixResult.resultHex, margin: '0 0 5px 0', fontSize: 22 }}>{mixResult.resultName}!</h3>
                <p style={{ color: '#666', margin: 0, fontSize: 14 }}>
                  {COLORS.find(c => c.id === selected[0])?.name} + {COLORS.find(c => c.id === selected[1])?.name} = {mixResult.resultName}
                </p>
              </>
            ) : (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🤔</div>
                <p style={{ color: '#999', margin: 0, fontSize: 16 }}>These colours don't mix! Try another pair.</p>
              </>
            )}
            <button onClick={resetMix} style={{
              marginTop: 15, background: 'linear-gradient(135deg, #AB47BC, #7B1FA2)', color: '#fff',
              border: 'none', borderRadius: 25, padding: '12px 28px', fontSize: 15, fontWeight: 'bold', cursor: 'pointer'
            }}>🔄 Mix Again</button>
          </div>
        )}

        {/* Discovered colours */}
        <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 20, padding: 15, marginTop: 10 }}>
          <h3 style={{ color: '#7B1FA2', margin: '0 0 10px 0', fontSize: 16 }}>🏆 Colours Discovered ({discovered.length}/{MIXES.length})</h3>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {MIXES.map(mix => (
              <div key={mix.result} style={{
                width: 40, height: 40, borderRadius: '50%',
                background: discovered.includes(mix.result) ? mix.resultHex : '#E0E0E0',
                border: '3px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: discovered.includes(mix.result) ? `0 3px 10px ${mix.resultHex}44` : 'none',
                transition: 'all 0.3s'
              }}>
                {discovered.includes(mix.result) ? <span style={{ fontSize: 16 }}>{mix.emoji}</span> : <span style={{ fontSize: 14 }}>?</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
