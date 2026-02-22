import React, { useState, useRef, useEffect } from 'react'
import { playSound, speakText } from '../utils/sounds'
import { logError, ErrorCode } from '../utils/errorLogger'

export default function Numbers({ onBack, pet }:{onBack:()=>void, pet?:string}){
  const [mode, setMode] = useState<'menu'|'cards'|'game'|'math'>('menu')
  const [count, setCount] = useState(0)
  const [waiting, setWaiting] = useState(false)
  const [mathQ, setMathQ] = useState({ a: 1, b: 1, op: '+' as '+' | '-' })
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [score, setScore] = useState(0)
  const [cardPage, setCardPage] = useState(0)
  const waitTimer = useRef<any>(null)
  const mathTimer = useRef<any>(null)

  useEffect(() => {
    return () => {
      if (waitTimer.current) clearTimeout(waitTimer.current)
      if (mathTimer.current) clearTimeout(mathTimer.current)
      window.speechSynthesis?.cancel()
    }
  }, [])



  function speakNumber(n:number){
    playSound('success')
    speakText(String(n), 0.8, 1.2)
  }

  function generateMath(){
    let a = Math.floor(Math.random() * 5) + 1
    let b = Math.floor(Math.random() * 5) + 1
    const op = Math.random() > 0.5 ? '+' : '-'
    // Ensure non-negative result for subtraction
    if (op === '-' && b > a) { const tmp = a; a = b; b = tmp }
    setMathQ({ a, b, op: op as '+' | '-' })
    setAnswer('')
    setFeedback('')
  }

  function tap(){
    if (waiting) return
    const newCount = count + 1
    setCount(newCount)
    playSound('tada')
    speakText(String(newCount), 0.9, 1.2)
    setWaiting(true)
    if (waitTimer.current) clearTimeout(waitTimer.current)
    waitTimer.current = setTimeout(() => setWaiting(false), 1200)
  }

  function checkMath(){
    try {
    const correct = mathQ.op === '+' ? mathQ.a + mathQ.b : mathQ.a - mathQ.b
    if (parseInt(answer) === correct) {
      playSound('tada')
      speakText('Correct!', 0.8, 1.2)
      setFeedback('✅ Correct!')
      setScore(s => s + 1)
      if (mathTimer.current) clearTimeout(mathTimer.current)
      mathTimer.current = setTimeout(()=>generateMath(), 1500)
    } else {
      playSound('click')
      speakText(`Try again. The answer is ${correct}`, 0.9, 1.1)
      setFeedback(`Try again! Answer: ${correct}`)
    }
    } catch (e) {
      logError(ErrorCode.GAM_MATH, 'Math check error', { error: e, component: 'Numbers' })
    }
  }

  function reset(){ playSound('click'); setMode('menu'); setCount(0); setScore(0); setAnswer(''); setFeedback(''); setWaiting(false) }

  // Cards: 10 numbers per page, 10 pages = 100
  const cardsPerPage = 10
  const totalPages = 10
  const cardStart = cardPage * cardsPerPage + 1
  const cardNumbers = Array.from({length: cardsPerPage}, (_, i) => cardStart + i)

  if (mode === 'menu') {
    return (
      <div style={{background:'linear-gradient(135deg, #e8f8f5 0%, #eaf6ff 50%, #e8f5e9 100%)', minHeight:'100vh', padding:'15px', position:'relative', overflow:'hidden'}}>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15, position:'relative', zIndex:2}}>
          <button onClick={() => { playSound('click'); onBack() }} style={{background:'rgba(255,255,255,0.55)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:16, padding:'10px 18px', cursor:'pointer', fontSize:14, fontWeight:700, color:'#2d3436'}}>← Back</button>
          <h2 style={{margin:0, fontSize:20, color:'#2d3436', fontWeight:800}}>🔢 Number Fun</h2>
          {pet && <div style={{fontSize:32}}>{pet}</div>}
        </div>

        <div style={{maxWidth:600, margin:'0 auto', position:'relative', zIndex:2}}>
          <div style={{background:'rgba(255,255,255,0.7)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:24, padding:'30px', textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <div style={{fontSize:80, marginBottom:15}}>🔢</div>
            <h2 style={{fontSize:22, color:'#0984e3', margin:'0 0 25px 0'}}>Choose an Activity</h2>
            <div style={{display:'grid', gap:12}}>
              <button onClick={()=>{playSound('click');setMode('cards');setCardPage(0)}} style={{background:'linear-gradient(135deg, #2196F3, #64B5F6)', color:'#fff', border:'none', borderRadius:'25px', padding:'18px', fontSize:18, fontWeight:'bold', cursor:'pointer', boxShadow:'0 4px 12px rgba(33,150,243,0.3)'}}>
                🎴 Number Cards (1-100)
              </button>
              <button onClick={()=>{playSound('click');setMode('game');setCount(0);setWaiting(false)}} style={{background:'linear-gradient(135deg, #4CAF50, #81C784)', color:'#fff', border:'none', borderRadius:'25px', padding:'18px', fontSize:18, fontWeight:'bold', cursor:'pointer', boxShadow:'0 4px 12px rgba(76,175,80,0.3)'}}>
                🔔 Tap & Count
              </button>
              <button onClick={()=>{playSound('click');setMode('math');generateMath()}} style={{background:'linear-gradient(135deg, #FF9800, #FFB74D)', color:'#fff', border:'none', borderRadius:'25px', padding:'18px', fontSize:18, fontWeight:'bold', cursor:'pointer', boxShadow:'0 4px 12px rgba(255,152,0,0.3)'}}>
                ➕ Simple Math
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'cards') {
    return (
      <div style={{background:'linear-gradient(135deg, #e8f8f5 0%, #eaf6ff 50%, #e8f5e9 100%)', minHeight:'100vh', padding:'15px', position:'relative', overflow:'hidden'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, position:'relative', zIndex:2}}>
          <button onClick={reset} style={{background:'rgba(255,255,255,0.55)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:16, padding:'10px 18px', cursor:'pointer', fontSize:14, fontWeight:700, color:'#2d3436'}}>← Menu</button>
          <h2 style={{margin:0, fontSize:18, color:'#2d3436', fontWeight:800}}>Numbers {cardStart}-{cardStart+9}</h2>
          {pet && <div style={{fontSize:28}}>{pet}</div>}
        </div>

        <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10, maxWidth:500, margin:'0 auto 15px', position:'relative', zIndex:2}}>
          {cardNumbers.map(n=>(
            <button key={n} onClick={()=>speakNumber(n)} style={{
              background:'#0984e3', color:'#fff', border:'none',
              borderRadius:16, padding:'14px 4px', fontSize:n>99?24:30, fontWeight:700, cursor:'pointer',
              boxShadow:'0 2px 8px rgba(9,132,227,0.18)', aspectRatio:'1/1', display:'flex',
              alignItems:'center', justifyContent:'center', transition:'all 0.2s'
            }}>{n}</button>
          ))}
        </div>

        <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', position:'relative', zIndex:2}}>
          {Array.from({length:totalPages}, (_,i)=>(
            <button key={i} onClick={()=>{playSound('click');setCardPage(i)}} style={{
              padding:'8px 14px', fontSize:12, fontWeight:cardPage===i?700:500,
              background:cardPage===i?'#0984e3':'rgba(255,255,255,0.6)', color:cardPage===i?'#fff':'#0984e3',
              border:cardPage===i?'none':'1px solid rgba(9,132,227,0.25)', borderRadius:12, cursor:'pointer'
            }}>{i*10+1}-{(i+1)*10}</button>
          ))}
        </div>
      </div>
    )
  }

  if (mode === 'game') {
    return (
      <div style={{background:'linear-gradient(135deg, #e8f5e9 0%, #f0faf0 50%, #eaf6ff 100%)', minHeight:'100vh', padding:'15px', position:'relative', overflow:'hidden'}}>
        <button onClick={reset} style={{background:'rgba(255,255,255,0.55)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:16, padding:'8px 16px', cursor:'pointer', fontSize:14, fontWeight:700, color:'#2d3436', marginBottom:15, position:'relative', zIndex:2}}>← Menu</button>
        
        <div style={{maxWidth:500, margin:'0 auto', position:'relative', zIndex:2}}>
          <div style={{background:'rgba(255,255,255,0.7)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:24, padding:'30px', textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
            <p style={{fontSize:14, color:'#636e72', margin:'0 0 10px 0'}}>Tap to count! Wait between each tap.</p>
            <div style={{fontSize:80, fontWeight:800, color: waiting ? '#e17055' : '#00b894', marginBottom:20, transition:'color 0.3s'}}>
              {count}
            </div>
            {waiting && <p style={{fontSize:14, color:'#e17055', fontWeight:700, margin:'0 0 10px 0'}}>⏳ Wait...</p>}
            <button onClick={tap} disabled={waiting} style={{
              background: waiting ? '#b2bec3' : '#00b894',
              color:'#fff', border:'none', borderRadius:24, padding:'35px 55px', fontSize:22, fontWeight:700,
              cursor: waiting ? 'not-allowed' : 'pointer',
              transition:'all 0.2s', opacity: waiting ? 0.6 : 1
            }}>
              {waiting ? '⏳ WAIT...' : '👆 TAP!'}
            </button>
            <div style={{marginTop:15}}>
              <button onClick={()=>{setCount(0);setWaiting(false)}} style={{background:'#e17055', color:'#fff', border:'none', borderRadius:12, padding:'8px 20px', fontSize:13, cursor:'pointer', fontWeight:700}}>
                🔄 Reset Count
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{background:'linear-gradient(135deg, #fef9ef 0%, #fffde8 50%, #fef5e7 100%)', minHeight:'100vh', padding:'15px', position:'relative', overflow:'hidden'}}>
      <button onClick={reset} style={{background:'rgba(255,255,255,0.55)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:16, padding:'8px 16px', cursor:'pointer', fontSize:14, fontWeight:700, color:'#2d3436', marginBottom:15, position:'relative', zIndex:2}}>← Menu</button>
      
      <div style={{maxWidth:500, margin:'0 auto', position:'relative', zIndex:2}}>
        <div style={{background:'rgba(255,255,255,0.7)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:24, padding:'25px', textAlign:'center', boxShadow:'0 4px 16px rgba(0,0,0,0.06)'}}>
          <p style={{fontSize:13, color:'#666', margin:'0 0 5px 0'}}>Score: {score}</p>
          <div style={{fontSize:48, fontWeight:700, color:'#e17055', margin:'20px 0', padding:'20px', background:'rgba(225,112,85,0.06)', borderRadius:16}}>
            {mathQ.a} {mathQ.op} {mathQ.b} = ?
          </div>
          <input type="number" value={answer} onChange={(e)=>setAnswer(e.target.value)} placeholder="?" style={{width:'100%', padding:'15px', fontSize:24, borderRadius:14, border:'2px solid rgba(225,112,85,0.3)', marginBottom:12, boxSizing:'border-box', textAlign:'center'}} onKeyDown={(e)=>e.key==='Enter'&&checkMath()}/>
          {feedback && <div style={{padding:12, marginBottom:12, borderRadius:12, fontSize:14, fontWeight:700, background:feedback.includes('✅')?'rgba(0,184,148,0.1)':'rgba(253,203,110,0.2)', color:feedback.includes('✅')?'#00b894':'#e17055'}}>{feedback}</div>}
          <button onClick={checkMath} style={{width:'100%', background:'#e17055', color:'#fff', border:'none', borderRadius:16, padding:'15px', fontSize:18, fontWeight:700, cursor:'pointer'}}>✅ Check</button>
        </div>
      </div>
    </div>
  )
}
