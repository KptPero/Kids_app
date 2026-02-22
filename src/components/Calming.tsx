import React, { useState, useRef, useEffect, useCallback } from 'react';
import { logError, logWarn, ErrorCode } from '../utils/errorLogger';

interface Props { onBack: () => void; pet?: string }

type Mode = 'menu' | 'lullabies' | 'breathing' | 'soothing';

interface Lullaby {
  name: string;
  icon: string;
  // [frequency, duration_ms] pairs for simple melodies
  notes: [number, number][];
  tempo: number; // multiplier for durations
}

const LULLABIES: Lullaby[] = [
  {
    name: 'Twinkle Twinkle',
    icon: '⭐',
    tempo: 1,
    notes: [
      [262,400],[262,400],[392,400],[392,400],[440,400],[440,400],[392,800],
      [349,400],[349,400],[330,400],[330,400],[294,400],[294,400],[262,800],
      [392,400],[392,400],[349,400],[349,400],[330,400],[330,400],[294,800],
      [392,400],[392,400],[349,400],[349,400],[330,400],[330,400],[294,800],
      [262,400],[262,400],[392,400],[392,400],[440,400],[440,400],[392,800],
      [349,400],[349,400],[330,400],[330,400],[294,400],[294,400],[262,800],
    ]
  },
  {
    name: 'Mary Had a Little Lamb',
    icon: '🐑',
    tempo: 1,
    notes: [
      [330,400],[294,400],[262,400],[294,400],[330,400],[330,400],[330,800],
      [294,400],[294,400],[294,800],[330,400],[392,400],[392,800],
      [330,400],[294,400],[262,400],[294,400],[330,400],[330,400],[330,400],[330,400],
      [294,400],[294,400],[330,400],[294,400],[262,800],
    ]
  },
  {
    name: 'Row Row Row Your Boat',
    icon: '🚣',
    tempo: 1.1,
    notes: [
      [262,500],[262,500],[262,400],[294,200],[330,500],
      [330,400],[294,200],[330,400],[349,200],[392,800],
      [523,200],[523,200],[523,200],[392,200],[392,200],[392,200],
      [330,200],[330,200],[330,200],[262,200],[262,200],[262,200],
      [392,400],[349,200],[330,400],[294,200],[262,800],
    ]
  },
  {
    name: 'Hush Little Baby',
    icon: '🤫',
    tempo: 1.2,
    notes: [
      [330,400],[330,400],[392,400],[392,400],[440,400],[440,400],[392,600],[0,200],
      [440,400],[392,400],[349,400],[330,400],[294,400],[294,400],[262,600],[0,200],
      [262,400],[294,400],[330,400],[349,400],[392,400],[440,400],[392,600],[0,200],
      [349,400],[330,400],[294,400],[262,400],[294,400],[330,400],[262,800],
    ]
  },
  {
    name: 'Baa Baa Black Sheep',
    icon: '🐑🖤',
    tempo: 1,
    notes: [
      [262,400],[262,400],[392,400],[392,400],[440,300],[494,300],[494,300],[440,500],
      [349,400],[349,400],[330,400],[330,400],[294,400],[294,400],[262,800],
      [392,400],[392,300],[349,300],[349,300],[330,400],[330,400],[294,800],
      [392,400],[392,300],[349,300],[349,300],[330,400],[330,400],[294,800],
      [262,400],[262,400],[392,400],[392,400],[440,300],[494,300],[494,300],[440,500],
      [349,400],[349,400],[330,400],[330,400],[294,400],[294,400],[262,800],
    ]
  },
  {
    name: 'Brahms Lullaby',
    icon: '😴',
    tempo: 1.3,
    notes: [
      [330,600],[330,300],[392,600],[0,100],[330,600],[330,300],[392,600],[0,100],
      [330,300],[392,300],[523,600],[494,600],[440,600],[0,100],
      [349,600],[349,300],[440,600],[0,100],[294,600],[294,300],[349,600],[0,100],
      [330,300],[262,300],[262,300],[330,300],[349,300],[294,600],[0,100],
      [262,300],[330,600],[294,300],[262,600],[0,400],
    ]
  },
];

export default function Calming({ onBack, pet }: Props) {
  const [mode, setMode] = useState<Mode>('menu');
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(0);
  const [soothingOn, setSoothingOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const cancelTokenRef = useRef(0);
  const soothingNodesRef = useRef<{ osc: OscillatorNode[]; gain: GainNode } | null>(null);
  const breathTimerRef = useRef<number>(0);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    return () => {
      cancelTokenRef.current++;
      clearTimeout(breathTimerRef.current);
      stopSoothing();
      audioCtxRef.current?.close();
    };
  }, []);

  // ===== LULLABY PLAYER =====
  async function playLullaby(idx: number) {
    if (playingIdx === idx) { cancelTokenRef.current++; setPlayingIdx(null); return; }
    cancelTokenRef.current++;
    const token = cancelTokenRef.current;
    await new Promise(r => setTimeout(r, 100));
    if (token !== cancelTokenRef.current) return; // another call happened
    setPlayingIdx(idx);
    const ctx = getCtx();
    const lull = LULLABIES[idx];

    try {
    for (const [freq, dur] of lull.notes) {
      if (token !== cancelTokenRef.current) break;
      if (freq > 0) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (dur * lull.tempo) / 1000);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + (dur * lull.tempo) / 1000);
      }
      await new Promise(r => setTimeout(r, dur * lull.tempo));
    }
    } catch (e) {
      logError(ErrorCode.AUD_LULLABY, `Lullaby playback error: "${lull.name}"`, { error: e, component: 'Calming' });
    }
    if (token === cancelTokenRef.current) setPlayingIdx(null);
  }

  // ===== SOOTHING AMBIENT =====
  function startSoothing() {
    try {
    const ctx = getCtx();
    const master = ctx.createGain();
    master.gain.value = 0.08;
    master.connect(ctx.destination);

    // gentle layered drones - C major chord, very soft
    const freqs = [130.81, 164.81, 196.00, 261.63];
    const oscs = freqs.map(f => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = f;
      // slight detuning for warmth
      osc.detune.value = Math.random() * 6 - 3;
      const g = ctx.createGain();
      g.gain.value = 0.25;
      osc.connect(g).connect(master);
      osc.start();
      return osc;
    });

    // add gentle LFO modulation for breathing effect
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15; // very slow
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.02; // Keep small so master gain stays positive (0.08 ± 0.02)
    lfo.connect(lfoGain).connect(master.gain);
    lfo.start();
    oscs.push(lfo);

    soothingNodesRef.current = { osc: oscs, gain: master };
    setSoothingOn(true);
    } catch (e) {
      logError(ErrorCode.AUD_SOOTHING, 'Failed to start soothing sounds', { error: e, component: 'Calming' });
    }
  }

  function stopSoothing() {
    if (soothingNodesRef.current) {
      soothingNodesRef.current.osc.forEach(o => { try { o.stop(); } catch (e) {
        logWarn(ErrorCode.AUD_OSC_STOP, 'Soothing oscillator stop failed', { error: e } as any)
      } });
      soothingNodesRef.current.gain.disconnect();
      soothingNodesRef.current = null;
    }
    setSoothingOn(false);
  }

  function toggleSoothing() {
    if (soothingOn) stopSoothing(); else startSoothing();
  }

  // ===== BREATHING EXERCISE =====
  useEffect(() => {
    if (mode !== 'breathing') return;
    setBreathPhase('inhale');
    setBreathCount(0);
    function cycle(phase: 'inhale' | 'hold' | 'exhale', count: number) {
      setBreathPhase(phase);
      setBreathCount(count);
      const dur = phase === 'inhale' ? 4000 : phase === 'hold' ? 2000 : 4000;
      breathTimerRef.current = window.setTimeout(() => {
        if (phase === 'inhale') cycle('hold', count);
        else if (phase === 'hold') cycle('exhale', count);
        else cycle('inhale', count + 1);
      }, dur);
    }
    cycle('inhale', 0);
    return () => clearTimeout(breathTimerRef.current);
  }, [mode]);

  // ===== RENDER =====
  const bg = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)';

  if (mode === 'lullabies') return (
    <div style={{ minHeight: '100vh', background: bg, padding: 16, fontFamily: "'Nunito', 'Quicksand', sans-serif" }}>
      {pet && <div style={{ position: 'fixed', bottom: 70, right: 12, fontSize: 36, zIndex: 50, opacity: .85 }}>{pet}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => { cancelTokenRef.current++; setPlayingIdx(null); setMode('menu'); }} style={backBtnStyle}>⬅️ Back</button>
        <h2 style={{ margin: 0, fontSize: 20, color: '#ECEFF1', flex: 1, textAlign: 'center' }}>🎵 Lullabies</h2>
      </div>
      <div style={{ display: 'grid', gap: 12 }}>
        {LULLABIES.map((l, i) => (
          <button key={i} onClick={() => playLullaby(i)} style={{
            border: playingIdx === i ? '3px solid #FFD54F' : '2px solid transparent',
            borderRadius: 16, padding: 16, background: 'rgba(255,255,255,.1)',
            color: 'white', fontSize: 18, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 12, fontFamily: 'inherit'
          }}>
            <span style={{ fontSize: 32 }}>{l.icon}</span>
            <span style={{ flex: 1, textAlign: 'left' }}>{l.name}</span>
            <span style={{ fontSize: 24 }}>{playingIdx === i ? '⏹' : '▶️'}</span>
          </button>
        ))}
      </div>
    </div>
  );

  if (mode === 'breathing') {
    const circleSize = breathPhase === 'inhale' ? 200 : breathPhase === 'hold' ? 200 : 100;
    const circleColor = breathPhase === 'inhale' ? '#81D4FA' : breathPhase === 'hold' ? '#CE93D8' : '#A5D6A7';
    const label = breathPhase === 'inhale' ? 'Breathe In...' : breathPhase === 'hold' ? 'Hold...' : 'Breathe Out...';
    return (
      <div style={{ minHeight: '100vh', background: bg, padding: 16, fontFamily: "'Nunito', 'Quicksand', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {pet && <div style={{ position: 'fixed', bottom: 70, right: 12, fontSize: 36, zIndex: 50, opacity: .85 }}>{pet}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, width: '100%' }}>
          <button onClick={() => { clearTimeout(breathTimerRef.current); setMode('menu'); }} style={backBtnStyle}>⬅️ Back</button>
          <h2 style={{ margin: 0, fontSize: 20, color: '#ECEFF1', flex: 1, textAlign: 'center' }}>🫁 Breathing</h2>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: circleSize, height: circleSize, borderRadius: '50%',
            background: circleColor, opacity: .7,
            transition: 'all 3s ease-in-out',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 'bold', color: '#1a1a2e'
          }}>
            {label}
          </div>
          <p style={{ color: '#ECEFF1', fontSize: 16, marginTop: 30 }}>Breaths completed: {breathCount}</p>
        </div>
      </div>
    );
  }

  if (mode === 'soothing') return (
    <div style={{ minHeight: '100vh', background: bg, padding: 16, fontFamily: "'Nunito', 'Quicksand', sans-serif", display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {pet && <div style={{ position: 'fixed', bottom: 70, right: 12, fontSize: 36, zIndex: 50, opacity: .85 }}>{pet}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, width: '100%' }}>
        <button onClick={() => { stopSoothing(); setMode('menu'); }} style={backBtnStyle}>⬅️ Back</button>
        <h2 style={{ margin: 0, fontSize: 20, color: '#ECEFF1', flex: 1, textAlign: 'center' }}>🎶 Soothing Sounds</h2>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 30 }}>
        <div style={{
          width: 180, height: 180, borderRadius: '50%',
          background: soothingOn ? 'radial-gradient(circle, #7E57C2, #311B92)' : 'radial-gradient(circle, #424242, #212121)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 60, cursor: 'pointer', border: '4px solid rgba(255,255,255,.2)',
          animation: soothingOn ? 'pulse 3s ease-in-out infinite' : 'none',
          transition: 'background .5s'
        }} onClick={toggleSoothing}>
          {soothingOn ? '🔊' : '🔇'}
        </div>
        <p style={{ color: '#ECEFF1', fontSize: 18, textAlign: 'center' }}>
          {soothingOn ? 'Gentle ambient tones playing...\nTap the circle to stop.' : 'Tap the circle to play\ngentle calming sounds.'}
        </p>
      </div>
      <style>{`@keyframes pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(126,87,194,.3); } 50% { transform: scale(1.08); box-shadow: 0 0 40px rgba(126,87,194,.6); } }`}</style>
    </div>
  );

  // ===== MENU =====
  return (
    <div style={{ minHeight: '100vh', background: bg, padding: 16, fontFamily: "'Nunito', 'Quicksand', sans-serif" }}>
      {pet && <div style={{ position: 'fixed', bottom: 70, right: 12, fontSize: 36, zIndex: 50, opacity: .85 }}>{pet}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={backBtnStyle}>⬅️ Back</button>
        <h2 style={{ margin: 0, fontSize: 22, color: '#ECEFF1', flex: 1, textAlign: 'center' }}>😴 Calming Zone</h2>
      </div>
      <div style={{ display: 'grid', gap: 16 }}>
        {([
          { m: 'lullabies' as Mode, icon: '🎵', label: 'Lullabies', desc: '6 gentle melodies to relax', color: '#5C6BC0' },
          { m: 'breathing' as Mode, icon: '🫁', label: 'Breathing', desc: 'Guided breathing exercise', color: '#26A69A' },
          { m: 'soothing' as Mode, icon: '🎶', label: 'Soothing Sounds', desc: 'Gentle ambient tones', color: '#7E57C2' },
        ]).map(item => (
          <button key={item.m} onClick={() => setMode(item.m)} style={{
            border: 'none', borderRadius: 20, padding: 20, cursor: 'pointer',
            background: item.color, color: 'white', textAlign: 'left',
            display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'inherit'
          }}>
            <span style={{ fontSize: 42 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 20, fontWeight: 'bold' }}>{item.label}</div>
              <div style={{ fontSize: 14, opacity: .85 }}>{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  border: 'none', borderRadius: 20, padding: '12px 20px', fontSize: 16,
  background: 'linear-gradient(135deg, #5C6BC0, #7986CB)', color: 'white', fontWeight: 'bold', cursor: 'pointer',
  fontFamily: "'Nunito', 'Quicksand', sans-serif"
};
