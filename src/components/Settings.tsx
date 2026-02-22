import React, { useState, useEffect } from 'react';
import { toggleMute, setTTSParams, getMuteState } from '../utils/sounds';
import { getLogEntries, clearLogEntries } from '../utils/errorLogger';
import { backBtn } from '../utils/sharedStyles';

interface Props { onBack: () => void; pet?: string }

export default function Settings({ onBack, pet }: Props) {
  const [muted, setMuted] = useState(() => getMuteState());
  const [speechRate, setSpeechRate] = useState(() => parseFloat(localStorage.getItem('speechRate') || '0.9'));
  const [speechPitch, setSpeechPitch] = useState(() => parseFloat(localStorage.getItem('speechPitch') || '1.1'));
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'colorful');
  const [saved, setSaved] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [logEntries, setLogEntries] = useState<ReturnType<typeof getLogEntries>>([]);

  useEffect(() => {
    // Apply saved settings on mount
    setTTSParams(speechRate, speechPitch);
  }, []);

  function handleMuteToggle() {
    const newMuted = toggleMute();
    setMuted(newMuted);
  }

  function handleSpeechRate(val: number) {
    setSpeechRate(val);
    localStorage.setItem('speechRate', String(val));
    setTTSParams(val, speechPitch);
  }

  function handleSpeechPitch(val: number) {
    setSpeechPitch(val);
    localStorage.setItem('speechPitch', String(val));
    setTTSParams(speechRate, val);
  }

  function handleTheme(t: string) {
    setTheme(t);
    localStorage.setItem('theme', t);
    // Apply theme class to body
    document.body.className = `theme-${t}`;
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    setSpeechRate(0.9);
    setSpeechPitch(1.1);
    setTheme('colorful');
    if (muted) { const newMuted = toggleMute(); setMuted(newMuted); }
    localStorage.removeItem('speechRate');
    localStorage.removeItem('speechPitch');
    localStorage.removeItem('theme');
    localStorage.removeItem('muted');
    document.body.className = 'theme-colorful';
    setTTSParams(0.9, 1.1);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{
      minHeight: '100vh', padding: 16,
      background: 'linear-gradient(135deg, #e8f5e9 0%, #fffde8 50%, #faf0ff 100%)'
    }}>
      {pet && <div style={{ position: 'fixed', bottom: 70, right: 12, fontSize: 36, zIndex: 50, opacity: .85 }}>{pet}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={backBtn}>⬅️ Back</button>
        <h2 style={{ margin: 0, fontSize: 22, color: '#e84393', flex: 1, textAlign: 'center', fontWeight: 800 }}>⚙️ Settings</h2>
      </div>

      <div style={{ maxWidth: 500, margin: '0 auto' }}>
        {/* Sound toggle */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#37474F' }}>🔊 Sound</span>
            <button onClick={handleMuteToggle} style={{
              border: 'none', borderRadius: 30, padding: '10px 24px', fontSize: 16,
              background: muted ? '#EF5350' : '#4CAF50', color: 'white',
              fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit',
              minWidth: 80
            }}>
              {muted ? '🔇 OFF' : '🔊 ON'}
            </button>
          </div>
        </div>

        {/* Speech rate */}
        <div style={card}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#37474F', marginBottom: 8 }}>🗣️ Voice Speed</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { val: 0.6, label: '🐢 Slow' },
              { val: 0.9, label: '🚶 Normal' },
              { val: 1.2, label: '🏃 Fast' },
            ].map(opt => (
              <button key={opt.val} onClick={() => handleSpeechRate(opt.val)} style={{
              border: speechRate === opt.val ? '2px solid #0984e3' : '1px solid rgba(0,0,0,0.08)',
              borderRadius: 14, padding: '10px 16px', fontSize: 15,
              background: speechRate === opt.val ? 'rgba(9,132,227,0.08)' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontWeight: 700,
                flex: 1, minWidth: 80
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Speech pitch */}
        <div style={card}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#37474F', marginBottom: 8 }}>🎵 Voice Pitch</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { val: 0.8, label: '⬇️ Low' },
              { val: 1.1, label: '➡️ Normal' },
              { val: 1.5, label: '⬆️ High' },
            ].map(opt => (
              <button key={opt.val} onClick={() => handleSpeechPitch(opt.val)} style={{
              border: speechPitch === opt.val ? '2px solid #0984e3' : '1px solid rgba(0,0,0,0.08)',
              borderRadius: 14, padding: '10px 16px', fontSize: 15,
              background: speechPitch === opt.val ? 'rgba(9,132,227,0.08)' : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontWeight: 700,
                flex: 1, minWidth: 80
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div style={card}>
          <div style={{ fontSize: 18, fontWeight: 'bold', color: '#37474F', marginBottom: 8 }}>🎨 Theme</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { val: 'colorful', label: '🌈 Colorful', bg: 'linear-gradient(135deg, #FF6B6B, #FFE66D)' },
              { val: 'ocean', label: '🌊 Ocean', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
              { val: 'forest', label: '🌲 Forest', bg: 'linear-gradient(135deg, #56ab2f, #a8e063)' },
            ].map(opt => (
              <button key={opt.val} onClick={() => handleTheme(opt.val)} style={{
              border: theme === opt.val ? '2px solid #2d3436' : '1px solid rgba(0,0,0,0.08)',
              borderRadius: 14, padding: '12px 16px', fontSize: 15,
                background: opt.bg, color: 'white',
                cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
                flex: 1, minWidth: 90, textShadow: '0 1px 2px rgba(0,0,0,.4)'
              }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save & Reset */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button onClick={handleSave} style={{
            border: 'none', borderRadius: 16, padding: '14px 20px', fontSize: 18,
            background: saved ? '#00b894' : '#0984e3', color: 'white',
            fontWeight: 700, cursor: 'pointer',
            flex: 1
          }}>
            {saved ? '✅ Saved!' : '💾 Save'}
          </button>
          <button onClick={handleReset} style={{
            border: 'none', borderRadius: 16, padding: '14px 20px', fontSize: 18,
            background: '#636e72', color: 'white',
            fontWeight: 700, cursor: 'pointer',
            flex: 1
          }}>
            🔄 Reset
          </button>
        </div>

        {/* Error Log Viewer */}
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 'bold', color: '#37474F' }}>📋 Error Log</span>
            <button onClick={() => { setShowLogs(!showLogs); if (!showLogs) setLogEntries(getLogEntries()); }} style={{
              border: 'none', borderRadius: 16, padding: '10px 18px', fontSize: 15,
              background: showLogs ? '#d63031' : '#6c5ce7', color: 'white',
              fontWeight: 700, cursor: 'pointer'
            }}>
              {showLogs ? 'Hide' : 'Show'}
            </button>
          </div>
          {showLogs && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: '#666' }}>{logEntries.length} entries</span>
                <button onClick={() => { clearLogEntries(); setLogEntries([]); }} style={{
                  border: 'none', borderRadius: 12, padding: '8px 16px', fontSize: 14,
                  background: '#d63031', color: 'white', fontWeight: 700,
                  cursor: 'pointer'
                }}>
                  🗑️ Clear All
                </button>
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', borderRadius: 8, background: '#263238', padding: 8 }}>
                {logEntries.length === 0 ? (
                  <p style={{ color: '#81C784', fontSize: 13, textAlign: 'center', margin: 8 }}>✅ No errors logged</p>
                ) : (
                  logEntries.map((entry, i) => (
                    <div key={i} style={{
                      borderBottom: i < logEntries.length - 1 ? '1px solid #37474F' : 'none',
                      padding: '6px 0', fontSize: 11, fontFamily: 'monospace'
                    }}>
                      <div style={{ color: entry.level === 'ERROR' ? '#EF5350' : '#FFB74D', fontWeight: 'bold' }}>
                        [{entry.code}] {entry.level}
                      </div>
                      <div style={{ color: '#B0BEC5' }}>{entry.message}</div>
                      {entry.detail && <div style={{ color: '#78909C', fontSize: 10 }}>{entry.detail}</div>}
                      <div style={{ color: '#546E7A', fontSize: 10 }}>
                        {new Date(entry.timestamp).toLocaleString()}
                        {entry.component && ` · ${entry.component}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* ResponsiveVoice Attribution (required for free tier) */}
        <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 8 }}>
          <a href="https://responsivevoice.org" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#90A4AE', textDecoration: 'none' }}>
            Powered by ResponsiveVoice
          </a>
        </div>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.4)', borderRadius: 18, padding: 16, marginBottom: 12,
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
};
