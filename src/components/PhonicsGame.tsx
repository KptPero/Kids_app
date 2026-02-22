import React, { useState, useEffect, useRef } from 'react'
import { playSound, speakText, playPhoneticSound } from '../utils/sounds'
import { backBtn } from '../utils/sharedStyles'
import { useSafeTimeout } from '../hooks/useSafeTimeout'

// Australian English phonetic names
const phoneticNames: Record<string, string> = {
  A:'ah', B:'buh', C:'kuh', D:'duh', E:'eh', F:'fuh', G:'guh', H:'huh',
  I:'ih', J:'juh', K:'kuh', L:'luh', M:'muh', N:'nuh', O:'oh', P:'puh',
  Q:'kwuh', R:'ruh', S:'suh', T:'tuh', U:'uh', V:'vuh', W:'wuh', X:'ks', Y:'yuh', Z:'zed'
}

export default function PhonicsGame({ onBack, pet }: { onBack: () => void, pet?:string }) {
  const [gameMode, setGameMode] = useState<'menu'|'listening'|'matching'>('menu')
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(1)
  const [totalRounds] = useState(5)
  const [currentLetter, setCurrentLetter] = useState('A')
  const [feedback, setFeedback] = useState('')
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [options, setOptions] = useState<string[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [answered, setAnswered] = useState(false)
  const safeTimeout = useSafeTimeout()

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel()
    }
  }, [])

  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  function getRandomLetter() { return allLetters[Math.floor(Math.random() * allLetters.length)] }

  function generateOptions(correct: string) {
    const opts = new Set([correct])
    while (opts.size < 4) opts.add(getRandomLetter())
    return Array.from(opts).sort(() => Math.random() - 0.5)
  }

  function startListeningGame() {
    playSound('success')
    setGameMode('listening')
    setScore(0); setRound(1); setStreak(0); setBestStreak(0); setGameOver(false); setAnswered(false)
    const letter = getRandomLetter()
    setCurrentLetter(letter)
    setOptions(generateOptions(letter))
    safeTimeout(() => playPhoneticSound(letter), 600)
  }

  function startMatchingGame() {
    playSound('success')
    setGameMode('matching')
    setScore(0); setRound(1); setStreak(0); setBestStreak(0); setGameOver(false); setAnswered(false)
    const letter = getRandomLetter()
    setCurrentLetter(letter)
    setOptions(generateOptions(letter))
  }

  function replaySound() { playPhoneticSound(currentLetter) }

  function handleAnswer(letter: string) {
    if (answered) return
    setAnswered(true)
    if (letter === currentLetter) {
      playSound('tada')
      setFeedback('✅ Correct! ' + currentLetter + ' says "' + phoneticNames[currentLetter] + '"')
      setScore(s => s + 10)
      setStreak(s => { const ns = s + 1; setBestStreak(b => Math.max(b, ns)); return ns })
      safeTimeout(() => {
        if (round < totalRounds) {
          const newLetter = getRandomLetter()
          setCurrentLetter(newLetter)
          setOptions(generateOptions(newLetter))
          setFeedback('')
          setRound(r => r + 1)
          setAnswered(false)
          if (gameMode === 'listening') safeTimeout(() => playPhoneticSound(newLetter), 400)
        } else {
          setGameOver(true)
        }
      }, 1500)
    } else {
      playSound('click')
      setFeedback('❌ That was ' + currentLetter + '! It says "' + phoneticNames[currentLetter] + '"')
      setStreak(0)
      safeTimeout(() => { setFeedback(''); setAnswered(false) }, 2000)
    }
  }

  if (gameOver) {
    const stars = score >= 40 ? 3 : score >= 25 ? 2 : 1
    return (
      <div style={{background:'linear-gradient(135deg, #fce4ec 0%, #fff0f5 50%, #fffde8 100%)', minHeight:'100vh', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <div style={{background:'rgba(255,255,255,0.7)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:24, padding:'40px', textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', maxWidth:400}}>
          <div style={{fontSize:60, marginBottom:10}}>🎉</div>
          <h2 style={{color:'#e84393', margin:'0 0 10px 0'}}>Game Over!</h2>
          <div style={{fontSize:40, marginBottom:10}}>{'⭐'.repeat(stars)}</div>
          <p style={{fontSize:20, fontWeight:'bold', color:'#333'}}>Score: {score}/{totalRounds*10}</p>
          <p style={{fontSize:16, color:'#666'}}>Best Streak: {bestStreak}</p>
          <button onClick={()=>{setGameMode('menu');setGameOver(false)}} style={{background:'#e84393', color:'#fff', border:'none', borderRadius:16, padding:'15px 40px', fontSize:16, fontWeight:700, cursor:'pointer', marginTop:15}}>
            🏠 Back to Menu
          </button>
        </div>
      </div>
    )
  }

  if (gameMode === 'menu') {
    return (
      <div style={{background:'linear-gradient(135deg, #fce4ec 0%, #fff0f5 50%, #f3eeff 100%)', minHeight:'100vh', padding:'20px', position:'relative', overflow:'hidden'}}>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, position:'relative', zIndex:2}}>
          <button onClick={onBack} style={backBtn}>← Back</button>
          {pet && <div style={{fontSize:32}}>{pet}</div>}
        </div>

        <div style={{maxWidth:500, margin:'0 auto', textAlign:'center', position:'relative', zIndex:2}}>
          <h1 style={{fontSize:32, color:'#e84393', marginTop:0, fontWeight:800}}>🔊 Phonics Games</h1>
          <p style={{fontSize:16, color:'#555', marginBottom:30}}>Learn letter sounds!</p>

          <button onClick={startListeningGame} style={{width:'100%', padding:'22px', marginBottom:15, background:'#e84393', color:'#fff', border:'none', borderRadius:18, fontSize:20, fontWeight:700, cursor:'pointer'}}>
            👂 Listen & Choose<br/><span style={{fontSize:15}}>Hear the sound, pick the letter!</span>
          </button>

          <button onClick={startMatchingGame} style={{width:'100%', padding:'22px', background:'#6c5ce7', color:'#fff', border:'none', borderRadius:18, fontSize:20, fontWeight:700, cursor:'pointer'}}>
            🎯 Match the Sound<br/><span style={{fontSize:15}}>See the phonetic sound, find the letter!</span>
          </button>
        </div>
      </div>
    )
  }

  const isListening = gameMode === 'listening'
  const bgColor = isListening ? 'linear-gradient(135deg, #fce4ec 0%, #fff0f5 100%)' : 'linear-gradient(135deg, #f3eeff 0%, #faf0ff 100%)'
  const accent = isListening ? '#e84393' : '#6c5ce7'

  return (
    <div style={{background:bgColor, minHeight:'100vh', padding:'20px'}}>
      <div style={{maxWidth:500, margin:'0 auto', background:'rgba(255,255,255,0.7)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:24, padding:25, boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
          <span style={{fontSize:15, fontWeight:'bold', color:'#666'}}>Round {round}/{totalRounds}</span>
          <span style={{fontSize:15, fontWeight:'bold', color:'#666'}}>Score: {score} | 🔥 {streak}</span>
          <button onClick={()=>setGameMode('menu')} style={{background:accent, color:'#fff', border:'none', padding:'10px 18px', borderRadius:14, cursor:'pointer', fontSize:14, fontWeight:700}}>Quit</button>
        </div>

        <h2 style={{fontSize:24, textAlign:'center', margin:'15px 0', color:accent}}>
          {isListening ? '👂 What letter is this?' : '🎯 Find the letter!'}
        </h2>

        <div style={{textAlign:'center', marginBottom:20}}>
          {isListening ? (
            <button onClick={replaySound} style={{background:'#e17055', color:'#fff', border:'none', width:90, height:90, borderRadius:'50%', fontSize:40, cursor:'pointer', margin:'0 auto'}}>
              🔊
            </button>
          ) : (
            <div style={{fontSize:48, fontWeight:'bold', color:accent, padding:15, background:'#f5f0ff', borderRadius:20}}>
              /{phoneticNames[currentLetter]}/
            </div>
          )}
          {isListening && <p style={{fontSize:13, color:'#888', marginTop:8}}>Tap 🔊 to replay</p>}
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:15}}>
          {options.map((l, i) => (
            <button key={l+i} onClick={() => handleAnswer(l)} disabled={answered} style={{
              padding:18, background: answered && l===currentLetter ? 'rgba(0,184,148,0.12)' : 'rgba(255,255,255,0.7)',
              color: answered && l===currentLetter ? '#00b894' : '#2d3436', border:`2px solid ${accent}33`,
              borderRadius:16, fontSize:28, fontWeight:700, cursor: answered?'default':'pointer',
              transition:'all 0.2s', opacity: answered && l!==currentLetter ? 0.5 : 1
            }}>{l}</button>
          ))}
        </div>

        {feedback && (
          <div style={{textAlign:'center', fontSize:16, fontWeight:700, color: feedback.includes('✅')?'#00b894':'#e84393', padding:12, background: feedback.includes('✅')?'rgba(0,184,148,0.08)':'rgba(232,67,147,0.06)', borderRadius:14}}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  )
}
