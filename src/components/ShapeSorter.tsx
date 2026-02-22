import React, { useState, useRef, useEffect } from 'react'
import { playSound, speakText } from '../utils/sounds'

interface Shape {
  id: string
  name: string
  emoji: string
  color: string
  svg: string
}

const SHAPES: Shape[] = [
  { id: 'circle', name: 'Circle', emoji: '🔴', color: '#F44336',
    svg: '<circle cx="40" cy="40" r="35" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'square', name: 'Square', emoji: '🟦', color: '#2196F3',
    svg: '<rect x="5" y="5" width="70" height="70" rx="4" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'triangle', name: 'Triangle', emoji: '🔺', color: '#FF9800',
    svg: '<polygon points="40,5 75,75 5,75" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'star', name: 'Star', emoji: '⭐', color: '#FFC107',
    svg: '<polygon points="40,5 48,30 75,30 53,47 61,75 40,57 19,75 27,47 5,30 32,30" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'heart', name: 'Heart', emoji: '❤️', color: '#E91E63',
    svg: '<path d="M40,70 C20,50 0,35 10,18 C18,5 32,5 40,20 C48,5 62,5 70,18 C80,35 60,50 40,70Z" fill="FILL" stroke="#333" stroke-width="2"/>' },
  { id: 'diamond', name: 'Diamond', emoji: '💎', color: '#00BCD4',
    svg: '<polygon points="40,5 75,40 40,75 5,40" fill="FILL" stroke="#333" stroke-width="2"/>' },
]

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildRound(count: number) {
  // Pick `count` shapes, then create a separate shuffled order for holes
  const picked = shuffleArr(SHAPES).slice(0, count)
  const holes = shuffleArr(picked)
  return { picked, holes }
}

export default function ShapeSorter({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [level, setLevel] = useState(0)
  const [sorted, setSorted] = useState<string[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [completed, setCompleted] = useState(false)
  const [round, setRound] = useState(() => buildRound(3))
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)) }
  }, [])

  function safeTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  // Levels: easy (3 shapes), medium (4), hard (6)
  const difficulties = [
    { name: 'Easy', count: 3, label: '⭐' },
    { name: 'Medium', count: 4, label: '⭐⭐' },
    { name: 'Hard', count: 6, label: '⭐⭐⭐' },
  ]
  const currentShapes = round.picked
  const holeShapes = round.holes

  function reset(lvl?: number) {
    const count = difficulties[lvl ?? level].count
    setRound(buildRound(count))
    setSorted([])
    setFeedback('')
    setCompleted(false)
    setDragging(null)
  }

  function handleDragStart(shapeId: string) {
    if (sorted.includes(shapeId)) return
    setDragging(shapeId)
    playSound('click')
  }

  function handleDropOnHole(holeShapeId: string) {
    if (!dragging) return
    if (dragging === holeShapeId) {
      playSound('tada')
      const shape = SHAPES.find(s => s.id === dragging)
      speakText(shape?.name || '')
      setFeedback('✅ ' + (shape?.name || '') + '!')
      const newSorted = [...sorted, dragging]
      setSorted(newSorted)
      if (newSorted.length === currentShapes.length) {
        safeTimeout(() => {
          setCompleted(true)
          speakText('Well done! You sorted all the shapes!')
        }, 800)
      }
    } else {
      playSound('click')
      setFeedback('Try again! 🤔')
    }
    setDragging(null)
    safeTimeout(() => setFeedback(''), 1500)
  }

  function renderShapeSvg(shape: Shape, fill: string, size: number) {
    return (
      <svg viewBox="0 0 80 80" width={size} height={size}>
        <g dangerouslySetInnerHTML={{ __html: shape.svg.replace('FILL', fill) }} />
      </svg>
    )
  }

  if (completed) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)', minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 30, padding: 40, textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', maxWidth: 400 }}>
          <div style={{ fontSize: 60, marginBottom: 10 }}>🎉</div>
          <h2 style={{ color: '#1565C0', margin: '0 0 10px 0' }}>All Sorted!</h2>
          <div style={{ fontSize: 40, marginBottom: 15 }}>{'⭐'.repeat(difficulties[level].count)}</div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={() => reset()} style={{ background: 'linear-gradient(135deg, #42A5F5, #1E88E5)', color: '#fff', border: 'none', borderRadius: 25, padding: '15px 30px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>🔄 Again</button>
            <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'linear-gradient(135deg, #999, #bbb)', color: '#fff', border: 'none', borderRadius: 25, padding: '15px 30px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>🏠 Home</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 50%, #E8EAF6 100%)', minHeight: '100vh', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #1565C0', borderRadius: 25, padding: '12px 20px', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', color: '#1565C0' }}>← Back</button>
        <div style={{ display: 'flex', gap: 6 }}>
          {difficulties.map((d, i) => (
            <button key={d.name} onClick={() => { setLevel(i); reset(i) }} style={{
              background: level === i ? '#1565C0' : '#E3F2FD', color: level === i ? '#fff' : '#1565C0',
              border: 'none', borderRadius: 15, padding: '8px 14px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer',
              WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' as any
            }}>{d.name}</button>
          ))}
        </div>
        {pet && <div style={{ fontSize: 28 }}>{pet}</div>}
      </div>

      <div style={{ maxWidth: 450, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, color: '#1565C0', margin: '0 0 15px 0' }}>🔵 Shape Sorter</h2>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 15px 0' }}>Tap a shape, then tap its matching hole!</p>

        {/* Shapes to drag */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 25, padding: 15, background: 'rgba(255,255,255,0.7)', borderRadius: 20 }}>
          {currentShapes.filter(s => !sorted.includes(s.id)).map(shape => (
            <button key={shape.id} onClick={() => handleDragStart(shape.id)} style={{
              background: dragging === shape.id ? '#FFF9C4' : '#fff',
              border: `3px solid ${dragging === shape.id ? '#FFA000' : shape.color}`,
              borderRadius: 18, padding: 10, cursor: 'pointer',
              transform: dragging === shape.id ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.2s', boxShadow: dragging === shape.id ? '0 6px 20px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {renderShapeSvg(shape, shape.color, 55)}
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#333', marginTop: 4 }}>{shape.name}</div>
            </button>
          ))}
          {currentShapes.filter(s => !sorted.includes(s.id)).length === 0 && (
            <div style={{ fontSize: 16, color: '#999', padding: 20 }}>All sorted! 🎉</div>
          )}
        </div>

        {/* Holes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', padding: 15, background: 'rgba(0,0,0,0.05)', borderRadius: 20, border: '3px dashed #90CAF9' }}>
          <div style={{ width: '100%', fontSize: 14, color: '#888', marginBottom: 5 }}>⬇️ Drop here ⬇️</div>
          {holeShapes.map(shape => {
            const isSorted = sorted.includes(shape.id)
            return (
              <button key={shape.id} onClick={() => handleDropOnHole(shape.id)} disabled={isSorted} style={{
                background: isSorted ? shape.color + '33' : 'rgba(255,255,255,0.5)',
                border: `3px dashed ${isSorted ? shape.color : '#BDBDBD'}`,
                borderRadius: 18, padding: 10, cursor: isSorted ? 'default' : 'pointer',
                opacity: isSorted ? 0.6 : 1, minWidth: 75, minHeight: 75,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
              }}>
                {renderShapeSvg(shape, isSorted ? shape.color : '#E0E0E0', 50)}
                {isSorted && <div style={{ fontSize: 11, color: shape.color, fontWeight: 'bold', marginTop: 2 }}>✓</div>}
              </button>
            )
          })}
        </div>

        {feedback && (
          <div style={{ marginTop: 15, padding: 12, borderRadius: 15, fontSize: 18, fontWeight: 'bold',
            background: feedback.includes('✅') ? '#E8F5E9' : '#FFF3E0',
            color: feedback.includes('✅') ? '#2E7D32' : '#E65100'
          }}>{feedback}</div>
        )}
      </div>
    </div>
  )
}
