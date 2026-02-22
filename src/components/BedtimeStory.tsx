import React, { useState, useEffect, useRef } from 'react'
import { playSound, speakText } from '../utils/sounds'
import { BEDTIME_STORIES } from '../data/bedtimeStories'
import { logError, ErrorCode } from '../utils/errorLogger'

export default function BedtimeStory({ onBack }:{onBack:()=>void}){
  const [screen, setScreen] = useState<'select'|'story'|'settings'|'progress'>('select')
  const [storyIdx, setStoryIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentWordIdx, setCurrentWordIdx] = useState(0)
  const [parentalPass, setParentalPass] = useState('')
  const [settingsUnlocked, setSettingsUnlocked] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('all')
  const [selectedLength, setSelectedLength] = useState('all')
  const [completedStories, setCompletedStories] = useState<string[]>([])
  const [stars, setStars] = useState<{id:number, x:number, y:number, tapped:boolean}[]>([])
  const [showRating, setShowRating] = useState(false)
  const [storyRating, setStoryRating] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const ratingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const miscTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const newStars = Array.from({length:15}, (_, i) => ({
      id: i,
      x: Math.random() * 90,
      y: Math.random() * 40,
      tapped: false
    }))
    setStars(newStars)
    return () => {
      // Cleanup on unmount
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (ratingTimerRef.current) clearTimeout(ratingTimerRef.current)
      if (miscTimerRef.current) clearTimeout(miscTimerRef.current)
      window.speechSynthesis?.cancel()
    }
  }, [])

  const story = BEDTIME_STORIES[storyIdx]
  const filteredStories = BEDTIME_STORIES.filter(s => {
    let themeMatch = selectedTheme === 'all' || s.theme === selectedTheme
    let lengthMatch = selectedLength === 'all' || s.length === selectedLength
    return themeMatch && lengthMatch
  })

  function playStory(){
    playSound('success')
    setIsPlaying(true)
    setCurrentWordIdx(0)
    
    let wordIndex = 0
    if (intervalRef.current) clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      try {
      setCurrentWordIdx(wordIndex)
      const word = story.words[wordIndex]
      if (word) {
        speakText(word, 0.75, 1.1)
      }
      wordIndex++
      if (wordIndex >= story.words.length) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        setIsPlaying(false)
        setCurrentWordIdx(0)
        playSound('tada')
        ratingTimerRef.current = setTimeout(() => setShowRating(true), 800)
      }
      } catch (e) {
        logError(ErrorCode.GAM_STORY, `Story playback error at word ${wordIndex}`, { error: e, component: 'BedtimeStory' })
      }
    }, 800)
  }

  function stopStory(){
    window.speechSynthesis.cancel()
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
    setCurrentWordIdx(0)
  }

  function rateStory(rating: number){
    setStoryRating(rating)
    if (!completedStories.includes(story.id)) {
      setCompletedStories([...completedStories, story.id])
    }
    playSound('tada')
    if (miscTimerRef.current) clearTimeout(miscTimerRef.current)
    miscTimerRef.current = setTimeout(() => {
      setShowRating(false)
      setScreen('select')
    }, 1000)
  }

  function toggleStar(starId: number){
    playSound('tada')
    setStars(stars.map(s => 
      s.id === starId ? {...s, tapped: !s.tapped} : s
    ))
  }

  function checkParentalCode(){
    const currentYear = new Date().getFullYear().toString()
    if (parentalPass === currentYear) {
      setSettingsUnlocked(true)
      setParentalPass('')
      playSound('tada')
    } else {
      playSound('click')
      alert('❌ Wrong code, try again!')
      setParentalPass('')
    }
  }

  // Night Mode Background for reading
  const nightBg = 'linear-gradient(180deg, #0B1929 0%, #1a3a52 50%, #2d5a6d 100%)'
  const warmText = '#FFE5B4'
  const softCard = 'rgba(255, 214, 165, 0.1)'

  // Reading Eggs style colors
  const eggsPink = '#FFB6D9'
  const eggsCoral = '#FF6B9D'
  const eggsLightPink = '#FFE4E1'

  if (screen === 'progress') {
    return (
      <div style={{background:`linear-gradient(135deg, ${eggsPink} 0%, ${eggsLightPink} 100%)`, minHeight:'100vh', padding:'20px'}}>
        <button onClick={() => setScreen('select')} style={{
          background:'#fff',
          border:`3px solid ${eggsCoral}`,
          color:eggsCoral,
          padding:'12px 20px',
          borderRadius:'25px',
          cursor:'pointer',
          marginBottom:20,
          fontSize:16,
          fontWeight:'bold'
        }}>← Back</button>

        <div style={{maxWidth:500, margin:'0 auto', textAlign:'center'}}>
          <h2 style={{fontSize:32, color:eggsCoral, marginTop:0}}>📚 My Stories</h2>
          <p style={{fontSize:18, color:'#333', marginBottom:30}}>Great job! You've enjoyed {completedStories.length} story/stories!</p>

          <div style={{display:'grid', gridTemplateColumns:'1fr', gap:15}}>
            {BEDTIME_STORIES.map((s, idx) => {
              const isCompleted = completedStories.includes(s.id)
              return (
                <div key={s.id} style={{
                  background:'#fff',
                  borderRadius:'25px',
                  padding:'20px',
                  border:`3px solid ${isCompleted?'#FFD700':'#ddd'}`,
                  boxShadow:isCompleted?'0 4px 12px rgba(255,215,0,0.3)':'0 2px 8px rgba(0,0,0,0.1)'
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <div style={{textAlign:'left'}}>
                      <h3 style={{fontSize:16, margin:'0 0 5px 0', color:'#333'}}>{s.character}</h3>
                      <p style={{fontSize:13, margin:0, color:'#666'}}>{s.title}</p>
                    </div>
                    <div style={{fontSize:24}}>
                      {isCompleted?'⭐':'🌙'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'settings') {
    return (
      <div style={{background:`linear-gradient(135deg, ${eggsPink} 0%, ${eggsLightPink} 100%)`, minHeight:'100vh', padding:'20px'}}>
        <button onClick={() => setScreen('select')} style={{
          background:'#fff',
          border:`3px solid ${eggsCoral}`,
          color:eggsCoral,
          padding:'12px 20px',
          borderRadius:'25px',
          cursor:'pointer',
          marginBottom:20,
          fontSize:14,
          fontWeight:'bold'
        }}>← Back</button>

        <div style={{maxWidth:500, margin:'0 auto', textAlign:'center'}}>
          {!settingsUnlocked ? (
            <div style={{padding:30, background:'#fff', borderRadius:'30px', marginBottom:20, boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
              <h2 style={{fontSize:28, color:eggsCoral, margin:'0 0 20px 0'}}>🔒 Parent Settings</h2>
              <p style={{fontSize:14, color:'#333', marginBottom:20}}>Enter parental code</p>
              <input type="password" maxLength={4} value={parentalPass} onChange={(e)=>setParentalPass(e.target.value)} placeholder="••••" style={{
                fontSize:24,
                padding:'15px',
                borderRadius:'15px',
                border:`3px solid ${eggsCoral}`,
                background:'#fff',
                color:'#333',
                textAlign:'center',
                width:'100%',
                marginBottom:15,
                boxSizing:'border-box'
              }}/>
              <button onClick={checkParentalCode} style={{
                width:'100%',
                padding:'12px',
                background:`linear-gradient(135deg, ${eggsCoral} 0%, #FF5588 100%)`,
                color:'#fff',
                border:'none',
                borderRadius:'15px',
                fontWeight:'bold',
                cursor:'pointer',
                fontSize:16
              }}>Unlock</button>
              <p style={{fontSize:12, color:'#666', marginTop:15}}>Hint: Current year</p>
            </div>
          ) : (
            <>
              <h2 style={{fontSize:28, color:eggsCoral, margin:'0 0 25px 0'}}>⚙️ Settings</h2>
              
              <div style={{padding:20, background:'#fff', borderRadius:'25px', marginBottom:20, boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
                <h3 style={{fontSize:18, marginTop:0, color:'#333'}}>Story Theme</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                  {['all', 'kindness', 'curiosity', 'sharing', 'bravery', 'wonder', 'comfort'].map(theme => (
                    <button key={theme} onClick={()=>setSelectedTheme(theme)} style={{
                      padding:'12px',
                      borderRadius:'12px',
                      border:`3px solid ${selectedTheme===theme?eggsCoral:'#ddd'}`,
                      background:selectedTheme===theme?`${eggsCoral}15`:'#fff',
                      color:'#333',
                      cursor:'pointer',
                      fontSize:11,
                      fontWeight:'bold',
                      textTransform:'capitalize'
                    }}>
                      {theme === 'all' ? '📚 All' : theme === 'kindness' ? '💕 Kindness' : theme === 'curiosity' ? '🔍 Curious' : theme === 'sharing' ? '🤝 Sharing' : theme === 'bravery' ? '💪 Brave' : theme === 'wonder' ? '✨ Wonder' : '🤗 Comfort'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{padding:20, background:'#fff', borderRadius:'25px', marginBottom:20, boxShadow:'0 4px 12px rgba(0,0,0,0.1)'}}>
                <h3 style={{fontSize:18, marginTop:0, color:'#333'}}>Story Length</h3>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
                  {['all', '5', '10'].map(len => (
                    <button key={len} onClick={()=>setSelectedLength(len)} style={{
                      padding:'12px',
                      borderRadius:'12px',
                      border:`3px solid ${selectedLength===len?eggsCoral:'#ddd'}`,
                      background:selectedLength===len?`${eggsCoral}15`:'#fff',
                      color:'#333',
                      cursor:'pointer',
                      fontSize:12,
                      fontWeight:'bold'
                    }}>
                      {len === 'all' ? 'Any' : len + ' min'}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={()=>{setSettingsUnlocked(false);setScreen('select')}} style={{
                width:'100%',
                padding:'15px',
                background:`linear-gradient(135deg, ${eggsCoral} 0%, #FF5588 100%)`,
                color:'#fff',
                border:'none',
                borderRadius:'15px',
                fontWeight:'bold',
                cursor:'pointer',
                fontSize:16
              }}>
                Save & Return
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  if (screen === 'story') {
    const isCompleted = completedStories.includes(story.id)
    
    return (
      <div style={{background:nightBg, minHeight:'100vh', padding:'20px', position:'relative', overflow:'hidden'}}>
        {/* Twinkling stars background */}
        <div style={{position:'absolute', top:0, left:0, width:'100%', height:'50%', pointerEvents:'none'}}>
          {stars.map(star => (
            <div key={star.id} onClick={()=>toggleStar(star.id)} style={{
              position:'absolute',
              left:star.x+'%',
              top:star.y+'%',
              fontSize:'24px',
              cursor:'pointer',
              pointerEvents:'auto',
              animation:'twinkle 3s infinite',
              filter:star.tapped?'brightness(1.5)':'brightness(1)',
              transition:'filter 0.3s'
            }} onMouseOver={(e)=>{e.currentTarget.style.fontSize='28px'}} onMouseOut={(e)=>{e.currentTarget.style.fontSize='24px'}}>
              ⭐
            </div>
          ))}
        </div>

        {/* Story Content */}
        <div style={{maxWidth:600, margin:'0 auto', position:'relative', zIndex:10}}>
          <button onClick={()=>{ playSound('click'); stopStory(); setScreen('select') }} style={{
            background:'rgba(255,229,180,0.2)',
            border:`2px solid ${warmText}`,
            color:warmText,
            padding:'10px 16px',
            borderRadius:'20px',
            cursor:'pointer',
            marginBottom:20,
            fontSize:14,
            fontWeight:'bold'
          }}>← Menu</button>

          <div style={{background:softCard, borderRadius:'30px', padding:'30px', marginBottom:20}}>
            <h2 style={{fontSize:28, color:warmText, textAlign:'center', marginTop:0}}>{story.title}</h2>
            
            {/* Story Text with highlighting */}
            <div style={{
              fontSize:20,
              lineHeight:'1.9',
              color:warmText,
              minHeight:300,
              marginBottom:20,
              fontFamily:"'Nunito', 'Quicksand', sans-serif",
              fontWeight:600,
              letterSpacing:'0.02em'
            }}>
              {story.words.map((word, idx) => (
                <span key={idx} style={{
                  background:isPlaying && idx === currentWordIdx?'rgba(255, 179, 102, 0.4)':'transparent',
                  padding:'2px 4px',
                  borderRadius:'4px',
                  transition:'all 0.3s',
                  fontWeight:isPlaying && idx === currentWordIdx?'bold':'normal'
                }}>
                  {word}{' '}
                </span>
              ))}
            </div>

            {/* Controls */}
            <div style={{display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap'}}>
              {!isPlaying ? (
                <button onClick={playStory} style={{
                  width:80,
                  height:80,
                  borderRadius:'50%',
                  background:'linear-gradient(135deg, #FFB366 0%, #FFA333 100%)',
                  border:'none',
                  fontSize:32,
                  cursor:'pointer',
                  boxShadow:'0 4px 12px rgba(255,179,102,0.4)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  transition:'all 0.2s'
                }} onMouseOver={(e)=>e.currentTarget.style.transform='scale(1.1)'} onMouseOut={(e)=>e.currentTarget.style.transform='scale(1)'}>
                  🎵
                </button>
              ) : (
                <button onClick={stopStory} style={{
                  width:80,
                  height:80,
                  borderRadius:'50%',
                  background:'linear-gradient(135deg, #FF6B6B 0%, #FF4444 100%)',
                  border:'none',
                  fontSize:32,
                  cursor:'pointer',
                  boxShadow:'0 4px 12px rgba(255,75,75,0.4)',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  transition:'all 0.2s'
                }} onMouseOver={(e)=>e.currentTarget.style.transform='scale(1.1)'} onMouseOut={(e)=>e.currentTarget.style.transform='scale(1)'}>
                  ⏹️
                </button>
              )}
              
              <button onClick={()=>{playSound('click');setScreen('select')}} style={{
                width:80,
                height:80,
                borderRadius:'50%',
                background:'rgba(255,229,180,0.2)',
                border:`2px solid ${warmText}`,
                fontSize:32,
                cursor:'pointer',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                transition:'all 0.2s'
              }} onMouseOver={(e)=>e.currentTarget.style.transform='scale(1.1)'} onMouseOut={(e)=>e.currentTarget.style.transform='scale(1)'}>
                💤
              </button>
            </div>

            <p style={{fontSize:12, color:warmText, textAlign:'center', marginTop:15}}>Tap the stars above to wake them up ✨</p>
          </div>
        </div>

        {/* Rating Modal */}
        {showRating && (
          <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100}}>
            <div style={{background:'#fff', borderRadius:'30px', padding:'30px', textAlign:'center', boxShadow:'0 8px 24px rgba(0,0,0,0.3)'}}>
              <h3 style={{fontSize:24, color:eggsCoral, marginTop:0}}>Great Job! 🌟</h3>
              <p style={{fontSize:16, color:'#333', marginBottom:20}}>How did you like the story?</p>
              <div style={{display:'flex', gap:15, justifyContent:'center', marginBottom:20}}>
                {[1,2,3,4,5].map(i => (
                  <button key={i} onClick={()=>rateStory(i)} style={{
                    fontSize:32,
                    background:'none',
                    border:'none',
                    cursor:'pointer',
                    opacity: i <= storyRating ? 1 : 0.4,
                    transition:'all 0.2s'
                  }} onMouseOver={(e)=>e.currentTarget.style.transform='scale(1.2)'} onMouseOut={(e)=>e.currentTarget.style.transform='scale(1)'}>
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes twinkle {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    )
  }

  // Story Selection Screen (Reading Eggs Style)
  const filteredIdx = filteredStories.findIndex(s => s.id === story.id)
  const displayStory = filteredStories.length > 0 ? filteredStories[filteredIdx >= 0 ? filteredIdx : 0] : story

  return (
    <div style={{background:`linear-gradient(135deg, ${eggsPink} 0%, ${eggsLightPink} 100%)`, minHeight:'100vh', padding:'0'}}>
      {/* Header */}
      <div style={{
        background:`linear-gradient(90deg, ${eggsCoral} 0%, ${eggsPink} 100%)`,
        color:'#fff',
        padding:'20px',
        textAlign:'center',
        boxShadow:'0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <button onClick={onBack} style={{
            background:'rgba(255,255,255,0.3)',
            border:'none',
            color:'#fff',
            fontSize:24,
            cursor:'pointer',
            padding:'8px 12px',
            borderRadius:'15px',
            fontWeight:'bold'
          }}>← Home</button>
          
          <h1 style={{margin:0, fontSize:28}}>🌙 Bedtime Stories</h1>
          
          <button onClick={()=>setScreen('settings')} style={{
            background:'rgba(255,255,255,0.3)',
            border:'none',
            color:'#fff',
            fontSize:24,
            cursor:'pointer',
            padding:'8px 12px',
            borderRadius:'15px'
          }}>⚙️</button>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{background:'#fff', padding:'15px 20px', borderBottom:'3px solid '+eggsCoral}}>
        <p style={{margin:'0 0 10px 0', fontSize:14, fontWeight:'bold', color:'#333'}}>
          Stories Completed: {completedStories.length} / {BEDTIME_STORIES.length}
        </p>
        <div style={{background:'#eee', borderRadius:'15px', height:'12px', overflow:'hidden'}}>
          <div style={{
            background:`linear-gradient(90deg, ${eggsCoral} 0%, ${eggsPink} 100%)`,
            height:'100%',
            width:(completedStories.length / BEDTIME_STORIES.length * 100)+'%',
            transition:'width 0.3s'
          }} />
        </div>
      </div>

      {/* Main Content */}
      <div style={{padding:'20px', maxWidth:600, margin:'0 auto'}}>
        {/* Featured Story */}
        <div style={{background:'#fff', borderRadius:'30px', padding:'25px', marginBottom:25, boxShadow:'0 6px 15px rgba(0,0,0,0.1)'}}>
          <div style={{
            fontSize:80,
            textAlign:'center',
            marginBottom:15,
            lineHeight:'1'
          }}>🌙</div>
          <h2 style={{fontSize:24, color:eggsCoral, textAlign:'center', marginTop:0, marginBottom:5}}>{displayStory.title}</h2>
          <p style={{fontSize:14, color:'#666', textAlign:'center', margin:'5px 0 15px 0'}}>by {displayStory.character}</p>
          <div style={{display:'flex', gap:10, justifyContent:'center', marginBottom:15, flexWrap:'wrap'}}>
            <span style={{background:`${eggsCoral}20`, color:eggsCoral, padding:'6px 12px', borderRadius:'15px', fontSize:12, fontWeight:'bold'}}>
              {displayStory.theme.charAt(0).toUpperCase() + displayStory.theme.slice(1)}
            </span>
            <span style={{background:`${eggsCoral}20`, color:eggsCoral, padding:'6px 12px', borderRadius:'15px', fontSize:12, fontWeight:'bold'}}>
              ⏱️ {displayStory.length} min
            </span>
            {completedStories.includes(displayStory.id) && (
              <span style={{background:'#FFD70020', color:'#FFD700', padding:'6px 12px', borderRadius:'15px', fontSize:12, fontWeight:'bold'}}>
                ⭐ Completed
              </span>
            )}
          </div>
          <button onClick={()=>{ playSound('success'); setStoryIdx(BEDTIME_STORIES.findIndex(s => s.id === displayStory.id)); setScreen('story'); setShowRating(false); }} style={{
            width:'100%',
            padding:'16px',
            background:`linear-gradient(135deg, ${eggsCoral} 0%, #FF5588 100%)`,
            color:'#fff',
            border:'none',
            borderRadius:'20px',
            fontSize:18,
            fontWeight:'bold',
            cursor:'pointer',
            boxShadow:'0 4px 12px rgba(255,107,157,0.3)',
            transition:'all 0.2s'
          }} onMouseOver={(e)=>e.currentTarget.style.transform='scale(1.05)'} onMouseOut={(e)=>e.currentTarget.style.transform='scale(1)'}>
            📖 Read to Me
          </button>
        </div>

        {/* All Stories Grid */}
        <div style={{marginBottom:20}}>
          <h3 style={{fontSize:18, color:eggsCoral, marginBottom:15, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            All Stories
            <button onClick={()=>setScreen('progress')} style={{
              background:`linear-gradient(135deg, ${eggsCoral} 0%, #FF5588 100%)`,
              color:'#fff',
              border:'none',
              borderRadius:'15px',
              padding:'8px 12px',
              fontSize:12,
              fontWeight:'bold',
              cursor:'pointer'
            }}>
              📚 My Stories
            </button>
          </h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
            {filteredStories.map((s, idx) => {
              const isCompleted = completedStories.includes(s.id)
              return (
                <button key={s.id} onClick={()=>{ playSound('click'); setStoryIdx(BEDTIME_STORIES.findIndex(st => st.id === s.id)); setScreen('story'); setShowRating(false); }} style={{
                  background:'#fff',
                  border:`3px solid ${isCompleted?'#FFD700':eggsCoral}`,
                  borderRadius:'20px',
                  padding:'15px',
                  cursor:'pointer',
                  transition:'all 0.2s',
                  boxShadow:isCompleted?'0 4px 12px rgba(255,215,0,0.3)':'0 2px 8px rgba(0,0,0,0.1)'
                }} onMouseOver={(e)=>e.currentTarget.style.transform='scale(1.05)'} onMouseOut={(e)=>e.currentTarget.style.transform='scale(1)'}>
                  <div style={{fontSize:40, marginBottom:8}}>{isCompleted?'⭐':'🌙'}</div>
                  <h4 style={{fontSize:13, margin:'0 0 5px 0', color:'#333'}}>{s.character}</h4>
                  <p style={{fontSize:11, margin:0, color:'#666'}}>{s.title}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Filter Info */}
        {(selectedTheme !== 'all' || selectedLength !== 'all') && (
          <div style={{background:'#fff', borderRadius:'15px', padding:'12px', textAlign:'center', fontSize:12, color:'#666'}}>
            Showing {filteredStories.length} of {BEDTIME_STORIES.length} stories
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
