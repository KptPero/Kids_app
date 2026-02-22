import React, { useState, useRef, useEffect } from 'react'
import { playSound } from '../utils/sounds'
import { logError, logWarn, ErrorCode } from '../utils/errorLogger'

const instruments: Record<string, { type: OscillatorType; name: string; icon: string }> = {
  piano: { type: 'sine', name: 'Piano', icon: '🎹' },
  organ: { type: 'square', name: 'Organ', icon: '🎵' },
  flute: { type: 'triangle', name: 'Flute', icon: '🎶' },
  synth: { type: 'sawtooth', name: 'Synth', icon: '🎸' }
}

const notes = [
  { note: 'C', freq: 262, color: '#FF6B9D' },
  { note: 'D', freq: 294, color: '#FF9800' },
  { note: 'E', freq: 330, color: '#FFD700' },
  { note: 'F', freq: 349, color: '#4CAF50' },
  { note: 'G', freq: 392, color: '#2196F3' },
  { note: 'A', freq: 440, color: '#7B68EE' },
  { note: 'B', freq: 494, color: '#9C27B0' },
  { note: 'C2', freq: 523, color: '#E91E63' }
]

export default function MusicKeyboard({ onBack, pet }:{ onBack:()=>void, pet?:string }){
  const [instrument, setInstrument] = useState<string>('piano')
  const [activeNote, setActiveNote] = useState<string|null>(null)
  const [recording, setRecording] = useState(false)
  const [recorded, setRecorded] = useState<{note:string, time:number}[]>([])
  const [playing, setPlaying] = useState(false)
  const audioCtxRef = useRef<AudioContext|null>(null)
  const startTime = useRef(0)
  const playbackTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)



  useEffect(() => {
    return () => {
      playbackTimers.current.forEach(t => clearTimeout(t))
      if (noteTimer.current) clearTimeout(noteTimer.current)
      audioCtxRef.current?.close()
    }
  }, [])

  function getAudioCtx(): AudioContext | null {
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (e) {
        logError(ErrorCode.AUD_CTX_CREATE, 'MusicKeyboard AudioContext creation failed', { error: e, component: 'MusicKeyboard' })
        return null
      }
    }
    // iOS requires resume after user gesture
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch((e: unknown) => {
        logWarn(ErrorCode.AUD_CTX_RESUME, 'MusicKeyboard AudioContext.resume() failed', { detail: String(e), component: 'MusicKeyboard' })
      })
    }
    return audioCtxRef.current
  }

  function playNote(freq: number, noteName: string) {
    const ctx = getAudioCtx()
    if (!ctx) return
    try {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const inst = instruments[instrument]
    
    osc.type = inst.type
    osc.frequency.value = freq
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.8)
    } catch (e) {
      logError(ErrorCode.AUD_PLAY_NOTE, `playNote failed for ${noteName} (${freq}Hz)`, { error: e, component: 'MusicKeyboard' })
    }
    
    setActiveNote(noteName)
    if (noteTimer.current) clearTimeout(noteTimer.current)
    noteTimer.current = setTimeout(() => setActiveNote(null), 200)

    if (recording) {
      setRecorded(prev => [...prev, { note: noteName, time: Date.now() - startTime.current }])
    }
  }

  function startRecording() {
    playSound('click')
    setRecording(true)
    setRecorded([])
    startTime.current = Date.now()
  }

  function stopRecording() {
    playSound('click')
    setRecording(false)
  }

  function playRecording() {
    if (recorded.length === 0) return
    playSound('success')
    setPlaying(true)
    playbackTimers.current = []
    try {
    recorded.forEach(r => {
      const t = setTimeout(() => {
        const note = notes.find(n => n.note === r.note)
        if (note) playNote(note.freq, note.note)
      }, r.time)
      playbackTimers.current.push(t)
    })
    const lastTime = recorded[recorded.length - 1].time
    const endTimer = setTimeout(() => setPlaying(false), lastTime + 1000)
    playbackTimers.current.push(endTimer)
    } catch (e) {
      logError(ErrorCode.GAM_RECORDING, 'Recording playback failed', { error: e, component: 'MusicKeyboard' })
      setPlaying(false)
    }
  }

  return (
    <div style={{background:'linear-gradient(135deg, #1A237E 0%, #283593 50%, #3F51B5 100%)', minHeight:'100vh', padding:'20px', position:'relative', overflow:'hidden'}}>
      <div style={{position:'absolute',top:30,left:20,fontSize:55,opacity:0.1,color:'#fff'}}>🎵</div>
      <div style={{position:'absolute',bottom:60,right:30,fontSize:50,opacity:0.1,color:'#fff'}}>🎶</div>
      <div style={{position:'absolute',top:100,right:20,fontSize:40,opacity:0.1,color:'#fff'}}>🎼</div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15, position:'relative', zIndex:2}}>
        <button onClick={()=>{playSound('click');onBack()}} style={{background:'rgba(255,255,255,0.15)', border:'2px solid rgba(255,255,255,0.5)', borderRadius:'20px', padding:'8px 16px', cursor:'pointer', fontSize:14, fontWeight:'bold', color:'#fff'}}>← Back</button>
        <h2 style={{margin:0, fontSize:18, color:'#fff'}}>🎹 Music Studio</h2>
        {pet && <div style={{fontSize:32}}>{pet}</div>}
      </div>

      {/* Instrument Picker */}
      <div style={{display:'flex', gap:8, justifyContent:'center', marginBottom:15, position:'relative', zIndex:2}}>
        {Object.entries(instruments).map(([key, inst]) => (
          <button key={key} onClick={()=>{playSound('click');setInstrument(key)}} style={{
            background: instrument===key ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
            color:'#fff', border: instrument===key ? '2px solid #fff' : '2px solid transparent',
            borderRadius:'18px', padding:'10px 14px', fontSize:14, cursor:'pointer', fontWeight:'bold'
          }}>{inst.icon} {inst.name}</button>
        ))}
      </div>

      {/* Piano Keys */}
      <div style={{maxWidth:500, margin:'0 auto', position:'relative', zIndex:2}}>
        <div style={{display:'flex', gap:4, justifyContent:'center', marginBottom:20}}>
          {notes.map(n => (
            <button key={n.note} onClick={()=>playNote(n.freq, n.note)} style={{
              flex:1, height:160, borderRadius:'0 0 12px 12px',
              background: activeNote===n.note 
                ? `linear-gradient(180deg, ${n.color} 0%, ${n.color}CC 100%)` 
                : 'linear-gradient(180deg, #fff 0%, #e8e8e8 100%)',
              border: activeNote===n.note ? `3px solid ${n.color}` : '2px solid #ccc',
              cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'flex-end',
              alignItems:'center', paddingBottom:10, fontSize:14, fontWeight:'bold',
              color: activeNote===n.note ? '#fff' : '#555',
              boxShadow: activeNote===n.note ? `0 0 20px ${n.color}88` : '0 4px 8px rgba(0,0,0,0.2)',
              transition:'all 0.1s'
            }}>
              <div style={{fontSize:18, marginBottom:2}}>{n.note}</div>
              <div style={{width:12, height:12, borderRadius:'50%', background:n.color}} />
            </button>
          ))}
        </div>

        {/* Recording Controls */}
        <div style={{background:'rgba(255,255,255,0.1)', borderRadius:'20px', padding:'15px', display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap'}}>
          {!recording ? (
            <button onClick={startRecording} style={{background:'linear-gradient(135deg, #FF5722, #FF8A65)', color:'#fff', border:'none', borderRadius:'20px', padding:'10px 20px', fontSize:14, fontWeight:'bold', cursor:'pointer'}}>
              🔴 Record
            </button>
          ) : (
            <button onClick={stopRecording} style={{background:'linear-gradient(135deg, #F44336, #EF5350)', color:'#fff', border:'none', borderRadius:'20px', padding:'10px 20px', fontSize:14, fontWeight:'bold', cursor:'pointer', animation:'pulse 1s infinite'}}>
              ⏹️ Stop ({recorded.length} notes)
            </button>
          )}
          {recorded.length > 0 && !recording && (
            <button onClick={playRecording} disabled={playing} style={{background:'linear-gradient(135deg, #4CAF50, #81C784)', color:'#fff', border:'none', borderRadius:'20px', padding:'10px 20px', fontSize:14, fontWeight:'bold', cursor:'pointer', opacity:playing?0.6:1}}>
              ▶️ {playing ? 'Playing...' : 'Play Back'}
            </button>
          )}
          {recorded.length > 0 && !recording && (
            <button onClick={()=>{playSound('click');setRecorded([])}} style={{background:'rgba(255,255,255,0.2)', color:'#fff', border:'none', borderRadius:'20px', padding:'10px 20px', fontSize:14, fontWeight:'bold', cursor:'pointer'}}>
              🗑️ Clear
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%{opacity:1} 50%{opacity:0.6} 100%{opacity:1} }
      `}</style>
    </div>
  )
}
