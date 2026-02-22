import React, { useState, useEffect, useRef } from 'react';
import { STORIES, Story } from '../data/stories';
import { speakLongText, cancelSpeech } from '../utils/sounds';

interface Props { onBack: () => void; pet?: string }

const GENRES = [
  { key: 'all', label: 'All Stories', icon: '📚' },
  { key: 'fairy-tale', label: 'Fairy Tales', icon: '🏰' },
  { key: 'adventure', label: 'Adventures', icon: '⚔️' },
  { key: 'animal', label: 'Animals', icon: '🐾' },
  { key: 'bedtime', label: 'Bedtime', icon: '🌙' },
] as const;

export default function Stories({ onBack, pet }: Props) {
  const [genre, setGenre] = useState<string>('all');
  const [selected, setSelected] = useState<Story | null>(null);
  const [reading, setReading] = useState(false);
  const [page, setPage] = useState(0);
  const cancelRef = useRef<(() => void) | null>(null);

  const filtered = genre === 'all' ? STORIES : STORIES.filter(s => s.genre === genre);

  // split story into pages of ~120 words
  const pages = selected ? splitPages(selected.text, 120) : [];

  useEffect(() => { return () => { if (cancelRef.current) cancelRef.current(); cancelSpeech(); }; }, []);

  function splitPages(text: string, wordsPerPage: number): string[] {
    const paragraphs = text.split('\n\n');
    const result: string[] = [];
    let current = '';
    for (const p of paragraphs) {
      if (current && (current + ' ' + p).split(/\s+/).length > wordsPerPage) {
        result.push(current.trim());
        current = p;
      } else {
        current = current ? current + '\n\n' + p : p;
      }
    }
    if (current.trim()) result.push(current.trim());
    return result;
  }

  function readAloud() {
    if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; }
    cancelSpeech();
    if (reading) { setReading(false); return; }
    const text = pages[page];
    if (!text) return;
    setReading(true);
    // Chunk into sentences so mobile browsers don't cut off speech
    cancelRef.current = speakLongText(text, () => { setReading(false); cancelRef.current = null; });
  }

  function openStory(story: Story) {
    if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; }
    cancelSpeech();
    setReading(false);
    setSelected(story);
    setPage(0);
  }

  function goBack() {
    if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; }
    cancelSpeech();
    setReading(false);
    if (selected) { setSelected(null); setPage(0); }
    else onBack();
  }

  // ------- RENDER --------
  if (selected) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 50%, #FFDAB9 100%)',
        padding: '16px', fontFamily: "'Nunito', 'Quicksand', sans-serif"
      }}>
        {pet && <div style={{ position: 'fixed', bottom: 70, right: 12, fontSize: 36, zIndex: 50, opacity: .85 }}>{pet}</div>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <button onClick={goBack} style={backBtn}>⬅️ Back</button>
          <h2 style={{ margin: 0, fontSize: 20, color: '#5D4037', flex: 1, textAlign: 'center' }}>{selected.title}</h2>
        </div>

        {/* Picture banner */}
        <div style={{
          textAlign: 'center', fontSize: 56, padding: 16, marginBottom: 12,
          background: 'white', borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,.1)'
        }}>{selected.picture}</div>

        {/* Story page */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 22, minHeight: 250,
          boxShadow: '0 2px 8px rgba(0,0,0,.1)', marginBottom: 12,
          fontSize: 19, lineHeight: 1.85, color: '#3E2723', whiteSpace: 'pre-line',
          fontFamily: "'Nunito', 'Quicksand', sans-serif", fontWeight: 600,
          letterSpacing: '0.02em'
        }}>
          {pages[page]}
        </div>

        {/* Page nav */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => { setPage(p => Math.max(0, p - 1)); if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; } cancelSpeech(); setReading(false); }}
            disabled={page === 0} style={{ ...pageBtn, opacity: page === 0 ? .4 : 1 }}>⬅️ Prev</button>
          <span style={{ fontSize: 16, color: '#5D4037', alignSelf: 'center' }}>
            Page {page + 1} of {pages.length}
          </span>
          <button onClick={() => { setPage(p => Math.min(pages.length - 1, p + 1)); if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; } cancelSpeech(); setReading(false); }}
            disabled={page === pages.length - 1} style={{ ...pageBtn, opacity: page === pages.length - 1 ? .4 : 1 }}>Next ➡️</button>
        </div>

        {/* Read aloud */}
        <button onClick={readAloud} style={{
          ...pageBtn, width: '100%', fontSize: 20, padding: 14,
          background: reading ? '#EF5350' : '#4CAF50', color: 'white'
        }}>
          {reading ? '⏹ Stop Reading' : '🔊 Read Aloud'}
        </button>
      </div>
    );
  }

  // ------- LIBRARY VIEW --------
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #FFF8E7 0%, #FFE4B5 50%, #FFDAB9 100%)',
      padding: '16px', fontFamily: "'Nunito', 'Quicksand', sans-serif"
    }}>
      {pet && <div style={{ position: 'fixed', bottom: 70, right: 12, fontSize: 36, zIndex: 50, opacity: .85 }}>{pet}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button onClick={goBack} style={backBtn}>⬅️ Back</button>
        <h2 style={{ margin: 0, fontSize: 22, color: '#5D4037', flex: 1, textAlign: 'center' }}>📚 Story Library</h2>
      </div>

      {/* Genre tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
        {GENRES.map(g => (
          <button key={g.key} onClick={() => setGenre(g.key)} style={{
            border: 'none', borderRadius: 22, padding: '12px 18px', fontSize: 15,
            background: genre === g.key ? '#FF8F00' : 'white',
            color: genre === g.key ? 'white' : '#5D4037',
            fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,.1)',
            fontFamily: 'inherit'
          }}>
            {g.icon} {g.label}
          </button>
        ))}
      </div>

      {/* Story cards */}
      <div style={{ display: 'grid', gap: 12 }}>
        {filtered.map(story => (
          <button key={story.id} onClick={() => openStory(story)} style={{
            border: 'none', borderRadius: 16, padding: 16, textAlign: 'left',
            background: 'white', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,.1)',
            display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit'
          }}>
            <span style={{ fontSize: 42, flexShrink: 0 }}>{story.picture}</span>
            <div>
              <div style={{ fontSize: 17, fontWeight: 'bold', color: '#3E2723', marginBottom: 4 }}>{story.title}</div>
              <div style={{ fontSize: 15, color: '#8D6E63' }}>{story.genreIcon} {story.genre.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const backBtn: React.CSSProperties = {
  border: 'none', borderRadius: 20, padding: '12px 20px', fontSize: 16,
  background: 'linear-gradient(135deg, #FF8F00, #FFB74D)', color: 'white', fontWeight: 'bold', cursor: 'pointer',
  fontFamily: "'Nunito', 'Quicksand', sans-serif"
};
const pageBtn: React.CSSProperties = {
  border: 'none', borderRadius: 16, padding: '12px 22px', fontSize: 17,
  background: '#FF8F00', color: 'white', fontWeight: 'bold', cursor: 'pointer',
  fontFamily: "'Nunito', 'Quicksand', sans-serif"
};
