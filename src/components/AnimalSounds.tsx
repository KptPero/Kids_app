import React, { useState, useRef, useEffect, useCallback } from 'react'
import { playSound, speakText, cancelSpeech } from '../utils/sounds'

interface Animal {
  emoji: string; name: string; sound: string; soundText: string; bg: string
  // Web Audio synth params
  freq: number; dur: number; type: OscillatorType; mod?: { freq: number; depth: number }
  reps?: number; gap?: number; freqEnd?: number; noiseLevel?: number
}

const ANIMALS: Animal[] = [
  { emoji: '🐄', name: 'Cow', sound: 'Moooo', soundText: 'The cow goes mooo!', bg: '#C8E6C9',
    freq: 150, dur: 0.8, type: 'sawtooth', mod: { freq: 3, depth: 20 }, freqEnd: 130 },
  { emoji: '🐶', name: 'Dog', sound: 'Woof!', soundText: 'The dog goes woof!', bg: '#FFCCBC',
    freq: 400, dur: 0.15, type: 'square', reps: 2, gap: 0.2, freqEnd: 300 },
  { emoji: '🐱', name: 'Cat', sound: 'Meow', soundText: 'The cat goes meow!', bg: '#F3E5F5',
    freq: 500, dur: 0.5, type: 'sine', freqEnd: 350, mod: { freq: 5, depth: 30 } },
  { emoji: '🐷', name: 'Pig', sound: 'Oink!', soundText: 'The pig goes oink oink!', bg: '#FCE4EC',
    freq: 250, dur: 0.2, type: 'sawtooth', reps: 3, gap: 0.15, freqEnd: 200 },
  { emoji: '🐸', name: 'Frog', sound: 'Ribbit', soundText: 'The frog goes ribbit!', bg: '#E8F5E9',
    freq: 600, dur: 0.1, type: 'square', reps: 2, gap: 0.1, freqEnd: 300 },
  { emoji: '🦁', name: 'Lion', sound: 'Roar!', soundText: 'The lion goes roar!', bg: '#FFF3E0',
    freq: 120, dur: 1.0, type: 'sawtooth', mod: { freq: 8, depth: 40 }, noiseLevel: 0.15 },
  { emoji: '🐔', name: 'Chicken', sound: 'Cluck!', soundText: 'The chicken goes cluck!', bg: '#FFFDE7',
    freq: 800, dur: 0.08, type: 'sine', reps: 4, gap: 0.12, freqEnd: 600 },
  { emoji: '🦆', name: 'Duck', sound: 'Quack!', soundText: 'The duck goes quack quack!', bg: '#E3F2FD',
    freq: 500, dur: 0.15, type: 'sawtooth', reps: 2, gap: 0.2, freqEnd: 350 },
  { emoji: '🐑', name: 'Sheep', sound: 'Baa!', soundText: 'The sheep goes baa baa!', bg: '#F5F5F5',
    freq: 400, dur: 0.4, type: 'triangle', mod: { freq: 6, depth: 50 }, freqEnd: 350 },
  { emoji: '🐴', name: 'Horse', sound: 'Neigh!', soundText: 'The horse goes neigh!', bg: '#EFEBE9',
    freq: 600, dur: 0.6, type: 'sawtooth', freqEnd: 200, mod: { freq: 10, depth: 80 } },
  { emoji: '🦉', name: 'Owl', sound: 'Hoo!', soundText: 'The owl goes hoo hoo!', bg: '#E8EAF6',
    freq: 350, dur: 0.4, type: 'sine', reps: 2, gap: 0.5, freqEnd: 280 },
  { emoji: '🐝', name: 'Bee', sound: 'Buzz!', soundText: 'The bee goes buzz buzz!', bg: '#FFF9C4',
    freq: 200, dur: 1.0, type: 'sawtooth', mod: { freq: 50, depth: 80 } },
  { emoji: '🐘', name: 'Elephant', sound: 'Trumpet!', soundText: 'The elephant trumpets!', bg: '#ECEFF1',
    freq: 300, dur: 0.8, type: 'sawtooth', freqEnd: 800, mod: { freq: 6, depth: 30 } },
  { emoji: '🐍', name: 'Snake', sound: 'Hiss!', soundText: 'The snake goes hiss!', bg: '#E8F5E9',
    freq: 3000, dur: 0.8, type: 'sine', noiseLevel: 0.3, freqEnd: 2000 },
  { emoji: '🦜', name: 'Parrot', sound: 'Squawk!', soundText: 'The parrot goes squawk!', bg: '#FFECB3',
    freq: 1200, dur: 0.12, type: 'square', reps: 3, gap: 0.1, freqEnd: 800 },
]

let audioCtx: AudioContext | null = null
function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  if (audioCtx.state === 'suspended') audioCtx.resume()
  return audioCtx
}

function playAnimalSound(animal: Animal) {
  const ctx = getCtx()
  const reps = animal.reps || 1
  for (let r = 0; r < reps; r++) {
    const offset = r * (animal.dur + (animal.gap || 0))
    const now = ctx.currentTime + offset

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = animal.type
    osc.frequency.setValueAtTime(animal.freq, now)
    if (animal.freqEnd) osc.frequency.linearRampToValueAtTime(animal.freqEnd, now + animal.dur)

    // Vibrato / modulation
    if (animal.mod) {
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = animal.mod.freq
      lfoGain.gain.value = animal.mod.depth
      lfo.connect(lfoGain)
      lfoGain.connect(osc.frequency)
      lfo.start(now)
      lfo.stop(now + animal.dur)
    }

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.35, now + 0.02)
    gain.gain.setValueAtTime(0.35, now + animal.dur * 0.7)
    gain.gain.exponentialRampToValueAtTime(0.001, now + animal.dur)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + animal.dur + 0.01)

    // Add noise for roars / hisses
    if (animal.noiseLevel) {
      const bufferSize = ctx.sampleRate * animal.dur
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1)
      const noise = ctx.createBufferSource()
      noise.buffer = noiseBuffer
      const ng = ctx.createGain()
      ng.gain.setValueAtTime(animal.noiseLevel, now)
      ng.gain.exponentialRampToValueAtTime(0.001, now + animal.dur)
      noise.connect(ng)
      ng.connect(ctx.destination)
      noise.start(now)
      noise.stop(now + animal.dur)
    }
  }
}

export default function AnimalSounds({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [active, setActive] = useState<number | null>(null)
  const [mode, setMode] = useState<'browse' | 'quiz'>('browse')
  const [quizAnimal, setQuizAnimal] = useState<Animal | null>(null)
  const [quizOptions, setQuizOptions] = useState<Animal[]>([])
  const [quizScore, setQuizScore] = useState(0)
  const [quizRound, setQuizRound] = useState(0)
  const [quizTotal, setQuizTotal] = useState(10)
  const [feedback, setFeedback] = useState('')
  const [answered, setAnswered] = useState(false)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)); cancelSpeech() }
  }, [])

  function safeTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms); timersRef.current.push(id); return id
  }

  function tapAnimal(idx: number) {
    const animal = ANIMALS[idx]
    setActive(idx)
    playAnimalSound(animal)
    safeTimeout(() => speakText(animal.soundText), animal.dur * (animal.reps || 1) * 1000 + 300)
    safeTimeout(() => setActive(null), 2000)
  }

  function startQuiz() {
    playSound('success'); setMode('quiz'); setQuizScore(0); setQuizRound(0); setStreak(0); setBestStreak(0)
    nextQuizRound()
  }

  const nextQuizRound = useCallback(() => {
    const correct = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
    const opts = new Set<Animal>([correct])
    while (opts.size < 4) opts.add(ANIMALS[Math.floor(Math.random() * ANIMALS.length)])
    setQuizAnimal(correct); setQuizOptions(Array.from(opts).sort(() => Math.random() - 0.5))
    setFeedback(''); setAnswered(false); setQuizRound(r => r + 1)
    safeTimeout(() => playAnimalSound(correct), 500)
  }, [])

  function answerQuiz(animal: Animal) {
    if (answered) return
    setAnswered(true)
    if (animal.name === quizAnimal?.name) {
      playSound('tada')
      const newStreak = streak + 1
      setStreak(newStreak)
      if (newStreak > bestStreak) setBestStreak(newStreak)
      setFeedback(`✅ Yes! That's the ${quizAnimal.name}! ${newStreak >= 3 ? '🔥 ' + newStreak + ' streak!' : ''}`)
      setQuizScore(s => s + 1)
      safeTimeout(() => {
        if (quizRound < quizTotal) nextQuizRound()
        else { setFeedback(`🎉 Great job! ${quizScore + 1}/${quizTotal}! Best streak: ${Math.max(newStreak, bestStreak)}!`); safeTimeout(() => setMode('browse'), 3000) }
      }, 1500)
    } else {
      playSound('click')
      setStreak(0)
      setFeedback(`❌ That's the ${animal.name}! Listen again...`)
      safeTimeout(() => {
        setAnswered(false); setFeedback('')
        if (quizAnimal) playAnimalSound(quizAnimal)
      }, 2000)
    }
  }

  if (mode === 'quiz' && quizAnimal) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', minHeight: '100vh', padding: 20, fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <button onClick={() => setMode('browse')} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #4CAF50', borderRadius: 25, padding: '12px 20px', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>← Back</button>
          <span style={{ fontSize: 15, fontWeight: 'bold', color: '#4CAF50' }}>Round {quizRound}/{quizTotal} | ⭐{quizScore} | 🔥{streak}</span>
        </div>
        <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 30, padding: 25, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#4CAF50', margin: '0 0 12px 0', fontSize: 20 }}>🔊 Which animal sounds like this?</h2>
            <button onClick={() => quizAnimal && playAnimalSound(quizAnimal)} style={{
              background: 'linear-gradient(135deg, #FFB74D, #FFA726)', color: '#fff', border: 'none',
              width: 80, height: 80, borderRadius: '50%', fontSize: 36, cursor: 'pointer', marginBottom: 15,
              boxShadow: '0 4px 12px rgba(255,183,77,0.4)'
            }}>🔊</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {quizOptions.map(a => (
                <button key={a.name} onClick={() => answerQuiz(a)} disabled={answered} style={{
                  background: answered && a.name === quizAnimal.name ? '#C8E6C9' : a.bg,
                  border: `3px solid ${answered && a.name === quizAnimal.name ? '#4CAF50' : '#ddd'}`,
                  borderRadius: 20, padding: '12px', fontSize: 18, cursor: answered ? 'default' : 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontWeight: 'bold',
                  opacity: answered && a.name !== quizAnimal.name ? 0.5 : 1
                }}>
                  <span style={{ fontSize: 36 }}>{a.emoji}</span>
                  <span style={{ fontSize: 14 }}>{a.name}</span>
                </button>
              ))}
            </div>
            {feedback && (
              <div style={{ marginTop: 12, padding: 10, borderRadius: 15, fontSize: 14, fontWeight: 'bold',
                background: feedback.includes('✅') ? '#E8F5E9' : feedback.includes('🎉') ? '#FFF9C4' : '#FFE4E1',
                color: feedback.includes('✅') ? '#2E7D32' : feedback.includes('🎉') ? '#F57F17' : '#C62828'
              }}>{feedback}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 50%, #DCEDC8 100%)', minHeight: '100vh', padding: 20, fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #4CAF50', borderRadius: 25, padding: '12px 20px', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>← Back</button>
        {pet && <div style={{ fontSize: 32 }}>{pet}</div>}
      </div>
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 28, color: '#2E7D32', margin: '0 0 5px 0' }}>🐾 Animal Sounds</h1>
        <p style={{ fontSize: 13, color: '#666', margin: '0 0 12px 0' }}>Tap an animal to hear its real sound!</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 18 }}>
          {ANIMALS.map((animal, i) => (
            <button key={animal.name} onClick={() => tapAnimal(i)} style={{
              background: active === i ? '#FFD54F' : animal.bg,
              border: `3px solid ${active === i ? '#FFA000' : '#ddd'}`,
              borderRadius: 20, padding: '12px 6px', cursor: 'pointer',
              transform: active === i ? 'scale(1.08)' : 'scale(1)', transition: 'all 0.2s',
              boxShadow: active === i ? '0 6px 20px rgba(255,160,0,0.4)' : '0 2px 8px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: 36, marginBottom: 2 }}>{animal.emoji}</div>
              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#333' }}>{animal.name}</div>
              {active === i && <div style={{ fontSize: 10, color: '#E65100', marginTop: 1 }}>"{animal.sound}"</div>}
            </button>
          ))}
        </div>
        <button onClick={startQuiz} style={{
          background: 'linear-gradient(135deg, #4CAF50, #66BB6A)', color: '#fff', border: 'none',
          borderRadius: 25, padding: '14px 36px', fontSize: 17, fontWeight: 'bold', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
        }}>🎯 Sound Quiz!</button>
      </div>
    </div>
  )
}
