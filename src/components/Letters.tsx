import React, { useRef, useState, useEffect } from 'react'
import { playSound, speakText, playPhoneticSound } from '../utils/sounds'
import { logError, ErrorCode } from '../utils/errorLogger'

const upperLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const lowerLetters = 'abcdefghijklmnopqrstuvwxyz'.split('')

export default function Letters({ onBack, pet }:{onBack:()=>void, pet?:string}){
  const canvasRef = useRef<HTMLCanvasElement|null>(null)
  const guideRef = useRef<HTMLCanvasElement|null>(null)
  const [letter, setLetter] = useState('A')
  const [isUpper, setIsUpper] = useState(true)
  const [showGuide, setShowGuide] = useState(true)
  const [tracingScore, setTracingScore] = useState<number | null>(null)
  const [tracingFeedback, setTracingFeedback] = useState('')
  const cleanupRef = useRef<(() => void) | null>(null)

  useEffect(()=>{
    const c = canvasRef.current
    if (!c) return
    c.width = c.clientWidth * devicePixelRatio
    c.height = c.clientHeight * devicePixelRatio
    const ctx = c.getContext('2d')!
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#FF6B9D'

    // Cleanup listeners on unmount
    return () => {
      if (cleanupRef.current) cleanupRef.current()
      window.speechSynthesis?.cancel()
    }
  },[])

  useEffect(()=>{
    drawGuide()
    setTracingScore(null)
    setTracingFeedback('')
  },[letter, showGuide, isUpper])

  function sayLetterName(){
    playSound('success')
    speakText(letter.toUpperCase(), 0.7, 1.2)
  }

  function sayLetterSound(){
    playSound('success')
    playPhoneticSound(letter)
  }

  function drawGuide(){
    const c = guideRef.current
    if (!c) return
    c.width = c.clientWidth * devicePixelRatio
    c.height = c.clientHeight * devicePixelRatio
    const ctx = c.getContext('2d')!
    ctx.scale(devicePixelRatio, devicePixelRatio)
    ctx.clearRect(0,0, c.width, c.height)
    if (showGuide) {
      ctx.save()
      const fontSize = isUpper ? 160 : 140
      ctx.font = `bold ${fontSize}px 'Arial', sans-serif`
      ctx.fillStyle = 'rgba(255,107,157,0.12)'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(letter, c.clientWidth/2, c.clientHeight/2)
      ctx.strokeStyle = 'rgba(255,107,157,0.25)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.strokeText(letter, c.clientWidth/2, c.clientHeight/2)
      ctx.restore()
    }
  }

  function validateTracing(){
    const c = canvasRef.current
    if (!c) return
    try {
    const ctx = c.getContext('2d')!
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = c.width
    tempCanvas.height = c.height
    const tctx = tempCanvas.getContext('2d')!
    tctx.scale(devicePixelRatio, devicePixelRatio)
    const fontSize = isUpper ? 160 : 140
    tctx.font = `bold ${fontSize}px 'Arial', sans-serif`
    tctx.fillStyle = '#000'
    tctx.textAlign = 'center'
    tctx.textBaseline = 'middle'
    tctx.fillText(letter, c.clientWidth/2, c.clientHeight/2)
    
    const guideData = tctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data
    const userData = ctx.getImageData(0, 0, c.width, c.height).data
    
    let guidePixels = 0, matchedPixels = 0, strayPixels = 0, userPixels = 0
    
    for (let i = 0; i < guideData.length; i += 4) {
      const guideHit = guideData[i+3] > 50
      const userHit = userData[i+3] > 50
      if (guideHit) guidePixels++
      if (userHit) userPixels++
      if (guideHit && userHit) matchedPixels++
      if (!guideHit && userHit) strayPixels++
    }
    
    if (userPixels < 20) {
      setTracingScore(0)
      setTracingFeedback('Trace the letter first!')
      playSound('click')
      return
    }
    
    const accuracy = guidePixels > 0 ? (matchedPixels / guidePixels) * 100 : 0
    const penalty = userPixels > 0 ? Math.min(30, (strayPixels / userPixels) * 50) : 0
    const finalScore = Math.max(0, Math.min(100, Math.round(accuracy - penalty)))
    
    setTracingScore(finalScore)
    
    if (finalScore >= 70) {
      playSound('tada')
      setTracingFeedback('⭐ Amazing tracing! ⭐')
      speakText('Amazing job!', 0.8, 1.2)
    } else if (finalScore >= 45) {
      playSound('success')
      setTracingFeedback('👍 Good try!')
      speakText('Good try!', 0.8, 1.2)
    } else {
      playSound('click')
      setTracingFeedback('Follow the dotted letter!')
      speakText('Try to follow the dotted letter!', 0.8, 1.0)
    }
    } catch (e) {
      logError(ErrorCode.CNV_VALIDATE, 'Tracing validation failed', { error: e, component: 'Letters' })
    }
  }

  function startDraw(e:React.MouseEvent|React.TouchEvent){
    e.preventDefault()
    // Clean up any existing listeners from a previous stroke (prevents orphaned listeners)
    cleanupRef.current?.()
    const c = canvasRef.current; if(!c) return
    const ctx = c.getContext('2d')!
    ctx.lineWidth = 10
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#FF6B9D'
    ctx.beginPath()
    const pt = getPos(e, c)
    ctx.moveTo(pt.x, pt.y)
    
    const move = (ev:any)=>{ ev.preventDefault(); const p = getPos(ev, c); ctx.lineTo(p.x, p.y); ctx.stroke() }
    const up = ()=>{ window.removeEventListener('mousemove', move); window.removeEventListener('touchmove', move); window.removeEventListener('mouseup', up); window.removeEventListener('touchend', up); cleanupRef.current = null }
    window.addEventListener('mousemove', move)
    window.addEventListener('touchmove', move, {passive:false})
    window.addEventListener('mouseup', up)
    window.addEventListener('touchend', up)
    // Store cleanup so unmount can remove listeners
    cleanupRef.current = up
  }

  function getPos(e:any, c:HTMLCanvasElement){
    const rect = c.getBoundingClientRect()
    const cl = e.touches ? e.touches[0] : e
    // Don't multiply by devicePixelRatio — ctx is already scaled
    return { x: cl.clientX - rect.left, y: cl.clientY - rect.top }
  }

  function clearCanvas(){
    const c = canvasRef.current; if(!c) return
    c.getContext('2d')!.clearRect(0,0,c.width, c.height)
    setTracingScore(null)
    setTracingFeedback('')
  }

  const allLetters = isUpper ? upperLetters : lowerLetters
  const currentIndex = allLetters.indexOf(letter)

  function nextLetter(){ const i = (currentIndex + 1) % allLetters.length; setLetter(allLetters[i]); clearCanvas() }
  function prevLetter(){ const i = (currentIndex - 1 + allLetters.length) % allLetters.length; setLetter(allLetters[i]); clearCanvas() }
  function toggleCase(){ const newUpper = !isUpper; setIsUpper(newUpper); const idx = Math.max(0, currentIndex); setLetter((newUpper ? upperLetters : lowerLetters)[idx]); clearCanvas() }

  return (
    <div style={{background:'linear-gradient(135deg, #fce4ec 0%, #fff0f5 50%, #e8f8f5 100%)', minHeight:'100vh', padding:'15px', position:'relative', overflow:'hidden'}}>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, position:'relative', zIndex:2}}>
        <button onClick={() => { playSound('click'); onBack() }} style={{background:'rgba(255,255,255,0.55)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:16, padding:'10px 18px', cursor:'pointer', fontSize:14, fontWeight:700, color:'#2d3436'}}>← Back</button>
        <h2 style={{margin:0, fontSize:20, color:'#2d3436', fontWeight:800}}>✏️ Letter Tracing</h2>
        {pet && <div style={{fontSize:32}}>{pet}</div>}
      </div>

      <div style={{background:'rgba(255,255,255,0.6)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:20, padding:'10px', marginBottom:12, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', position:'relative', zIndex:2}}>
        <div style={{display:'flex', gap:8, marginBottom:8, justifyContent:'center'}}>
          <button onClick={toggleCase} style={{background: isUpper ? '#e84393' : '#6c5ce7', color:'#fff', border:'none', borderRadius:14, padding:'10px 18px', cursor:'pointer', fontSize:15, fontWeight:700}}>
            {isUpper ? 'ABC ▸ abc' : 'abc ▸ ABC'}
          </button>
          <button onClick={prevLetter} style={{background:'#e84393', color:'#fff', border:'none', borderRadius:'50%', width:42, height:42, cursor:'pointer', fontWeight:700, fontSize:20}}>‹</button>
          <button onClick={nextLetter} style={{background:'#e84393', color:'#fff', border:'none', borderRadius:'50%', width:42, height:42, cursor:'pointer', fontWeight:700, fontSize:20}}>›</button>
        </div>
        <div style={{display:'flex', gap:4, overflowX:'auto', justifyContent:'center', flexWrap:'wrap'}}>
          {allLetters.map(l => (
            <button key={l} onClick={() => { playSound('click'); setLetter(l); clearCanvas() }} style={{
              padding:'6px 9px', fontSize:14, fontWeight:letter===l?700:500,
              background:letter===l?'#e84393':'rgba(255,255,255,0.5)', color:letter===l?'#fff':'#636e72',
              border:'none', borderRadius:12, cursor:'pointer', minWidth:32
            }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{background:'rgba(255,255,255,0.7)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:24, padding:'20px', boxShadow:'0 4px 16px rgba(0,0,0,0.06)', position:'relative', zIndex:2}}>
        <div style={{fontSize:100, fontWeight:800, textAlign:'center', color:'#e84393', marginBottom:10}}>{letter}</div>

        <div style={{display:'flex', gap:10, justifyContent:'center', marginBottom:15}}>
          <button onClick={sayLetterName} style={{background:'#00b894', color:'#fff', border:'none', borderRadius:16, padding:'12px 18px', fontSize:14, fontWeight:700, cursor:'pointer', flex:1, maxWidth:155}}>
            🗣️ Name "{letter.toUpperCase()}"
          </button>
          <button onClick={sayLetterSound} style={{background:'#e17055', color:'#fff', border:'none', borderRadius:16, padding:'12px 18px', fontSize:14, fontWeight:700, cursor:'pointer', flex:1, maxWidth:155}}>
            🔊 Sound "/{letter.toLowerCase()}/"
          </button>
        </div>

        <div style={{background:'#fefef9', borderRadius:16, padding:'8px', marginBottom:12, position:'relative', border:'2px dashed rgba(253,203,110,0.5)'}}>
          <p style={{fontSize:13, color:'#999', marginTop:0, marginBottom:4, textAlign:'center'}}>✏️ Trace over the dotted letter:</p>
          <div style={{position:'relative', height:220, borderRadius:'16px', overflow:'hidden'}}>
            <canvas ref={guideRef} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none'}} />
            <canvas ref={canvasRef} style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', touchAction:'none', cursor:'crosshair'}} onMouseDown={startDraw} onTouchStart={startDraw} />
          </div>
        </div>

        {tracingScore !== null && (
          <div style={{marginBottom:12, padding:12, background: tracingScore >= 70 ? 'linear-gradient(135deg, #C8E6C9, #E8F5E9)' : tracingScore >= 45 ? 'linear-gradient(135deg, #FFF9C4, #FFF3E0)' : 'linear-gradient(135deg, #FFCDD2, #FFE0E0)', borderRadius:'15px', textAlign:'center', fontSize:15, fontWeight:'bold', color: tracingScore >= 70 ? '#2E7D32' : tracingScore >= 45 ? '#F57F17' : '#D32F2F'}}>
            {tracingFeedback}
            <div style={{fontSize:12, marginTop:4}}>Accuracy: {tracingScore}%</div>
          </div>
        )}

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
          <button onClick={() => { playSound('click'); clearCanvas() }} style={{background:'#e17055', color:'#fff', border:'none', borderRadius:14, padding:'12px', cursor:'pointer', fontSize:14, fontWeight:700}}>🗑️ Clear</button>
          <button onClick={validateTracing} style={{background:'#00b894', color:'#fff', border:'none', borderRadius:14, padding:'12px', cursor:'pointer', fontSize:14, fontWeight:700}}>✅ Check</button>
        </div>

        <button onClick={() => { playSound('click'); setShowGuide(!showGuide) }} style={{width:'100%', marginTop:8, background:showGuide?'rgba(0,0,0,0.06)':'rgba(253,203,110,0.2)', color:'#636e72', border:'none', borderRadius:14, padding:'10px', cursor:'pointer', fontSize:14, fontWeight:700}}>
          {showGuide?'🙈 Hide Guide':'👁️ Show Guide'}
        </button>
      </div>
    </div>
  )
}
