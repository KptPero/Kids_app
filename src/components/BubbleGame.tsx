import React, { useState, useEffect, useRef, useCallback } from 'react'
import { playSound } from '../utils/sounds'

type Bubble = {
  id: number
  x: number
  y: number
  size: number
  color: string
  speedY: number
  wobbleOffset: number
  wobbleSpeed: number
  letter?: string
  emoji?: string
  opacity: number
}

const colors = [
  '#FF6B9D','#FFB74D','#4CAF50','#2196F3','#9C27B0',
  '#FF5722','#00BCD4','#E91E63','#8BC34A','#FF9800'
]
const emojis = ['⭐','🌈','💖','🦋','🌸','🐠','🍭','🎈','✨','🌻']

export default function BubbleGame({ onBack, pet }:{ onBack:()=>void, pet?:string }){
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [pops, setPops] = useState<{id:number, x:number, y:number}[]>([])
  const animRef = useRef<number>(0)
  const bubbleId = useRef(0)
  const bubblesRef = useRef<Bubble[]>([])
  const renderTickRef = useRef(0)
  const comboTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const comboShowTimer = useRef<ReturnType<typeof setTimeout>|null>(null)
  const popTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const started = useRef(false)

  const spawnBubble = useCallback((baseX?: number, baseY?: number) => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const hasLetter = Math.random() > 0.6
    const hasEmoji = !hasLetter && Math.random() > 0.5
    const b: Bubble = {
      id: bubbleId.current++,
      x: baseX != null ? Math.max(5, Math.min(85, baseX + (Math.random() - 0.5) * 20)) : Math.random() * 80 + 10,
      y: baseY != null ? Math.min(105, baseY + 10) : 105 + Math.random() * 10,
      size: Math.random() * 25 + 45,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 0.08 + 0.06, // very gentle upward float
      wobbleOffset: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.01 + 0.008,
      letter: hasLetter ? letters[Math.floor(Math.random()*26)] : undefined,
      emoji: hasEmoji ? emojis[Math.floor(Math.random()*emojis.length)] : undefined,
      opacity: 1
    }
    bubblesRef.current = [...bubblesRef.current, b]
  }, [])

  // Initialize with bubbles spread across screen
  useEffect(() => {
    if (started.current) return
    started.current = true
    for (let i = 0; i < 12; i++) {
      const b: Bubble = {
        id: bubbleId.current++,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 5,
        size: Math.random() * 25 + 45,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 0.08 + 0.06,
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.01 + 0.008,
        letter: Math.random() > 0.6 ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random()*26)] : undefined,
        emoji: Math.random() > 0.7 ? emojis[Math.floor(Math.random()*emojis.length)] : undefined,
        opacity: 1
      }
      bubblesRef.current.push(b)
    }
    setBubbles([...bubblesRef.current])
  }, [])

  // Gentle spawn loop + animation
  useEffect(() => {
    // Slowly add new bubbles from the bottom
    const spawnInterval = setInterval(() => {
      if (bubblesRef.current.length < 20) {
        spawnBubble()
      }
    }, 2000)

    let frameCount = 0
    const animate = () => {
      frameCount++
      // Gentle floating: move up slowly, wobble side-to-side
      bubblesRef.current = bubblesRef.current
        .filter(b => b.y > -10)
        .map(b => ({
          ...b,
          y: b.y - b.speedY,
          x: b.x + Math.sin(frameCount * b.wobbleSpeed + b.wobbleOffset) * 0.12,
          wobbleOffset: b.wobbleOffset
        }))
      // Sync to React every 2 frames (~30fps)
      renderTickRef.current++
      if (renderTickRef.current % 2 === 0) {
        setBubbles([...bubblesRef.current])
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)

    return () => {
      clearInterval(spawnInterval)
      cancelAnimationFrame(animRef.current)
    }
  }, [spawnBubble])

  // Clean up timers
  useEffect(() => {
    return () => {
      if (comboTimer.current) clearTimeout(comboTimer.current)
      if (comboShowTimer.current) clearTimeout(comboShowTimer.current)
      popTimers.current.forEach(t => clearTimeout(t))
    }
  }, [])

  function popBubble(id: number, x: number, y: number) {
    playSound('tada')
    // Remove popped bubble
    bubblesRef.current = bubblesRef.current.filter(b => b.id !== id)
    setBubbles([...bubblesRef.current])
    setScore(s => s + 1)

    // Combo tracking
    setCombo(c => {
      const next = c + 1
      if (next >= 3) {
        setShowCombo(true)
        if (comboShowTimer.current) clearTimeout(comboShowTimer.current)
        comboShowTimer.current = setTimeout(() => setShowCombo(false), 1200)
      }
      return next
    })
    if (comboTimer.current) clearTimeout(comboTimer.current)
    comboTimer.current = setTimeout(() => setCombo(0), 1500)

    // Pop animation
    setPops(p => [...p, {id, x, y}])
    const pt = setTimeout(() => setPops(p => p.filter(pp => pp.id !== id)), 600)
    popTimers.current.push(pt)

    // Spawn 1-2 new bubbles near the pop
    const count = Math.random() > 0.5 ? 2 : 1
    for (let i = 0; i < count; i++) {
      spawnBubble(x, y)
    }
  }

  return (
    <div style={{
      background:'linear-gradient(180deg, #B3E5FC 0%, #E1F5FE 40%, #F3E5F5 80%, #FCE4EC 100%)',
      minHeight:'100vh', position:'relative', overflow:'hidden', touchAction:'none'
    }}>
      {/* Subtle underwater decorations */}
      <div style={{position:'absolute', bottom:0, left:0, right:0, height:'30%',
        background:'linear-gradient(180deg, transparent, rgba(179,229,252,0.3))',
        pointerEvents:'none', zIndex:0}} />

      {/* Top bar */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, padding:'12px 16px',
        display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:10,
        background:'rgba(255,255,255,0.85)', backdropFilter:'blur(8px)',
        borderRadius:'0 0 20px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.08)'
      }}>
        <button onClick={()=>{playSound('click');onBack()}} style={{
          background:'linear-gradient(135deg, #fff, #E1F5FE)', border:'2px solid #0288D1',
          borderRadius:'20px', padding:'10px 18px', cursor:'pointer',
          fontSize:16, fontWeight:'bold', color:'#0288D1', fontFamily: "'Nunito', 'Quicksand', sans-serif"
        }}>← Back</button>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{fontSize:28}}>🫧</span>
          <span style={{fontSize:22, fontWeight:'bold', color:'#0288D1',
            fontFamily: "'Nunito', 'Quicksand', sans-serif"}}>{score}</span>
        </div>
        {pet && <div style={{fontSize:36}}>{pet}</div>}
      </div>

      {/* Combo indicator */}
      {showCombo && (
        <div style={{
          position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)',
          fontSize:48, fontWeight:'bold', color:'#FF6B9D', zIndex:20,
          textShadow:'0 2px 8px rgba(255,107,157,0.5)',
          animation:'comboPopIn 0.4s ease-out',
          fontFamily: "'Nunito', 'Quicksand', sans-serif", pointerEvents:'none'
        }}>
          {combo}x Combo! 🎉
        </div>
      )}

      {/* Pop effects */}
      {pops.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
          fontSize:32, pointerEvents:'none', zIndex:15,
          animation:'popBurst 0.5s ease-out forwards'
        }}>✨</div>
      ))}

      {/* Bubbles */}
      {bubbles.map(b => (
        <div key={b.id} onClick={()=>popBubble(b.id, b.x, b.y)} style={{
          position:'absolute',
          left:`${b.x}%`,
          top:`${b.y}%`,
          width:b.size, height:b.size,
          borderRadius:'50%',
          background:`radial-gradient(circle at 30% 25%, rgba(255,255,255,0.9), ${b.color}88, ${b.color})`,
          boxShadow:`0 4px 20px ${b.color}44, inset 0 -4px 12px rgba(0,0,0,0.08), inset 0 4px 8px rgba(255,255,255,0.6)`,
          cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: b.letter ? b.size * 0.4 : b.emoji ? b.size * 0.35 : 0,
          fontWeight:'bold', color:'#fff',
          textShadow: b.letter ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none',
          transition:'transform 0.15s',
          zIndex:5,
          fontFamily: "'Nunito', 'Quicksand', sans-serif"
        }}>
          {b.letter || b.emoji || ''}
        </div>
      ))}

      <style>{`
        @keyframes comboPopIn {
          0% { transform: translate(-50%,-50%) scale(0.3); opacity:0 }
          60% { transform: translate(-50%,-50%) scale(1.2); opacity:1 }
          100% { transform: translate(-50%,-50%) scale(1); opacity:1 }
        }
        @keyframes popBurst {
          0% { transform: scale(1); opacity:1 }
          100% { transform: scale(2.5); opacity:0 }
        }
      `}</style>
    </div>
  )
}

