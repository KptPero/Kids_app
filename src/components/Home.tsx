import React, { useState } from 'react'
import { playSound } from '../utils/sounds'
import { CatSVG, BunnySVG, ButterflysvG, DuckSVG } from './Animals'

interface Props {
  onNavigate: (r: string) => void
  onPetChange: (pet: string) => void
  pet: string
}

const PET_EMOJIS: Record<string, string> = {
  cat: '🐱', bunny: '🐰', butterfly: '🦋', duck: '🦆'
}

export default function Home({ onNavigate, onPetChange, pet }: Props) {
  const [showCharSelect, setShowCharSelect] = useState(!pet)
  const [selectedChar, setSelectedChar] = useState(pet ? Object.keys(PET_EMOJIS).find(k => PET_EMOJIS[k] === pet) || '' : '')

  const characters = [
    { id: 'cat', name: 'Whiskers', Component: CatSVG, color: '#FFB6C1' },
    { id: 'bunny', name: 'Hoppy', Component: BunnySVG, color: '#FFDAB9' },
    { id: 'butterfly', name: 'Flutter', Component: ButterflysvG, color: '#DDA0DD' },
    { id: 'duck', name: 'Quacky', Component: DuckSVG, color: '#87CEEB' }
  ]

  function selectCharacter(charId: string) {
    playSound('tada')
    setSelectedChar(charId)
    onPetChange(PET_EMOJIS[charId] || '')
    setShowCharSelect(false)
  }

  const handleNav = (route: string) => {
    playSound('click')
    onNavigate(route)
  }

  if (showCharSelect) {
    return (
      <div style={{background:'linear-gradient(135deg, #FFB6D9 0%, #FFE4E1 100%)', minHeight:'100vh', padding:'20px', textAlign:'center', display:'flex',flexDirection:'column', justifyContent:'center', fontFamily:'"Comic Sans MS", cursive'}}>
        <h1 style={{fontSize:42,color:'#fff',textShadow:'2px 2px 4px rgba(0,0,0,0.2)',marginBottom:10}}>🌈 Welcome! 🌈</h1>
        <p style={{fontSize:18,color:'#fff',marginBottom:40,textShadow:'1px 1px 2px rgba(0,0,0,0.1)'}}>Pick your learning buddy!</p>
        
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,maxWidth:400,margin:'0 auto'}}>
          {characters.map(char => {
            const Comp = char.Component
            return (
              <button key={char.id} onClick={()=>selectCharacter(char.id)} style={{
                background:char.color,
                border:'4px solid #fff',
                borderRadius:'40px',
                padding:'20px',
                cursor:'pointer',
                transition:'all 0.2s',
                boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
                minHeight:140,
                fontFamily:'inherit'
              }}>
                <div style={{width:80,height:80,margin:'0 auto',marginBottom:8}}>
                  <Comp />
                </div>
                <p style={{fontSize:14,fontWeight:'bold',color:'#333'}}>{char.name}</p>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const charName = characters.find(c => c.id === selectedChar)?.name || 'Friend'

  return (
    <div style={{background:'linear-gradient(135deg, #FFB6D9 0%, #FFE4E1 100%)', minHeight:'100vh', padding:'20px', paddingTop:0, fontFamily:'"Comic Sans MS", cursive'}}>
      {/* Header */}
      <div style={{background:'linear-gradient(90deg, #FF6B9D 0%, #FFB6D9 100%)', padding:'16px 20px', borderRadius:'0 0 30px 30px', marginBottom:16, color:'#fff', textAlign:'center', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', gap:10}}>
        <span style={{fontSize:32}}>{PET_EMOJIS[selectedChar] || '🌟'}</span>
        <div>
          <h1 style={{fontSize:28,margin:0,textShadow:'2px 2px 4px rgba(0,0,0,0.2)'}}>Learn & Play!</h1>
          <p style={{fontSize:13,margin:0}}>Hi {charName}! Ready to learn?</p>
        </div>
      </div>

      <div style={{maxWidth:600, margin:'0 auto'}}>
        {/* Reading & Letters */}
        <Section title="📖 Learn to Read" color="#FF6B9D">
          <GameBtn icon="🔤" label="Letter Tracing" onClick={() => handleNav('letters')} bg="#FFB6D9" border="#FF6B9D" />
          <GameBtn icon="🎮" label="Phonics Games" onClick={() => handleNav('phonics')} bg="#FFB6D9" border="#FF6B9D" />
          <GameBtn icon="📚" label="Story Library" onClick={() => handleNav('stories')} bg="#FFD4B4" border="#FF8C42" />
          <GameBtn icon="🌙" label="Bedtime Stories" onClick={() => handleNav('bedtime')} bg="#C5CAE9" border="#3F51B5" />
        </Section>

        {/* Numbers */}
        <Section title="🔢 Learn Numbers" color="#4CAF50">
          <GameBtn icon="🔢" label="Numbers & Counting" onClick={() => handleNav('numbers')} fullWidth bg="#B4E7FF" border="#4CAF50" />
        </Section>

        {/* Games */}
        <Section title="🎯 Fun Games" color="#FF6F00">
          <GameBtn icon="🧩" label="Memory Match" onClick={() => handleNav('memory')} bg="#FFE0B2" border="#FF6F00" />
          <GameBtn icon="🫧" label="Pop Bubbles" onClick={() => handleNav('bubble')} bg="#E1F5FE" border="#039BE5" />
          <GameBtn icon="🚒" label="Fire Fighter" onClick={() => handleNav('firefighter')} bg="#FFCCBC" border="#FF6B35" />
          <GameBtn icon="🌀" label="Fidget Spinner" onClick={() => handleNav('fidget')} bg="#F3E5F5" border="#9C27B0" />
          <GameBtn icon="🎹" label="Music Piano" onClick={() => handleNav('music')} bg="#E8EAF6" border="#3F51B5" />
          <GameBtn icon="🐾" label="Animal Sounds" onClick={() => handleNav('animalsounds')} bg="#C8E6C9" border="#388E3C" />
          <GameBtn icon="👀" label="Peek-a-Boo" onClick={() => handleNav('peekaboo')} bg="#FFF9C4" border="#F9A825" />
          <GameBtn icon="⭐" label="Catch Stars" onClick={() => handleNav('catchstars')} bg="#E8EAF6" border="#1565C0" />
        </Section>

        {/* Learn & Explore */}
        <Section title="🧩 Learn & Explore" color="#00838F">
          <GameBtn icon="🔵" label="Shape Sorter" onClick={() => handleNav('shapesorter')} bg="#B2EBF2" border="#00838F" />
          <GameBtn icon="🎨" label="Color Mixer" onClick={() => handleNav('colormixer')} bg="#F3E5F5" border="#7B1FA2" />
        </Section>

        {/* Creative */}
        <Section title="🎨 Creative Time" color="#9C27B0">
          <GameBtn icon="🖌️" label="Draw & Color" onClick={() => handleNav('drawing')} bg="#E1BEE7" border="#9C27B0" />
          <GameBtn icon="📒" label="Sticker Book" onClick={() => handleNav('stickerbook')} bg="#F3E5F5" border="#7B1FA2" />
          <GameBtn icon="😴" label="Calming Zone" onClick={() => handleNav('calming')} bg="#B3E5FC" border="#0288D1" />
        </Section>

        {/* Settings row */}
        <div style={{display:'flex', gap:12, marginBottom:20}}>
          <button onClick={()=>handleNav('settings')} style={{
            flex:1, background:'linear-gradient(135deg, #FFC75F, #FFE4B5)',
            border:'2px solid #FFA500', borderRadius:25, padding:14, fontSize:16,
            fontWeight:'bold', color:'#333', cursor:'pointer', fontFamily:'inherit'
          }}>⚙️ Settings</button>
          <button onClick={()=>{playSound('click');setShowCharSelect(true)}} style={{
            flex:1, background:'linear-gradient(135deg, #FFCCBC, #FFDECC)',
            border:'2px solid #FF6347', borderRadius:25, padding:14, fontSize:16,
            fontWeight:'bold', color:'#333', cursor:'pointer', fontFamily:'inherit'
          }}>👤 Change Pet</button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{background:'#fff', borderRadius:24, padding:16, marginBottom:14, boxShadow:'0 3px 10px rgba(0,0,0,.08)'}}>
      <h2 style={{fontSize:18, color, marginTop:0, marginBottom:10}}>{title}</h2>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
        {children}
      </div>
    </div>
  )
}

function GameBtn({ icon, label, onClick, bg, border, fullWidth }: {
  icon: string; label: string; onClick: () => void; bg: string; border: string; fullWidth?: boolean
}) {
  return (
    <button onClick={onClick} style={{
      gridColumn: fullWidth ? 'span 2' : undefined,
      background: `linear-gradient(135deg, ${bg} 0%, ${bg}99 100%)`,
      border: `3px solid ${border}`, borderRadius: 20, padding: 14,
      fontSize: 15, fontWeight: 'bold', color: '#333', cursor: 'pointer',
      fontFamily: '"Comic Sans MS", cursive', textAlign: 'center',
      transition: 'transform .15s', lineHeight: 1.3
    }}>
      <span style={{fontSize:24, display:'block', marginBottom:4}}>{icon}</span>
      {label}
    </button>
  )
}
