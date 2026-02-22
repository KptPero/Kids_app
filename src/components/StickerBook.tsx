import React, { useState, useRef } from 'react'
import { playSound, speakText } from '../utils/sounds'

interface Sticker {
  id: number
  emoji: string
  x: number
  y: number
  size: number
  rotation: number
}

interface StickerOption {
  emoji: string
  name: string
  category: string
}

const STICKER_OPTIONS: StickerOption[] = [
  // Animals
  { emoji: '🐶', name: 'Dog', category: 'Animals' },
  { emoji: '🐱', name: 'Cat', category: 'Animals' },
  { emoji: '🐰', name: 'Bunny', category: 'Animals' },
  { emoji: '🦋', name: 'Butterfly', category: 'Animals' },
  { emoji: '🐸', name: 'Frog', category: 'Animals' },
  { emoji: '🐢', name: 'Turtle', category: 'Animals' },
  // Food
  { emoji: '🍎', name: 'Apple', category: 'Food' },
  { emoji: '🍕', name: 'Pizza', category: 'Food' },
  { emoji: '🧁', name: 'Cupcake', category: 'Food' },
  { emoji: '🍪', name: 'Cookie', category: 'Food' },
  { emoji: '🍦', name: 'Ice Cream', category: 'Food' },
  { emoji: '🍉', name: 'Watermelon', category: 'Food' },
  // Things
  { emoji: '🚗', name: 'Car', category: 'Things' },
  { emoji: '🚀', name: 'Rocket', category: 'Things' },
  { emoji: '⭐', name: 'Star', category: 'Things' },
  { emoji: '🌈', name: 'Rainbow', category: 'Things' },
  { emoji: '🎈', name: 'Balloon', category: 'Things' },
  { emoji: '🏠', name: 'House', category: 'Things' },
  // Nature
  { emoji: '🌸', name: 'Flower', category: 'Nature' },
  { emoji: '🌻', name: 'Sunflower', category: 'Nature' },
  { emoji: '🌳', name: 'Tree', category: 'Nature' },
  { emoji: '☀️', name: 'Sun', category: 'Nature' },
  { emoji: '🌙', name: 'Moon', category: 'Nature' },
  { emoji: '☁️', name: 'Cloud', category: 'Nature' },
]

const SCENES = [
  { name: 'Garden', bg: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 55%, #4CAF50 55%, #388E3C 100%)', icon: '🌳' },
  { name: 'Beach', bg: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 50%, #FFE0B2 50%, #FFCC80 100%)', icon: '🏖️' },
  { name: 'Night', bg: 'linear-gradient(180deg, #0D1B2A 0%, #1B2838 60%, #263238 100%)', icon: '🌙' },
  { name: 'Plain', bg: '#FAFAFA', icon: '📄' },
]

const CATEGORIES = ['Animals', 'Food', 'Things', 'Nature']

export default function StickerBook({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [catIdx, setCatIdx] = useState(0)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)

  const canvasW = 360
  const canvasH = 380

  function handleCanvasTap(e: React.MouseEvent | React.TouchEvent) {
    if (!selectedEmoji) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    let cx: number, cy: number
    if ('touches' in e) {
      cx = e.touches[0].clientX - rect.left
      cy = e.touches[0].clientY - rect.top
    } else {
      cx = e.clientX - rect.left
      cy = e.clientY - rect.top
    }

    const sticker: Sticker = {
      id: nextId.current++,
      emoji: selectedEmoji,
      x: cx - 20,
      y: cy - 20,
      size: 36 + Math.random() * 10,
      rotation: -15 + Math.random() * 30,
    }
    setStickers(prev => [...prev, sticker])
    playSound('click')
    const opt = STICKER_OPTIONS.find(s => s.emoji === selectedEmoji)
    if (opt && stickers.length % 3 === 0) speakText(opt.name)
  }

  function handleStickerDragStart(e: React.MouseEvent | React.TouchEvent, sticker: Sticker) {
    e.stopPropagation()
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    let cx: number, cy: number
    if ('touches' in e) {
      cx = e.touches[0].clientX - rect.left
      cy = e.touches[0].clientY - rect.top
    } else {
      cx = e.clientX - rect.left
      cy = e.clientY - rect.top
    }

    setDraggingId(sticker.id)
    setDragOffset({ x: cx - sticker.x, y: cy - sticker.y })
  }

  function handleCanvasMove(e: React.MouseEvent | React.TouchEvent) {
    if (draggingId === null) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    let cx: number, cy: number
    if ('touches' in e) {
      e.preventDefault()
      cx = e.touches[0].clientX - rect.left
      cy = e.touches[0].clientY - rect.top
    } else {
      cx = e.clientX - rect.left
      cy = e.clientY - rect.top
    }

    setStickers(prev => prev.map(s =>
      s.id === draggingId ? { ...s, x: cx - dragOffset.x, y: cy - dragOffset.y } : s
    ))
  }

  function handleCanvasEnd() {
    setDraggingId(null)
  }

  function removeSticker(id: number) {
    setStickers(prev => prev.filter(s => s.id !== id))
    playSound('click')
  }

  function clearAll() {
    setStickers([])
    playSound('click')
    speakText('All clear!')
  }

  const filteredStickers = STICKER_OPTIONS.filter(s => s.category === CATEGORIES[catIdx])

  return (
    <div style={{ background: 'linear-gradient(135deg, #F3E5F5 0%, #E8EAF6 50%, #E3F2FD 100%)', minHeight: '100vh', padding: 15 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #7B1FA2', borderRadius: 25, padding: '10px 18px', cursor: 'pointer', fontSize: 15, fontWeight: 'bold', color: '#7B1FA2' }}>← Back</button>
        <h2 style={{ fontSize: 20, color: '#7B1FA2', margin: 0 }}>📒 Sticker Book</h2>
        {pet && <div style={{ fontSize: 26 }}>{pet}</div>}
      </div>

      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        {/* Scene selector */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
          {SCENES.map((scene, i) => (
            <button key={scene.name} onClick={() => { setSceneIdx(i); playSound('click') }} style={{
              background: sceneIdx === i ? '#7B1FA2' : '#E1BEE7', color: sceneIdx === i ? '#fff' : '#7B1FA2',
              border: 'none', borderRadius: 12, padding: '6px 12px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer'
            }}>{scene.icon} {scene.name}</button>
          ))}
        </div>

        {/* Canvas */}
        <div ref={canvasRef}
          onClick={handleCanvasTap}
          onMouseMove={handleCanvasMove}
          onMouseUp={handleCanvasEnd}
          onMouseLeave={handleCanvasEnd}
          onTouchStart={handleCanvasTap}
          onTouchMove={handleCanvasMove}
          onTouchEnd={handleCanvasEnd}
          style={{
            width: canvasW, height: canvasH, margin: '0 auto', borderRadius: 20,
            background: SCENES[sceneIdx].bg, position: 'relative', overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)', border: '3px solid rgba(255,255,255,0.5)',
            cursor: selectedEmoji ? 'crosshair' : 'default', touchAction: 'none'
          }}>
          {stickers.map(sticker => (
            <div key={sticker.id}
              onMouseDown={e => handleStickerDragStart(e, sticker)}
              onTouchStart={e => handleStickerDragStart(e, sticker)}
              onDoubleClick={() => removeSticker(sticker.id)}
              style={{
                position: 'absolute', left: sticker.x, top: sticker.y,
                fontSize: sticker.size, transform: `rotate(${sticker.rotation}deg)`,
                cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                zIndex: draggingId === sticker.id ? 100 : 1,
              }}
            >{sticker.emoji}</div>
          ))}
          {stickers.length === 0 && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              color: sceneIdx === 2 ? '#78909C' : '#999', fontSize: 14, textAlign: 'center', pointerEvents: 'none'
            }}>
              {selectedEmoji ? 'Tap here to place stickers!' : 'Pick a sticker below 👇'}
            </div>
          )}
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 10, marginBottom: 6 }}>
          {CATEGORIES.map((cat, i) => (
            <button key={cat} onClick={() => setCatIdx(i)} style={{
              background: catIdx === i ? '#7B1FA2' : 'rgba(255,255,255,0.7)',
              color: catIdx === i ? '#fff' : '#7B1FA2',
              border: 'none', borderRadius: 12, padding: '5px 12px', fontSize: 12, fontWeight: 'bold', cursor: 'pointer'
            }}>{cat}</button>
          ))}
        </div>

        {/* Sticker picker */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', padding: 10,
          background: 'rgba(255,255,255,0.7)', borderRadius: 18 }}>
          {filteredStickers.map(opt => (
            <button key={opt.emoji} onClick={() => { setSelectedEmoji(selectedEmoji === opt.emoji ? null : opt.emoji); playSound('click') }} style={{
              background: selectedEmoji === opt.emoji ? '#E1BEE7' : '#fff',
              border: selectedEmoji === opt.emoji ? '3px solid #7B1FA2' : '2px solid #E0E0E0',
              borderRadius: 14, padding: 8, fontSize: 28, cursor: 'pointer',
              transform: selectedEmoji === opt.emoji ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.15s', boxShadow: selectedEmoji === opt.emoji ? '0 4px 12px rgba(123,31,162,0.3)' : 'none'
            }}>{opt.emoji}</button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
          <button onClick={clearAll} disabled={stickers.length === 0} style={{
            background: stickers.length === 0 ? '#E0E0E0' : 'rgba(255,255,255,0.8)',
            border: '2px solid #BDBDBD', borderRadius: 15, padding: '8px 16px', fontSize: 13, fontWeight: 'bold',
            color: '#666', cursor: stickers.length === 0 ? 'not-allowed' : 'pointer'
          }}>🗑️ Clear All</button>
          <div style={{ color: '#999', fontSize: 12, alignSelf: 'center' }}>
            {stickers.length} sticker{stickers.length !== 1 ? 's' : ''} • Double-tap to remove
          </div>
        </div>
      </div>
    </div>
  )
}
