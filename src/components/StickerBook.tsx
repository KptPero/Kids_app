import React, { useState, useRef, useEffect, useMemo } from 'react'
import { playSound, speakText, cancelSpeech } from '../utils/sounds'
import { backBtn } from '../utils/sharedStyles'

interface Sticker {
  id: number; emoji: string; x: number; y: number; size: number; rotation: number
}

interface StickerOption { emoji: string; name: string; category: string }

const STICKER_OPTIONS: StickerOption[] = [
  // Animals
  { emoji: '🐶', name: 'Dog', category: 'Animals' }, { emoji: '🐱', name: 'Cat', category: 'Animals' },
  { emoji: '🐰', name: 'Bunny', category: 'Animals' }, { emoji: '🦋', name: 'Butterfly', category: 'Animals' },
  { emoji: '🐸', name: 'Frog', category: 'Animals' }, { emoji: '🐢', name: 'Turtle', category: 'Animals' },
  { emoji: '🦁', name: 'Lion', category: 'Animals' }, { emoji: '🐧', name: 'Penguin', category: 'Animals' },
  // Food
  { emoji: '🍎', name: 'Apple', category: 'Food' }, { emoji: '🍕', name: 'Pizza', category: 'Food' },
  { emoji: '🧁', name: 'Cupcake', category: 'Food' }, { emoji: '🍪', name: 'Cookie', category: 'Food' },
  { emoji: '🍦', name: 'Ice Cream', category: 'Food' }, { emoji: '🍉', name: 'Watermelon', category: 'Food' },
  { emoji: '🍩', name: 'Donut', category: 'Food' }, { emoji: '🍓', name: 'Strawberry', category: 'Food' },
  // Things
  { emoji: '🚗', name: 'Car', category: 'Things' }, { emoji: '🚀', name: 'Rocket', category: 'Things' },
  { emoji: '⭐', name: 'Star', category: 'Things' }, { emoji: '🌈', name: 'Rainbow', category: 'Things' },
  { emoji: '🎈', name: 'Balloon', category: 'Things' }, { emoji: '🏠', name: 'House', category: 'Things' },
  { emoji: '✈️', name: 'Plane', category: 'Things' }, { emoji: '🚂', name: 'Train', category: 'Things' },
  // Nature
  { emoji: '🌸', name: 'Flower', category: 'Nature' }, { emoji: '🌻', name: 'Sunflower', category: 'Nature' },
  { emoji: '🌳', name: 'Tree', category: 'Nature' }, { emoji: '☀️', name: 'Sun', category: 'Nature' },
  { emoji: '🌙', name: 'Moon', category: 'Nature' }, { emoji: '☁️', name: 'Cloud', category: 'Nature' },
  { emoji: '🌊', name: 'Wave', category: 'Nature' }, { emoji: '⛰️', name: 'Mountain', category: 'Nature' },
  // Faces
  { emoji: '😊', name: 'Happy', category: 'Faces' }, { emoji: '😂', name: 'Laughing', category: 'Faces' },
  { emoji: '😍', name: 'Love', category: 'Faces' }, { emoji: '🤪', name: 'Silly', category: 'Faces' },
  { emoji: '😎', name: 'Cool', category: 'Faces' }, { emoji: '🥳', name: 'Party', category: 'Faces' },
  // Shapes
  { emoji: '❤️', name: 'Heart', category: 'Shapes' }, { emoji: '💎', name: 'Diamond', category: 'Shapes' },
  { emoji: '🔶', name: 'Orange Diamond', category: 'Shapes' }, { emoji: '🟣', name: 'Purple Circle', category: 'Shapes' },
  { emoji: '🔺', name: 'Triangle', category: 'Shapes' }, { emoji: '⬛', name: 'Black Square', category: 'Shapes' },
]

const SCENES = [
  { name: 'Garden', bg: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 55%, #4CAF50 55%, #388E3C 100%)', icon: '🌳' },
  { name: 'Beach', bg: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 50%, #FFE0B2 50%, #FFCC80 100%)', icon: '🏖️' },
  { name: 'Night', bg: 'linear-gradient(180deg, #0D1B2A 0%, #1B2838 60%, #263238 100%)', icon: '🌙' },
  { name: 'Space', bg: 'linear-gradient(180deg, #1a0533 0%, #2d1b69 50%, #0D1B2A 100%)', icon: '🚀' },
  { name: 'Ocean', bg: 'linear-gradient(180deg, #0277BD 0%, #01579B 50%, #004D40 100%)', icon: '🐠' },
  { name: 'City', bg: 'linear-gradient(180deg, #FF8A65 0%, #FFB74D 30%, #E0E0E0 30%, #BDBDBD 100%)', icon: '🏙️' },
  { name: 'Farm', bg: 'linear-gradient(180deg, #87CEEB 0%, #87CEEB 40%, #8BC34A 40%, #689F38 100%)', icon: '🌾' },
  { name: 'Plain', bg: '#FAFAFA', icon: '📄' },
]

const CATEGORIES = ['Animals', 'Food', 'Things', 'Nature', 'Faces', 'Shapes']

export default function StickerBook({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [stickers, setStickers] = useState<Sticker[]>([])
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null)
  const [sceneIdx, setSceneIdx] = useState(0)
  const [catIdx, setCatIdx] = useState(0)
  const [draggingId, setDraggingId] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [stickerSize, setStickerSize] = useState(36)
  const [history, setHistory] = useState<Sticker[][]>([])
  const [selectedStickerId, setSelectedStickerId] = useState<number | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const nextId = useRef(0)
  const justDragged = useRef(false)

  useEffect(() => { return () => { cancelSpeech() } }, [])

  const canvasW = Math.min(360, typeof window !== 'undefined' ? window.innerWidth - 40 : 360)
  const canvasH = Math.min(380, typeof window !== 'undefined' ? window.innerHeight - 320 : 380)

  function pushHistory() { setHistory(h => [...h.slice(-20), [...stickers]]) }

  function undo() {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setStickers(prev)
    playSound('click')
  }

  function handleCanvasTap(e: React.MouseEvent | React.TouchEvent) {
    if (!selectedEmoji) return
    if (justDragged.current) { justDragged.current = false; return }
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    let cx: number, cy: number
    if ('touches' in e) { cx = e.touches[0].clientX - rect.left; cy = e.touches[0].clientY - rect.top }
    else { cx = e.clientX - rect.left; cy = e.clientY - rect.top }
    pushHistory()
    const sticker: Sticker = {
      id: nextId.current++, emoji: selectedEmoji,
      x: cx - stickerSize / 2, y: cy - stickerSize / 2, size: stickerSize,
      rotation: -15 + Math.random() * 30,
    }
    setStickers(prev => [...prev, sticker])
    playSound('click')
    const opt = STICKER_OPTIONS.find(s => s.emoji === selectedEmoji)
    if (opt && stickers.length % 3 === 0) speakText(opt.name)
  }

  function handleStickerDragStart(e: React.MouseEvent | React.TouchEvent, sticker: Sticker) {
    e.stopPropagation(); e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    let cx: number, cy: number
    if ('touches' in e) { cx = e.touches[0].clientX - rect.left; cy = e.touches[0].clientY - rect.top }
    else { cx = e.clientX - rect.left; cy = e.clientY - rect.top }
    setDraggingId(sticker.id)
    setDragOffset({ x: cx - sticker.x, y: cy - sticker.y })
    setSelectedStickerId(sticker.id)
  }

  function handleCanvasMove(e: React.MouseEvent | React.TouchEvent) {
    if (draggingId === null) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    let cx: number, cy: number
    if ('touches' in e) { e.preventDefault(); cx = e.touches[0].clientX - rect.left; cy = e.touches[0].clientY - rect.top }
    else { cx = e.clientX - rect.left; cy = e.clientY - rect.top }
    setStickers(prev => prev.map(s => s.id === draggingId ? { ...s, x: cx - dragOffset.x, y: cy - dragOffset.y } : s))
  }

  function handleCanvasEnd() { if (draggingId !== null) justDragged.current = true; setDraggingId(null) }

  function removeSticker(id: number) { pushHistory(); setStickers(prev => prev.filter(s => s.id !== id)); setSelectedStickerId(null); playSound('click') }

  function rotateSelected(deg: number) {
    if (selectedStickerId === null) return
    pushHistory()
    setStickers(prev => prev.map(s => s.id === selectedStickerId ? { ...s, rotation: s.rotation + deg } : s))
    playSound('click')
  }

  function resizeSelected(delta: number) {
    if (selectedStickerId === null) return
    pushHistory()
    setStickers(prev => prev.map(s => s.id === selectedStickerId ? { ...s, size: Math.max(16, Math.min(80, s.size + delta)) } : s))
    playSound('click')
  }

  function clearAll() { pushHistory(); setStickers([]); setSelectedStickerId(null); playSound('click'); speakText('All clear!') }

  const filteredStickers = useMemo(() => STICKER_OPTIONS.filter(s => s.category === CATEGORIES[catIdx]), [catIdx])
  const sel = stickers.find(s => s.id === selectedStickerId)

  return (
    <div style={{ background: 'linear-gradient(135deg, #f3eeff 0%, #eef0ff 50%, #eaf6ff 100%)', minHeight: '100vh', padding: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <button onClick={() => { playSound('click'); onBack() }} style={{ ...backBtn, padding: '8px 14px' }}>← Back</button>
        <h2 style={{ fontSize: 18, color: '#6c5ce7', margin: 0, fontWeight: 800 }}>📒 Sticker Book</h2>
        {pet && <div style={{ fontSize: 24 }}>{pet}</div>}
      </div>

      <div style={{ maxWidth: 400, margin: '0 auto' }}>
        {/* Scene selector */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 6, flexWrap: 'wrap' }}>
          {SCENES.map((scene, i) => (
            <button key={scene.name} onClick={() => { setSceneIdx(i); playSound('click') }} style={{
              background: sceneIdx === i ? '#6c5ce7' : 'rgba(108,92,231,0.12)', color: sceneIdx === i ? '#fff' : '#6c5ce7',
              border: 'none', borderRadius: 10, padding: '4px 8px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
            }}>{scene.icon}</button>
          ))}
        </div>

        {/* Canvas */}
        <div ref={canvasRef}
          onClick={handleCanvasTap}
          onMouseMove={handleCanvasMove} onMouseUp={handleCanvasEnd} onMouseLeave={handleCanvasEnd}
          onTouchStart={handleCanvasTap} onTouchMove={handleCanvasMove} onTouchEnd={handleCanvasEnd}
          style={{
            width: canvasW, height: canvasH, margin: '0 auto', borderRadius: 18,
            background: SCENES[sceneIdx].bg, position: 'relative', overflow: 'hidden',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', border: '2px solid rgba(255,255,255,0.4)',
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
                outline: selectedStickerId === sticker.id ? '2px dashed #6c5ce7' : 'none',
                outlineOffset: 2, borderRadius: 4,
              }}>{sticker.emoji}</div>
          ))}
          {stickers.length === 0 && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              color: [2, 3, 4].includes(sceneIdx) ? '#78909C' : '#b2bec3', fontSize: 13, textAlign: 'center', pointerEvents: 'none'
            }}>{selectedEmoji ? 'Tap here to place stickers!' : 'Pick a sticker below 👇'}</div>
          )}
        </div>

        {/* Edit controls for selected sticker */}
        {sel && (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6 }}>
            <button onClick={() => rotateSelected(-15)} style={editBtnStyle}>↺</button>
            <button onClick={() => rotateSelected(15)} style={editBtnStyle}>↻</button>
            <button onClick={() => resizeSelected(-4)} style={editBtnStyle}>➖</button>
            <button onClick={() => resizeSelected(4)} style={editBtnStyle}>➕</button>
            <button onClick={() => removeSticker(sel.id)} style={{ ...editBtnStyle, color: '#d63031' }}>🗑️</button>
            <button onClick={() => setSelectedStickerId(null)} style={{ ...editBtnStyle, color: '#6c5ce7' }}>✓</button>
          </div>
        )}

        {/* Size slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 6 }}>
          <span style={{ fontSize: 12, color: '#999' }}>Size:</span>
          <input type="range" min={20} max={75} value={stickerSize} onChange={e => setStickerSize(Number(e.target.value))} style={{ width: 100, accentColor: '#6c5ce7' }} />
          <span style={{ fontSize: stickerSize * 0.5, minWidth: 20 }}>{selectedEmoji || '📌'}</span>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 3, justifyContent: 'center', marginTop: 6, marginBottom: 4, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat, i) => (
            <button key={cat} onClick={() => setCatIdx(i)} style={{
              background: catIdx === i ? '#6c5ce7' : 'rgba(255,255,255,0.7)', color: catIdx === i ? '#fff' : '#6c5ce7',
              border: 'none', borderRadius: 10, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
            }}>{cat}</button>
          ))}
        </div>

        {/* Sticker picker */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', padding: 8, background: 'rgba(255,255,255,0.7)', borderRadius: 16 }}>
          {filteredStickers.map(opt => (
            <button key={opt.emoji} onClick={() => { setSelectedEmoji(selectedEmoji === opt.emoji ? null : opt.emoji); playSound('click') }} style={{
              background: selectedEmoji === opt.emoji ? 'rgba(108,92,231,0.12)' : 'rgba(255,255,255,0.8)',
              border: selectedEmoji === opt.emoji ? '2px solid #6c5ce7' : '1px solid rgba(0,0,0,0.06)',
              borderRadius: 12, padding: 6, fontSize: 24, cursor: 'pointer',
              transform: selectedEmoji === opt.emoji ? 'scale(1.12)' : 'scale(1)',
              transition: 'all 0.15s', boxShadow: selectedEmoji === opt.emoji ? '0 4px 12px rgba(108,92,231,0.2)' : 'none'
            }}>{opt.emoji}</button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <button onClick={undo} disabled={history.length === 0} style={{
            background: history.length === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#636e72', cursor: history.length === 0 ? 'not-allowed' : 'pointer'
          }}>↩️ Undo</button>
          <button onClick={clearAll} disabled={stickers.length === 0} style={{
            background: stickers.length === 0 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#636e72', cursor: stickers.length === 0 ? 'not-allowed' : 'pointer'
          }}>🗑️ Clear</button>
          <div style={{ color: '#b2bec3', fontSize: 11, alignSelf: 'center' }}>
            {stickers.length} sticker{stickers.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

const editBtnStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.85)', border: '1px solid rgba(108,92,231,0.2)', borderRadius: 10,
  padding: '4px 10px', fontSize: 14, fontWeight: 700, color: '#636e72', cursor: 'pointer'
}
