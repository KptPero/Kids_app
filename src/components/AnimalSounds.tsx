import React, { useState, useRef, useEffect } from 'react'
import { playSound, speakText, cancelSpeech } from '../utils/sounds'

interface Animal {
  emoji: string
  name: string
  sound: string
  soundText: string
  bg: string
}

const ANIMALS: Animal[] = [
  { emoji: '🐄', name: 'Cow', sound: 'Moooo', soundText: 'The cow goes mooo!', bg: '#C8E6C9' },
  { emoji: '🐶', name: 'Dog', sound: 'Woof woof', soundText: 'The dog goes woof woof!', bg: '#FFCCBC' },
  { emoji: '🐱', name: 'Cat', sound: 'Meow', soundText: 'The cat goes meow!', bg: '#F3E5F5' },
  { emoji: '🐷', name: 'Pig', sound: 'Oink oink', soundText: 'The pig goes oink oink!', bg: '#FCE4EC' },
  { emoji: '🐸', name: 'Frog', sound: 'Ribbit ribbit', soundText: 'The frog goes ribbit!', bg: '#E8F5E9' },
  { emoji: '🦁', name: 'Lion', sound: 'Roar', soundText: 'The lion goes roar!', bg: '#FFF3E0' },
  { emoji: '🐔', name: 'Chicken', sound: 'Cluck cluck', soundText: 'The chicken goes cluck cluck!', bg: '#FFFDE7' },
  { emoji: '🦆', name: 'Duck', sound: 'Quack quack', soundText: 'The duck goes quack quack!', bg: '#E3F2FD' },
  { emoji: '🐑', name: 'Sheep', sound: 'Baa baa', soundText: 'The sheep goes baa baa!', bg: '#F5F5F5' },
  { emoji: '🐴', name: 'Horse', sound: 'Neigh', soundText: 'The horse goes neigh!', bg: '#EFEBE9' },
  { emoji: '🦉', name: 'Owl', sound: 'Hoo hoo', soundText: 'The owl goes hoo hoo!', bg: '#E8EAF6' },
  { emoji: '🐝', name: 'Bee', sound: 'Buzz buzz', soundText: 'The bee goes buzz buzz!', bg: '#FFF9C4' },
]

export default function AnimalSounds({ onBack, pet }: { onBack: () => void; pet?: string }) {
  const [active, setActive] = useState<number | null>(null)
  const [mode, setMode] = useState<'browse' | 'quiz'>('browse')
  const [quizAnimal, setQuizAnimal] = useState<Animal | null>(null)
  const [quizOptions, setQuizOptions] = useState<Animal[]>([])
  const [quizScore, setQuizScore] = useState(0)
  const [quizRound, setQuizRound] = useState(0)
  const [feedback, setFeedback] = useState('')
  const [answered, setAnswered] = useState(false)
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

  function tapAnimal(idx: number) {
    const animal = ANIMALS[idx]
    setActive(idx)
    playSound('click')
    speakText(animal.soundText)
    safeTimeout(() => setActive(null), 1500)
  }

  function startQuiz() {
    playSound('success')
    setMode('quiz')
    setQuizScore(0)
    setQuizRound(0)
    nextQuizRound()
  }

  function nextQuizRound() {
    const correct = ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
    const opts = new Set<Animal>([correct])
    while (opts.size < 3) {
      opts.add(ANIMALS[Math.floor(Math.random() * ANIMALS.length)])
    }
    setQuizAnimal(correct)
    setQuizOptions(Array.from(opts).sort(() => Math.random() - 0.5))
    setFeedback('')
    setAnswered(false)
    setQuizRound(r => r + 1)
    safeTimeout(() => speakText(correct.soundText), 500)
  }

  function answerQuiz(animal: Animal) {
    if (answered) return
    setAnswered(true)
    if (animal.name === quizAnimal?.name) {
      playSound('tada')
      setFeedback('✅ Yes! That\'s the ' + quizAnimal.name + '!')
      setQuizScore(s => s + 1)
      safeTimeout(() => {
        if (quizRound < 8) nextQuizRound()
        else { setFeedback('🎉 Great job! You got ' + (quizScore + 1) + '/8!'); safeTimeout(() => setMode('browse'), 3000) }
      }, 1500)
    } else {
      playSound('click')
      setFeedback('❌ That\'s the ' + animal.name + '! Listen again...')
      safeTimeout(() => {
        setAnswered(false)
        setFeedback('')
        if (quizAnimal) speakText(quizAnimal.soundText)
      }, 2000)
    }
  }

  if (mode === 'quiz' && quizAnimal) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)', minHeight: '100vh', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <button onClick={() => setMode('browse')} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #4CAF50', borderRadius: 25, padding: '12px 20px', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>← Back</button>
          <span style={{ fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>Round {quizRound}/8 | ⭐ {quizScore}</span>
        </div>
        <div style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 30, padding: 30, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#4CAF50', margin: '0 0 15px 0', fontSize: 22 }}>🔊 Which animal makes this sound?</h2>
            <button onClick={() => quizAnimal && speakText(quizAnimal.soundText)} style={{
              background: 'linear-gradient(135deg, #FFB74D, #FFA726)', color: '#fff', border: 'none',
              width: 80, height: 80, borderRadius: '50%', fontSize: 36, cursor: 'pointer', marginBottom: 20,
              boxShadow: '0 4px 12px rgba(255,183,77,0.4)'
            }}>🔊</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {quizOptions.map(a => (
                <button key={a.name} onClick={() => answerQuiz(a)} disabled={answered} style={{
                  background: answered && a.name === quizAnimal.name ? '#C8E6C9' : a.bg,
                  border: `3px solid ${answered && a.name === quizAnimal.name ? '#4CAF50' : '#ddd'}`,
                  borderRadius: 20, padding: '15px 20px', fontSize: 22, cursor: answered ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 15, fontWeight: 'bold',
                  opacity: answered && a.name !== quizAnimal.name ? 0.5 : 1
                }}>
                  <span style={{ fontSize: 36 }}>{a.emoji}</span>
                  <span>{a.name}</span>
                </button>
              ))}
            </div>
            {feedback && (
              <div style={{ marginTop: 15, padding: 12, borderRadius: 15, fontSize: 16, fontWeight: 'bold',
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
    <div style={{ background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 50%, #DCEDC8 100%)', minHeight: '100vh', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
        <button onClick={() => { playSound('click'); onBack() }} style={{ background: 'rgba(255,255,255,0.95)', border: '3px solid #4CAF50', borderRadius: 25, padding: '12px 20px', cursor: 'pointer', fontSize: 16, fontWeight: 'bold', color: '#4CAF50' }}>← Back</button>
        {pet && <div style={{ fontSize: 32 }}>{pet}</div>}
      </div>
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: 30, color: '#2E7D32', margin: '0 0 5px 0' }}>🐄 Animal Sounds</h1>
        <p style={{ fontSize: 14, color: '#666', margin: '0 0 15px 0' }}>Tap an animal to hear its sound!</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {ANIMALS.map((animal, i) => (
            <button key={animal.name} onClick={() => tapAnimal(i)} style={{
              background: active === i ? '#FFD54F' : animal.bg, border: `3px solid ${active === i ? '#FFA000' : '#ddd'}`,
              borderRadius: 22, padding: '14px 8px', cursor: 'pointer',
              transform: active === i ? 'scale(1.1)' : 'scale(1)', transition: 'all 0.2s',
              boxShadow: active === i ? '0 6px 20px rgba(255,160,0,0.4)' : '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{ fontSize: 40, marginBottom: 4 }}>{animal.emoji}</div>
              <div style={{ fontSize: 13, fontWeight: 'bold', color: '#333' }}>{animal.name}</div>
              {active === i && <div style={{ fontSize: 11, color: '#E65100', marginTop: 2 }}>"{animal.sound}"</div>}
            </button>
          ))}
        </div>
        <button onClick={startQuiz} style={{
          background: 'linear-gradient(135deg, #4CAF50, #66BB6A)', color: '#fff', border: 'none',
          borderRadius: 25, padding: '16px 40px', fontSize: 18, fontWeight: 'bold', cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(76,175,80,0.3)'
        }}>🎯 Sound Quiz!</button>
      </div>
    </div>
  )
}
