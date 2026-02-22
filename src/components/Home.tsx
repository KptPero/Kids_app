import React, { useState } from 'react'
import { playSound, speakText } from '../utils/sounds'

interface Props {
  onNavigate: (r: string) => void
  onPetChange: (pet: string) => void
  pet: string
}

const MOODS = [
  { emoji: '😊', label: 'Happy', color: '#fdcb6e', greeting: 'You look happy today!' },
  { emoji: '😴', label: 'Sleepy', color: '#81ecec', greeting: "Let's do something gentle!" },
  { emoji: '🤩', label: 'Excited', color: '#fab1a0', greeting: "Let's have lots of fun!" },
  { emoji: '🤗', label: 'Cuddly', color: '#fd79a8', greeting: 'Time for cozy activities!' },
  { emoji: '😎', label: 'Cool', color: '#74b9ff', greeting: 'Looking cool today!' },
  { emoji: '🥰', label: 'Loved', color: '#e84393', greeting: 'You are so loved!' },
]

const glass = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.4)',
} as const

export default function Home({ onNavigate, onPetChange, pet }: Props) {
  const [mood, setMood] = useState<typeof MOODS[0] | null>(() => {
    if (pet) return MOODS.find(m => m.emoji === pet) || null
    return null
  })
  const [showMoodPicker, setShowMoodPicker] = useState(!pet)

  function selectMood(m: typeof MOODS[0]) {
    playSound('tada')
    setMood(m)
    onPetChange(m.emoji)
    speakText(m.greeting)
    setShowMoodPicker(false)
  }

  const handleNav = (route: string) => {
    playSound('click')
    onNavigate(route)
  }

  if (showMoodPicker) {
    return (
      <div style={{ background: 'linear-gradient(160deg, #ffecd2 0%, #fcb69f 50%, #ffeaa7 100%)', minHeight: '100vh', padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', fontFamily: 'var(--font)' }}>
        <h1 style={{ fontSize: 32, color: '#2d3436', margin: '0 0 4px 0', fontWeight: 800 }}>🌈 Hello! 🌈</h1>
        <p style={{ fontSize: 17, color: '#636e72', marginBottom: 28, fontWeight: 600 }}>How do you feel today?</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, maxWidth: 340, margin: '0 auto' }}>
          {MOODS.map(m => (
            <button key={m.label} onClick={() => selectMood(m)} style={{
              ...glass,
              borderRadius: 22,
              padding: '20px 8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              fontFamily: 'inherit',
            }}>
              <div style={{ fontSize: 42, marginBottom: 6 }}>{m.emoji}</div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#2d3436', margin: 0 }}>{m.label}</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(160deg, #fce4ec 0%, #fff0f5 40%, #faf0ff 100%)', minHeight: '100vh', padding: '0 16px 20px', fontFamily: 'var(--font)' }}>
      {/* Header */}
      <div style={{
        ...glass,
        borderRadius: '0 0 24px 24px',
        marginBottom: 16,
        padding: '16px 20px',
        textAlign: 'center',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}>
        <span style={{ fontSize: 30 }}>{mood?.emoji || '🌟'}</span>
        <div>
          <h1 style={{ fontSize: 24, margin: 0, color: '#2d3436', fontWeight: 800 }}>Learn & Play!</h1>
          <p style={{ fontSize: 12, margin: 0, color: '#636e72', fontWeight: 600 }}>Feeling {mood?.label || 'great'} today</p>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <Section title="📖 Learn to Read" accent="#e84393">
          <GameBtn icon="🔤" label="Letter Tracing" onClick={() => handleNav('letters')} />
          <GameBtn icon="🎮" label="Phonics Games" onClick={() => handleNav('phonics')} />
          <GameBtn icon="📚" label="Story Library" onClick={() => handleNav('stories')} />
          <GameBtn icon="🌙" label="Bedtime Stories" onClick={() => handleNav('bedtime')} />
        </Section>

        <Section title="🔢 Learn Numbers" accent="#00b894">
          <GameBtn icon="🔢" label="Numbers & Counting" onClick={() => handleNav('numbers')} fullWidth />
        </Section>

        <Section title="🎯 Fun Games" accent="#e17055">
          <GameBtn icon="🧩" label="Memory Match" onClick={() => handleNav('memory')} />
          <GameBtn icon="🫧" label="Pop Bubbles" onClick={() => handleNav('bubble')} />
          <GameBtn icon="🚒" label="Fire Fighter" onClick={() => handleNav('firefighter')} />
          <GameBtn icon="🌀" label="Fidget Spinner" onClick={() => handleNav('fidget')} />
          <GameBtn icon="🎹" label="Music Piano" onClick={() => handleNav('music')} />
          <GameBtn icon="🐾" label="Animal Sounds" onClick={() => handleNav('animalsounds')} />
          <GameBtn icon="⭐" label="Catch Stars" onClick={() => handleNav('catchstars')} />
          <GameBtn icon="🍉" label="Fruit Ninja" onClick={() => handleNav('fruitninja')} />
        </Section>

        <Section title="🧩 Learn & Explore" accent="#0984e3">
          <GameBtn icon="🔵" label="Shape Sorter" onClick={() => handleNav('shapesorter')} />
          <GameBtn icon="🎨" label="Color Mixer" onClick={() => handleNav('colormixer')} />
        </Section>

        <Section title="🎨 Creative Time" accent="#6c5ce7">
          <GameBtn icon="🖌️" label="Draw & Color" onClick={() => handleNav('drawing')} />
          <GameBtn icon="📒" label="Sticker Book" onClick={() => handleNav('stickerbook')} />
          <GameBtn icon="😴" label="Calming Zone" onClick={() => handleNav('calming')} />
        </Section>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button onClick={() => handleNav('settings')} style={{
            flex: 1, ...glass, borderRadius: 16, padding: 14, fontSize: 14,
            fontWeight: 700, color: '#2d3436', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}>⚙️ Settings</button>
          <button onClick={() => { playSound('click'); setShowMoodPicker(true) }} style={{
            flex: 1, ...glass, borderRadius: 16, padding: 14, fontSize: 14,
            fontWeight: 700, color: '#2d3436', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}>{mood?.emoji || '😊'} Change Mood</button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.55)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.4)',
      borderRadius: 20, padding: '14px 14px 16px', marginBottom: 12,
      boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
    }}>
      <h2 style={{ fontSize: 16, color: accent, marginTop: 0, marginBottom: 10, fontWeight: 800, letterSpacing: '-0.01em' }}>{title}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}

function GameBtn({ icon, label, onClick, fullWidth }: {
  icon: string; label: string; onClick: () => void; fullWidth?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      gridColumn: fullWidth ? 'span 2' : undefined,
      background: 'rgba(255,255,255,0.7)',
      border: '1px solid rgba(0,0,0,0.04)',
      borderRadius: 14, padding: '14px 10px',
      fontSize: 13, fontWeight: 700, color: '#2d3436', cursor: 'pointer',
      fontFamily: 'inherit', textAlign: 'center',
      transition: 'all 0.15s', lineHeight: 1.3,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <span style={{ fontSize: 22, display: 'block', marginBottom: 4 }}>{icon}</span>
      {label}
    </button>
  )
}
