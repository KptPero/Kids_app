import React, { useState, useRef, useEffect } from 'react'
import { playSound, speakText, cancelSpeech } from '../utils/sounds'

interface HidingSpot {
  id: number
  cover: string
  character: string
  characterName: string
  revealed: boolean
}

const COVERS = ['🎁', '📦', '🧢', '🎩', '🪣', '🧺', '🏠', '🌳', '☁️']
const CHARACTERS = [
  { emoji: '🐶', name: 'Puppy' },
  { emoji: '🐱', name: 'Kitten' },
  { emoji: '🐰', name: 'Bunny' },
  { emoji: '🐻', name: 'Bear' },
  { emoji: '🐸', name: 'Frog' },
  { emoji: '🦊', name: 'Fox' },
  { emoji: '🐼', name: 'Panda' },
  { emoji: '🦄', name: 'Unicorn' },
  { emoji: '🐵', name: 'Monkey' },
  { emoji: '🦁', name: 'Lion' },
  { emoji: '🐧', name: 'Penguin' },
  { emoji: '🐨', name: 'Koala' },
]

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function generateBoard(count: number): HidingSpot[] {
  const covers = shuffle(COVERS).slice(0, count)
  const chars = shuffle(CHARACTERS).slice(0, count)
  return covers.map((cover, i) => ({
    id: i,
    cover,
    character: chars[i].emoji,
    characterName: chars[i].name,
    revealed: false,
  }))
}

export default function PeekaBoo({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [board, setBoard] = useState(() => generateBoard(6))
  const [allRevealed, setAllRevealed] = useState(false)
  const [foundCount, setFoundCount] = useState(0)
  const [message, setMessage] = useState('Tap to peek! 👀')
  const [wiggle, setWiggle] = useState<number | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
      cancelSpeech()
    }
  }, [])

  function safeTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  function handlePeek(spot: HidingSpot) {
    if (spot.revealed) return
    playSound('tada')

    const newBoard = board.map(s => s.id === spot.id ? { ...s, revealed: true } : s)
    setBoard(newBoard)
    setWiggle(spot.id)
    setFoundCount(f => f + 1)

    const exclamations = ['Peek-a-boo!', 'There you are!', 'Found you!', 'Hello there!', 'Surprise!']
    const msg = exclamations[Math.floor(Math.random() * exclamations.length)]
    setMessage(`${msg} It's a ${spot.characterName}! ${spot.character}`)
    speakText(`${msg} It's a ${spot.characterName}!`)

    safeTimeout(() => setWiggle(null), 600)

    const revealed = newBoard.filter(s => s.revealed).length
    if (revealed === newBoard.length) {
      safeTimeout(() => {
        setAllRevealed(true)
        speakText('You found everyone! Well done!')
      }, 1200)
    }
  }

  function resetGame() {
    setBoard(generateBoard(6))
    setAllRevealed(false)
    setFoundCount(0)
    setMessage('Tap to peek! 👀')
    setWiggle(null)
    playSound('click')
  }

  if (allRevealed) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%)', minHeight: '100vh', padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#fff', borderRadius: 30, padding: 35, textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.1)', maxWidth: 380 }}>
          <div style={{ fontSize: 55, marginBottom: 8 }}>🎉</div>
          <h2 style={{ color: '#E65100', margin: '0 0 10px 0' }}>You Found Everyone!</h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 15 }}>
            {board.map(s => <span key={s.id} style={{ fontSize: 32 }}>{s.character}</span>)}
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={resetGame} style={{ background: 'linear-gradient(135deg, #FFB74D, #E65100)', color: '#fff', border: 'none', borderRadius: 25, padding: '15px 28px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>🔄 Play Again</button>
            <button onClick={() => { playSound('click'); onBack() }} style={{ background: '#E0E0E0', color: '#333', border: 'none', borderRadius: 25, padding: '15px 28px', fontSize: 16, fontWeight: 'bold', cursor: 'pointer' }}>🏠 Home</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #FFF8E1 0%, #FFECB3 50%, #FFF3E0 100%)', minHeight: '100vh', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #E65100', borderRadius: 25, padding: '12px 20px', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', color: '#E65100' }}>← Back</button>
        <div style={{ color: '#E65100', fontWeight: 'bold', fontSize: 15 }}>Found: {foundCount}/{board.length}</div>
        {pet && <div style={{ fontSize: 28 }}>{pet}</div>}
      </div>

      <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, color: '#E65100', margin: '0 0 6px 0' }}>👀 Peek-a-Boo!</h2>

        {/* Message bubble */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '10px 18px', marginBottom: 18,
          fontSize: 16, color: '#333', fontWeight: 'bold', display: 'inline-block',
          boxShadow: '0 3px 10px rgba(0,0,0,0.08)'
        }}>
          {message}
        </div>

        {/* Game grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, padding: 10 }}>
          {board.map(spot => (
            <button key={spot.id} onClick={() => handlePeek(spot)} style={{
              aspectRatio: '1', borderRadius: 22, border: 'none', cursor: spot.revealed ? 'default' : 'pointer',
              background: spot.revealed
                ? 'linear-gradient(135deg, #FFF9C4, #FFF176)'
                : 'linear-gradient(135deg, #FFCC80, #FF9800)',
              boxShadow: spot.revealed
                ? '0 3px 10px rgba(255,193,7,0.3)'
                : '0 5px 15px rgba(255,152,0,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: spot.revealed ? 48 : 40,
              transform: wiggle === spot.id ? 'scale(1.15) rotate(5deg)' : spot.revealed ? 'scale(1)' : 'scale(1)',
              transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              position: 'relative', overflow: 'hidden'
            }}>
              {spot.revealed ? (
                <span>{spot.character}</span>
              ) : (
                <>
                  <span>{spot.cover}</span>
                  <div style={{
                    position: 'absolute', top: 6, right: 6, fontSize: 14,
                    opacity: 0.5
                  }}>👆</div>
                </>
              )}
            </button>
          ))}
        </div>

        <button onClick={resetGame} style={{
          marginTop: 18, background: 'rgba(255,255,255,0.7)', border: '2px solid #E65100',
          borderRadius: 25, padding: '10px 22px', fontSize: 14, fontWeight: 'bold', color: '#E65100', cursor: 'pointer'
        }}>🔀 New Game</button>
      </div>

      <style>{`
        @keyframes wiggleAnim {
          0%, 100% { transform: rotate(0deg) scale(1.1); }
          25% { transform: rotate(8deg) scale(1.15); }
          75% { transform: rotate(-8deg) scale(1.15); }
        }
      `}</style>
    </div>
  )
}
