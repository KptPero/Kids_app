import React, { useState, useEffect, useRef } from 'react'
import { playSound } from '../utils/sounds'

const emojiSets = [
  ['🐶','🐱','🐰','🦊','🐻','🐼'],
  ['🍎','🍌','🍇','🍓','🍊','🍑'],
  ['🚗','🚀','✈️','🚂','🚁','⛵'],
  ['⭐','🌙','☀️','🌈','❄️','🌸']
]

type Card = { id: number; emoji: string; flipped: boolean; matched: boolean }

export default function MemoryGame({ onBack, pet }:{ onBack:()=>void, pet?:string }){
  const [cards, setCards] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [moves, setMoves] = useState(0)
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('easy')
  const [setIdx, setSetIdx] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [locked, setLocked] = useState(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    return () => { timersRef.current.forEach(t => clearTimeout(t)) }
  }, [])

  function safeTimeout(fn: () => void, ms: number) {
    const id = setTimeout(fn, ms)
    timersRef.current.push(id)
    return id
  }

  const pairCount = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 4 : 6

  function startGame(){
    playSound('success')
    const emojis = emojiSets[setIdx].slice(0, pairCount)
    const deck = [...emojis, ...emojis].map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1)); [deck[i],deck[j]]=[deck[j],deck[i]] }
    setCards(deck)
    setFlipped([])
    setMatches(0)
    setMoves(0)
    setGameStarted(true)
    setLocked(false)
  }

  function flipCard(id: number){
    if (locked) return
    const card = cards[id]
    if (card.flipped || card.matched) return
    if (flipped.length >= 2) return

    playSound('click')
    const newCards = cards.map(c => c.id === id ? {...c, flipped:true} : c)
    setCards(newCards)
    const newFlipped = [...flipped, id]
    setFlipped(newFlipped)

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      setLocked(true)
      const [a, b] = newFlipped
      if (newCards[a].emoji === newCards[b].emoji) {
        playSound('tada')
        safeTimeout(() => {
          setCards(prev => prev.map(c => c.id === a || c.id === b ? {...c, matched:true} : c))
          setMatches(m => m + 1)
          setFlipped([])
          setLocked(false)
        }, 600)
      } else {
        safeTimeout(() => {
          setCards(prev => prev.map(c => c.id === a || c.id === b ? {...c, flipped:false} : c))
          setFlipped([])
          setLocked(false)
        }, 1000)
      }
    }
  }

  const won = gameStarted && matches === pairCount
  const cols = pairCount <= 3 ? 3 : pairCount <= 4 ? 4 : 4

  if (!gameStarted || won) {
    return (
      <div style={{background:'linear-gradient(135deg, #E8D5FF 0%, #F3E5F5 50%, #FFE4E1 100%)', minHeight:'100vh', padding:'20px', position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute',top:30,left:20,fontSize:55,opacity:0.08}}>🃏</div>
        <div style={{position:'absolute',bottom:60,right:30,fontSize:50,opacity:0.08}}>🧠</div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, position:'relative', zIndex:2}}>
          <button onClick={()=>{playSound('click');onBack()}} style={{background:'rgba(255,255,255,0.95)', border:'3px solid #9C27B0', borderRadius:'25px', padding:'12px 20px', cursor:'pointer', fontSize:16, fontWeight:'bold', color:'#9C27B0'}}>← Back</button>
          {pet && <div style={{fontSize:32}}>{pet}</div>}
        </div>

        <div style={{maxWidth:450, margin:'0 auto', textAlign:'center', position:'relative', zIndex:2}}>
          <div style={{background:'rgba(255,255,255,0.95)', borderRadius:'30px', padding:'30px', boxShadow:'0 6px 20px rgba(0,0,0,0.1)'}}>
            {won ? (
              <>
                <div style={{fontSize:60, marginBottom:10}}>🎉</div>
                <h2 style={{color:'#9C27B0', margin:'0 0 10px 0'}}>You Won!</h2>
                <p style={{fontSize:16, color:'#666'}}>Completed in {moves} moves!</p>
                <div style={{fontSize:40, marginBottom:15}}>{'⭐'.repeat(moves <= pairCount+2 ? 3 : moves <= pairCount*2 ? 2 : 1)}</div>
              </>
            ) : (
              <>
                <div style={{fontSize:60, marginBottom:10}}>🃏</div>
                <h2 style={{color:'#9C27B0', margin:'0 0 20px 0'}}>Memory Match</h2>
              </>
            )}

            <div style={{marginBottom:15}}>
              <p style={{fontSize:15, color:'#888', margin:'0 0 8px 0'}}>Difficulty:</p>
              <div style={{display:'flex', gap:8, justifyContent:'center'}}>
                {(['easy','medium','hard'] as const).map(d => (
                  <button key={d} onClick={()=>{playSound('click');setDifficulty(d)}} style={{
                    background: difficulty===d ? '#9C27B0' : '#f0e6f6', color: difficulty===d ? '#fff' : '#9C27B0',
                    border:'none', borderRadius:'18px', padding:'10px 20px', fontSize:15, fontWeight:'bold', cursor:'pointer', textTransform:'capitalize'
                  }}>{d}</button>
                ))}
              </div>
            </div>

            <div style={{marginBottom:15}}>
              <p style={{fontSize:15, color:'#888', margin:'0 0 8px 0'}}>Theme:</p>
              <div style={{display:'flex', gap:8, justifyContent:'center'}}>
                {emojiSets.map((set, i) => (
                  <button key={i} onClick={()=>{playSound('click');setSetIdx(i)}} style={{
                    background: setIdx===i ? '#9C27B0' : '#f0e6f6', fontSize:24,
                    border:'none', borderRadius:'18px', padding:'10px 14px', cursor:'pointer'
                  }}>{set[0]}{set[1]}</button>
                ))}
              </div>
            </div>

            <button onClick={startGame} style={{background:'linear-gradient(135deg, #9C27B0, #BA68C8)', color:'#fff', border:'none', borderRadius:'25px', padding:'15px 40px', fontSize:18, fontWeight:'bold', cursor:'pointer', boxShadow:'0 4px 12px rgba(156,39,176,0.3)'}}>
              {won ? '🔄 Play Again' : '🎮 Start Game'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{background:'linear-gradient(135deg, #E8D5FF 0%, #F3E5F5 50%, #FFE4E1 100%)', minHeight:'100vh', padding:'15px', position:'relative', overflow:'hidden'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, position:'relative', zIndex:2}}>
        <button onClick={()=>{playSound('click');setGameStarted(false)}} style={{background:'rgba(255,255,255,0.95)', border:'3px solid #9C27B0', borderRadius:'25px', padding:'12px 18px', cursor:'pointer', fontSize:15, fontWeight:'bold', color:'#9C27B0'}}>← Menu</button>
        <span style={{fontSize:15, fontWeight:'bold', color:'#fff', textShadow:'1px 1px 2px rgba(0,0,0,0.2)'}}>Moves: {moves} | Pairs: {matches}/{pairCount}</span>
        {pet && <div style={{fontSize:28}}>{pet}</div>}
      </div>

      <div style={{display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:10, maxWidth:400, margin:'0 auto', position:'relative', zIndex:2}}>
        {cards.map(card => (
          <button key={card.id} onClick={()=>flipCard(card.id)} style={{
            aspectRatio:'1/1', borderRadius:'18px', border:'none', cursor:'pointer',
            fontSize: card.flipped || card.matched ? 36 : 28,
            background: card.matched ? 'linear-gradient(135deg, #C8E6C9, #A5D6A7)' : card.flipped ? 'linear-gradient(135deg, #fff, #F3E5F5)' : 'linear-gradient(135deg, #9C27B0, #BA68C8)',
            color: card.flipped || card.matched ? '#333' : '#fff',
            boxShadow: card.matched ? '0 2px 8px rgba(76,175,80,0.3)' : '0 4px 12px rgba(156,39,176,0.3)',
            transition:'all 0.3s', transform: card.flipped ? 'rotateY(0deg)' : 'rotateY(0deg)',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            {card.flipped || card.matched ? card.emoji : '❓'}
          </button>
        ))}
      </div>
    </div>
  )
}
