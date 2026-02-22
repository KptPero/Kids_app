import React, { useState, useRef, useEffect } from 'react'
import { playSound, getAudioContext } from '../utils/sounds'
import { logError, ErrorCode } from '../utils/errorLogger'
import { backBtnDark } from '../utils/sharedStyles'

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
  const startTime = useRef(0)
  const playbackTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const noteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)



  useEffect(() => {
    return () => {
      playbackTimers.current.forEach(t => clearTimeout(t))
      if (noteTimer.current) clearTimeout(noteTimer.current)
    }
  }, [])

  function playNote(freq: number, noteName: string) {
    const ctx = getAudioContext()
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

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15, position:'relative', zIndex:2}}>
        <button onClick={()=>{playSound('click');onBack()}} style={{...backBtnDark, padding:'8px 16px'}}>← Back</button>
        <h2 style={{margin:0, fontSize:18, color:'#fff', fontWeight:800}}>🎹 Music Studio</h2>
        {pet && <div style={{fontSize:32}}>{pet}</div>}
      </div>

      {/* Instrument Picker */}
      <div style={{display:'flex', gap:8, justifyContent:'center', marginBottom:15, position:'relative', zIndex:2}}>
        {Object.entries(instruments).map(([key, inst]) => (
          <button key={key} onClick={()=>{playSound('click');setInstrument(key)}} style={{
            background: instrument===key ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
            color:'#fff', border: instrument===key ? '1px solid rgba(255,255,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
            borderRadius:14, padding:'10px 14px', fontSize:14, cursor:'pointer', fontWeight:700
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
              border: activeNote===n.note ? `2px solid ${n.color}` : '1px solid rgba(0,0,0,0.12)',
              cursor:'pointer', display:'flex', flexDirection:'column', justifyContent:'flex-end',
              alignItems:'center', paddingBottom:10, fontSize:14, fontWeight:'bold',
              color: activeNote===n.note ? '#fff' : '#636e72',
              boxShadow: activeNote===n.note ? `0 0 16px ${n.color}66` : '0 2px 8px rgba(0,0,0,0.12)',
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
            <button onClick={startRecording} style={{background:'#d63031', color:'#fff', border:'none', borderRadius:14, padding:'10px 20px', fontSize:14, fontWeight:700, cursor:'pointer'}}>
              🔴 Record
            </button>
          ) : (
            <button onClick={stopRecording} style={{background:'#d63031', color:'#fff', border:'none', borderRadius:14, padding:'10px 20px', fontSize:14, fontWeight:700, cursor:'pointer', animation:'pulse 1s infinite'}}>
              ⏹️ Stop ({recorded.length} notes)
            </button>
          )}
          {recorded.length > 0 && !recording && (
            <button onClick={playRecording} disabled={playing} style={{background:'#00b894', color:'#fff', border:'none', borderRadius:14, padding:'10px 20px', fontSize:14, fontWeight:700, cursor:'pointer', opacity:playing?0.6:1}}>
              ▶️ {playing ? 'Playing...' : 'Play Back'}
            </button>
          )}
          {recorded.length > 0 && !recording && (
            <button onClick={()=>{playSound('click');setRecorded([])}} style={{background:'rgba(255,255,255,0.12)', color:'#fff', border:'none', borderRadius:14, padding:'10px 20px', fontSize:14, fontWeight:700, cursor:'pointer'}}>
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
