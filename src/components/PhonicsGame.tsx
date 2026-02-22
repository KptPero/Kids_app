import React, { useState, useEffect, useRef } from 'react'
import { playSound, speakText, playPhoneticSound } from '../utils/sounds'

const phoneticNames: Record<string, string> = {
  A:'ah', B:'buh', C:'kuh', D:'duh', E:'eh', F:'fff', G:'guh', H:'huh',
  I:'ih', J:'juh', K:'kuh', L:'lll', M:'mmm', N:'nnn', O:'aw', P:'puh',
  Q:'kwuh', R:'rrr', S:'sss', T:'tuh', U:'uh', V:'vvv', W:'wuh', X:'ks', Y:'yuh', Z:'zzz'
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
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
      window.speechSynthesis?.cancel()
    }
  }, [])

  function safeTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

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
      <div style={{background:'linear-gradient(135deg, #FFB6D9 0%, #FFE4E1 50%, #FFF9C4 100%)', minHeight:'100vh', padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
        <div style={{background:'rgba(255,255,255,0.95)', borderRadius:'30px', padding:'40px', textAlign:'center', boxShadow:'0 8px 30px rgba(0,0,0,0.1)', maxWidth:400}}>
          <div style={{fontSize:60, marginBottom:10}}>🎉</div>
          <h2 style={{color:'#FF6B9D', margin:'0 0 10px 0'}}>Game Over!</h2>
          <div style={{fontSize:40, marginBottom:10}}>{'⭐'.repeat(stars)}</div>
          <p style={{fontSize:20, fontWeight:'bold', color:'#333'}}>Score: {score}/{totalRounds*10}</p>
          <p style={{fontSize:16, color:'#666'}}>Best Streak: {bestStreak}</p>
          <button onClick={()=>{setGameMode('menu');setGameOver(false)}} style={{background:'linear-gradient(135deg, #FF6B9D, #FFB6D9)', color:'#fff', border:'none', borderRadius:'25px', padding:'15px 40px', fontSize:16, fontWeight:'bold', cursor:'pointer', marginTop:15}}>
            🏠 Back to Menu
          </button>
        </div>
      </div>
    )
  }

  if (gameMode === 'menu') {
    return (
      <div style={{background:'linear-gradient(135deg, #FFB6D9 0%, #FFE4E1 50%, #E8D5FF 100%)', minHeight:'100vh', padding:'20px', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute',top:30,left:20,fontSize:55,opacity:0.08}}>🔊</div>
        <div style={{position:'absolute',bottom:60,right:30,fontSize:50,opacity:0.08}}>🎵</div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, position:'relative', zIndex:2}}>
          <button onClick={onBack} style={{background:'rgba(255,255,255,0.95)', border:'3px solid #FF6B9D', color:'#FF6B9D', padding:'12px 20px', borderRadius:'25px', cursor:'pointer', fontSize:16, fontWeight:'bold'}}>← Back</button>
          {pet && <div style={{fontSize:32}}>{pet}</div>}
        </div>

        <div style={{maxWidth:500, margin:'0 auto', textAlign:'center', position:'relative', zIndex:2}}>
          <h1 style={{fontSize:36, color:'#FF6B9D', marginTop:0}}>🔊 Phonics Games</h1>
          <p style={{fontSize:16, color:'#555', marginBottom:30}}>Learn letter sounds!</p>

          <button onClick={startListeningGame} style={{width:'100%', padding:'22px', marginBottom:15, background:'linear-gradient(135deg, #FF66B2, #FF6B9D)', color:'#fff', border:'none', borderRadius:25, fontSize:20, fontWeight:'bold', cursor:'pointer', boxShadow:'0 6px 15px rgba(255,107,157,0.3)'}}>
            👂 Listen & Choose<br/><span style={{fontSize:15}}>Hear the sound, pick the letter!</span>
          </button>

          <button onClick={startMatchingGame} style={{width:'100%', padding:'22px', background:'linear-gradient(135deg, #7B68EE, #6A5ACD)', color:'#fff', border:'none', borderRadius:25, fontSize:20, fontWeight:'bold', cursor:'pointer', boxShadow:'0 6px 15px rgba(123,104,238,0.3)'}}>
            🎯 Match the Sound<br/><span style={{fontSize:15}}>See the phonetic sound, find the letter!</span>
          </button>
        </div>
      </div>
    )
  }

  const isListening = gameMode === 'listening'
  const bgColor = isListening ? 'linear-gradient(135deg, #FF66B2 0%, #FFB6D9 100%)' : 'linear-gradient(135deg, #7B68EE 0%, #9370DB 100%)'
  const accent = isListening ? '#FF6B9D' : '#7B68EE'

  return (
    <div style={{background:bgColor, minHeight:'100vh', padding:'20px'}}>
      <div style={{maxWidth:500, margin:'0 auto', background:'rgba(255,255,255,0.95)', borderRadius:30, padding:25, boxShadow:'0 8px 24px rgba(0,0,0,0.1)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
          <span style={{fontSize:15, fontWeight:'bold', color:'#666'}}>Round {round}/{totalRounds}</span>
          <span style={{fontSize:15, fontWeight:'bold', color:'#666'}}>Score: {score} | 🔥 {streak}</span>
          <button onClick={()=>setGameMode('menu')} style={{background:accent, color:'#fff', border:'none', padding:'10px 18px', borderRadius:20, cursor:'pointer', fontSize:14, fontWeight:'bold'}}>Quit</button>
        </div>

        <h2 style={{fontSize:24, textAlign:'center', margin:'15px 0', color:accent}}>
          {isListening ? '👂 What letter is this?' : '🎯 Find the letter!'}
        </h2>

        <div style={{textAlign:'center', marginBottom:20}}>
          {isListening ? (
            <button onClick={replaySound} style={{background:'linear-gradient(135deg, #FFB366, #FFA333)', color:'#fff', border:'none', width:90, height:90, borderRadius:'50%', fontSize:40, cursor:'pointer', boxShadow:'0 6px 15px rgba(255,179,102,0.4)', margin:'0 auto'}}>
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
              padding:18, background: answered && l===currentLetter ? '#C8E6C9' : '#fff',
              color: answered && l===currentLetter ? '#2E7D32' : '#333', border:`3px solid ${accent}`,
              borderRadius:20, fontSize:28, fontWeight:'bold', cursor: answered?'default':'pointer',
              transition:'all 0.2s', opacity: answered && l!==currentLetter ? 0.5 : 1
            }}>{l}</button>
          ))}
        </div>

        {feedback && (
          <div style={{textAlign:'center', fontSize:16, fontWeight:'bold', color: feedback.includes('✅')?'#4CAF50':'#FF6B9D', padding:12, background: feedback.includes('✅')?'#E8F5E9':'#FFE4E1', borderRadius:15}}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  )
}
