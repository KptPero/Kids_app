import React, { useState, useRef, useEffect } from 'react'
import { playSound } from '../utils/sounds'

const spinnerDesigns = [
  { name: 'Classic', colors: ['#FF6B9D','#FFB6D9','#FF6B9D'], arms: 3 },
  { name: 'Star', colors: ['#FFD700','#FFA500','#FFD700','#FFA500','#FFD700'], arms: 5 },
  { name: 'Flower', colors: ['#E91E63','#9C27B0','#2196F3','#4CAF50','#FF9800','#FF5722'], arms: 6 },
  { name: 'Simple', colors: ['#2196F3','#2196F3'], arms: 2 }
]

export default function FidgetSpinner({ onBack, pet }:{ onBack:()=>void, pet?:string }){
  const [rotation, setRotation] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [designIdx, setDesignIdx] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const lastTouch = useRef({ x: 0, y: 0, time: 0 })
  const animRef = useRef<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef(0)
  const rotationRef = useRef(0)

  const design = spinnerDesigns[designIdx]

  // Single stable rAF loop — doesn't depend on speed state
  useEffect(() => {
    const animate = () => {
      if (speedRef.current > 0.1) {
        rotationRef.current += speedRef.current
        speedRef.current *= 0.995
        setRotation(rotationRef.current)
        setSpeed(speedRef.current)
        setSpinning(true)
      } else if (speedRef.current > 0) {
        speedRef.current = 0
        setSpeed(0)
        setSpinning(false)
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, []) // Empty deps — stable loop

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    const client = 'touches' in e ? e.touches[0] : e
    lastTouch.current = { x: client.clientX, y: client.clientY, time: Date.now() }
  }

  function handleEnd(e: React.MouseEvent | React.TouchEvent) {
    const client = 'changedTouches' in e ? e.changedTouches[0] : e
    const dx = client.clientX - lastTouch.current.x
    const dy = client.clientY - lastTouch.current.y
    const dt = Math.max(1, Date.now() - lastTouch.current.time)
    const dist = Math.sqrt(dx*dx + dy*dy)
    const newSpeed = Math.min(40, (dist / dt) * 15)
    
    if (newSpeed > 2) {
      playSound('click')
      speedRef.current = Math.min(50, speedRef.current + newSpeed)
      setSpeed(speedRef.current)
    }
  }

  const rpmDisplay = Math.round(speed * 10)

  return (
    <div style={{background:'linear-gradient(135deg, #fffde8 0%, #fef5e7 50%, #fff0f0 100%)', minHeight:'100vh', padding:'20px', position:'relative', overflow:'hidden'}}>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15, position:'relative', zIndex:2}}>
        <button onClick={()=>{playSound('click');onBack()}} style={{background:'rgba(255,255,255,0.55)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:16, padding:'10px 18px', cursor:'pointer', fontSize:14, fontWeight:700, color:'#2d3436'}}>← Back</button>
        <h2 style={{margin:0, fontSize:20, color:'#2d3436', fontWeight:800}}>🌀 Fidget Spinner</h2>
        {pet && <div style={{fontSize:32}}>{pet}</div>}
      </div>

      {/* Speed Display */}
      <div style={{textAlign:'center', marginBottom:15, position:'relative', zIndex:2}}>
        <div style={{background:'rgba(255,255,255,0.6)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:18, padding:'10px 20px', display:'inline-block', boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <span style={{fontSize:24, fontWeight:700, color: spinning ? '#e17055' : '#b2bec3'}}>{rpmDisplay} RPM</span>
        </div>
      </div>

      {/* Spinner */}
      <div ref={containerRef} style={{display:'flex', justifyContent:'center', alignItems:'center', height:300, position:'relative', zIndex:2, touchAction:'none', cursor:'grab'}}
        onMouseDown={handleStart} onMouseUp={handleEnd} onTouchStart={handleStart} onTouchEnd={handleEnd}>
        <svg width="220" height="220" viewBox="-110 -110 220 220" style={{transform:`rotate(${rotation}deg)`, transition: speed > 0 ? 'none' : 'transform 0.5s ease-out'}}>
          {design.colors.map((color, i) => {
            const angle = (360 / design.arms) * i
            const rad = angle * Math.PI / 180
            const cx = Math.cos(rad) * 60
            const cy = Math.sin(rad) * 60
            return <circle key={i} cx={cx} cy={cy} r={35} fill={color} stroke="#fff" strokeWidth={3} style={{filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}} />
          })}
          <circle cx={0} cy={0} r={20} fill="#fff" stroke="#ddd" strokeWidth={2} />
          <circle cx={0} cy={0} r={8} fill="#999" />
        </svg>
      </div>

      <p style={{textAlign:'center', fontSize:16, color:'#888', position:'relative', zIndex:2}}>
        {spinning ? '🌀 Spinning!' : '👆 Swipe to spin!'}
      </p>

      {/* Design Picker */}
      <div style={{maxWidth:400, margin:'20px auto 0', position:'relative', zIndex:2}}>
        <div style={{background:'rgba(255,255,255,0.6)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,0.4)', borderRadius:18, padding:'15px', boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
          <p style={{fontSize:15, color:'#888', margin:'0 0 8px 0', textAlign:'center'}}>Choose a spinner:</p>
          <div style={{display:'flex', gap:8, justifyContent:'center'}}>
            {spinnerDesigns.map((d, i) => (
              <button key={i} onClick={()=>{playSound('click');setDesignIdx(i)}} style={{
                background: designIdx===i ? '#e17055' : 'rgba(0,0,0,0.04)',
                color: designIdx===i ? '#fff' : '#636e72', border:'none', borderRadius:14,
                padding:'10px 16px', fontSize:14, fontWeight:700, cursor:'pointer'
              }}>{d.name}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
