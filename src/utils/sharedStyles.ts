import React from 'react'

/** Light-theme glass back button (used by most components) */
export const backBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.4)',
  borderRadius: 16,
  padding: '10px 18px',
  cursor: 'pointer',
  fontSize: 14,
  fontWeight: 700,
  color: '#2d3436',
}

/** Dark-theme glass back button (CatchStars, FruitNinja, MusicKeyboard, Calming) */
export const backBtnDark: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 16,
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 700,
  color: '#B0BEC5',
  cursor: 'pointer',
}

/** Glass morphism panel / card */
export const glassPanel: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.4)',
  borderRadius: 24,
  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
}

/** Pet overlay (bottom-right floating emoji) */
export const petOverlay: React.CSSProperties = {
  position: 'fixed',
  bottom: 70,
  right: 12,
  fontSize: 36,
  zIndex: 50,
  opacity: 0.85,
}
