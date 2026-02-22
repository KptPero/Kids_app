import React, { useState, useRef, useEffect, useCallback } from 'react';
import { logError, ErrorCode } from '../utils/errorLogger';

interface Props { onBack: () => void; pet?: string }

type Tool = 'brush' | 'eraser' | 'fill';
type DrawMode = 'menu' | 'free' | 'coloring';

const COLORS = ['#FF0000','#FF6600','#FFCC00','#33CC33','#0099FF','#6633CC','#FF69B4','#8B4513','#000000','#FFFFFF'];
const BRUSH_SIZES = [4, 8, 14, 22];

// Helper: draw a rounded rect
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.stroke()
}

// Cute coloring book drawings
const DRAWINGS: { name: string; icon: string; category: string; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }[] = [
  {
    name: 'Cat',
    icon: '🐱',
    category: 'Animals',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2 + 10
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      // Body (oval)
      ctx.beginPath(); ctx.ellipse(cx, cy + 30, 65, 55, 0, 0, Math.PI * 2); ctx.stroke()
      // Head (circle)
      ctx.beginPath(); ctx.arc(cx, cy - 45, 48, 0, Math.PI * 2); ctx.stroke()
      // Left ear
      ctx.beginPath(); ctx.moveTo(cx - 38, cy - 78); ctx.lineTo(cx - 55, cy - 120); ctx.lineTo(cx - 18, cy - 90); ctx.stroke()
      // Inner left ear
      ctx.beginPath(); ctx.moveTo(cx - 35, cy - 83); ctx.lineTo(cx - 48, cy - 110); ctx.lineTo(cx - 22, cy - 88); ctx.stroke()
      // Right ear
      ctx.beginPath(); ctx.moveTo(cx + 38, cy - 78); ctx.lineTo(cx + 55, cy - 120); ctx.lineTo(cx + 18, cy - 90); ctx.stroke()
      // Inner right ear
      ctx.beginPath(); ctx.moveTo(cx + 35, cy - 83); ctx.lineTo(cx + 48, cy - 110); ctx.lineTo(cx + 22, cy - 88); ctx.stroke()
      // Eyes
      ctx.beginPath(); ctx.ellipse(cx - 18, cy - 50, 9, 11, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(cx + 18, cy - 50, 9, 11, 0, 0, Math.PI * 2); ctx.stroke()
      // Pupils
      ctx.beginPath(); ctx.ellipse(cx - 18, cy - 48, 4, 7, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.ellipse(cx + 18, cy - 48, 4, 7, 0, 0, Math.PI * 2); ctx.fill()
      // Nose (triangle)
      ctx.beginPath(); ctx.moveTo(cx, cy - 35); ctx.lineTo(cx - 5, cy - 28); ctx.lineTo(cx + 5, cy - 28); ctx.closePath(); ctx.stroke()
      // Mouth
      ctx.beginPath(); ctx.moveTo(cx, cy - 28); ctx.quadraticCurveTo(cx - 12, cy - 18, cx - 18, cy - 25); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy - 28); ctx.quadraticCurveTo(cx + 12, cy - 18, cx + 18, cy - 25); ctx.stroke()
      // Whiskers
      ctx.beginPath(); ctx.moveTo(cx - 25, cy - 35); ctx.lineTo(cx - 60, cy - 42); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 25, cy - 30); ctx.lineTo(cx - 58, cy - 28); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 25, cy - 25); ctx.lineTo(cx - 56, cy - 16); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 25, cy - 35); ctx.lineTo(cx + 60, cy - 42); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 25, cy - 30); ctx.lineTo(cx + 58, cy - 28); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 25, cy - 25); ctx.lineTo(cx + 56, cy - 16); ctx.stroke()
      // Front paws
      ctx.beginPath(); ctx.ellipse(cx - 30, cy + 80, 16, 10, 0.2, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(cx + 30, cy + 80, 16, 10, -0.2, 0, Math.PI * 2); ctx.stroke()
      // Paw lines
      ctx.beginPath(); ctx.moveTo(cx - 38, cy + 80); ctx.lineTo(cx - 34, cy + 74); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 30, cy + 82); ctx.lineTo(cx - 30, cy + 74); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 38, cy + 80); ctx.lineTo(cx + 34, cy + 74); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 30, cy + 82); ctx.lineTo(cx + 30, cy + 74); ctx.stroke()
      // Tail
      ctx.beginPath(); ctx.moveTo(cx + 55, cy + 30)
      ctx.bezierCurveTo(cx + 95, cy + 10, cx + 100, cy - 40, cx + 75, cy - 50); ctx.stroke()
      // Belly stripe (cute detail)
      ctx.beginPath(); ctx.ellipse(cx, cy + 40, 28, 35, 0, 0, Math.PI * 2); ctx.stroke()
    }
  },
  {
    name: 'Butterfly',
    icon: '🦋',
    category: 'Nature',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      // Body
      ctx.beginPath(); ctx.ellipse(cx, cy, 8, 50, 0, 0, Math.PI * 2); ctx.stroke()
      // Head
      ctx.beginPath(); ctx.arc(cx, cy - 55, 12, 0, Math.PI * 2); ctx.stroke()
      // Eyes
      ctx.beginPath(); ctx.arc(cx - 5, cy - 57, 3, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + 5, cy - 57, 3, 0, Math.PI * 2); ctx.fill()
      // Smile
      ctx.beginPath(); ctx.arc(cx, cy - 50, 5, 0.2, Math.PI - 0.2); ctx.stroke()
      // Antennae
      ctx.beginPath(); ctx.moveTo(cx - 5, cy - 65); ctx.quadraticCurveTo(cx - 25, cy - 100, cx - 35, cy - 95); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 35, cy - 95, 4, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 5, cy - 65); ctx.quadraticCurveTo(cx + 25, cy - 100, cx + 35, cy - 95); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 35, cy - 95, 4, 0, Math.PI * 2); ctx.stroke()
      // Upper left wing
      ctx.beginPath(); ctx.moveTo(cx - 8, cy - 30)
      ctx.bezierCurveTo(cx - 40, cy - 100, cx - 120, cy - 80, cx - 95, cy - 20)
      ctx.bezierCurveTo(cx - 75, cy + 20, cx - 20, cy - 5, cx - 8, cy - 10); ctx.stroke()
      // Upper right wing
      ctx.beginPath(); ctx.moveTo(cx + 8, cy - 30)
      ctx.bezierCurveTo(cx + 40, cy - 100, cx + 120, cy - 80, cx + 95, cy - 20)
      ctx.bezierCurveTo(cx + 75, cy + 20, cx + 20, cy - 5, cx + 8, cy - 10); ctx.stroke()
      // Lower left wing
      ctx.beginPath(); ctx.moveTo(cx - 8, cy + 5)
      ctx.bezierCurveTo(cx - 50, cy + 10, cx - 85, cy + 40, cx - 70, cy + 70)
      ctx.bezierCurveTo(cx - 50, cy + 95, cx - 15, cy + 60, cx - 6, cy + 30); ctx.stroke()
      // Lower right wing
      ctx.beginPath(); ctx.moveTo(cx + 8, cy + 5)
      ctx.bezierCurveTo(cx + 50, cy + 10, cx + 85, cy + 40, cx + 70, cy + 70)
      ctx.bezierCurveTo(cx + 50, cy + 95, cx + 15, cy + 60, cx + 6, cy + 30); ctx.stroke()
      // Wing decorations — circles
      ctx.beginPath(); ctx.arc(cx - 60, cy - 40, 18, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 60, cy - 40, 18, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 45, cy + 45, 12, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 45, cy + 45, 12, 0, Math.PI * 2); ctx.stroke()
      // Small dots on upper wings
      ctx.beginPath(); ctx.arc(cx - 75, cy - 25, 6, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 75, cy - 25, 6, 0, Math.PI * 2); ctx.stroke()
    }
  },
  {
    name: 'Fish',
    icon: '🐟',
    category: 'Animals',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      // Body
      ctx.beginPath()
      ctx.moveTo(cx + 80, cy)
      ctx.bezierCurveTo(cx + 80, cy - 55, cx - 20, cy - 70, cx - 70, cy - 30)
      ctx.bezierCurveTo(cx - 90, cy - 15, cx - 90, cy + 15, cx - 70, cy + 30)
      ctx.bezierCurveTo(cx - 20, cy + 70, cx + 80, cy + 55, cx + 80, cy)
      ctx.stroke()
      // Eye
      ctx.beginPath(); ctx.arc(cx + 35, cy - 15, 12, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 38, cy - 16, 5, 0, Math.PI * 2); ctx.fill()
      // Eye shine
      ctx.beginPath(); ctx.arc(cx + 40, cy - 20, 3, 0, Math.PI * 2); ctx.stroke()
      // Mouth
      ctx.beginPath(); ctx.moveTo(cx + 75, cy + 5); ctx.quadraticCurveTo(cx + 60, cy + 12, cx + 50, cy + 8); ctx.stroke()
      // Gill line
      ctx.beginPath()
      ctx.moveTo(cx + 20, cy - 30)
      ctx.quadraticCurveTo(cx + 12, cy, cx + 20, cy + 30); ctx.stroke()
      // Tail fin
      ctx.beginPath()
      ctx.moveTo(cx - 70, cy - 15); ctx.lineTo(cx - 110, cy - 50)
      ctx.quadraticCurveTo(cx - 100, cy, cx - 110, cy + 50)
      ctx.lineTo(cx - 70, cy + 15); ctx.stroke()
      // Tail fin middle line
      ctx.beginPath(); ctx.moveTo(cx - 70, cy); ctx.lineTo(cx - 105, cy); ctx.stroke()
      // Top fin
      ctx.beginPath()
      ctx.moveTo(cx + 10, cy - 50)
      ctx.quadraticCurveTo(cx - 15, cy - 95, cx - 35, cy - 55)
      ctx.stroke()
      // Fin lines
      ctx.beginPath(); ctx.moveTo(cx + 5, cy - 55); ctx.lineTo(cx - 10, cy - 75); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 5, cy - 55); ctx.lineTo(cx - 20, cy - 72); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 15, cy - 52); ctx.lineTo(cx - 28, cy - 68); ctx.stroke()
      // Bottom fin
      ctx.beginPath()
      ctx.moveTo(cx, cy + 45)
      ctx.quadraticCurveTo(cx - 10, cy + 70, cx - 25, cy + 50); ctx.stroke()
      // Scale pattern
      for (let r = 0; r < 3; r++) {
        for (let i = -2; i <= 2; i++) {
          const sx = cx - 15 + r * 22 + (i % 2) * 11
          const sy = cy - 5 + i * 16
          ctx.beginPath(); ctx.arc(sx, sy, 9, 0.3, Math.PI - 0.3); ctx.stroke()
        }
      }
      // Bubbles
      ctx.beginPath(); ctx.arc(cx + 95, cy - 25, 5, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 105, cy - 40, 4, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 100, cy - 55, 3, 0, Math.PI * 2); ctx.stroke()
    }
  },
  {
    name: 'Flower',
    icon: '🌸',
    category: 'Nature',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2 - 10
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      // Stem
      ctx.beginPath(); ctx.moveTo(cx, cy + 30)
      ctx.bezierCurveTo(cx - 5, cy + 70, cx + 8, cy + 100, cx - 3, cy + 140); ctx.stroke()
      // Left leaf
      ctx.beginPath(); ctx.moveTo(cx - 2, cy + 80)
      ctx.bezierCurveTo(cx - 40, cy + 60, cx - 55, cy + 85, cx - 30, cy + 100)
      ctx.bezierCurveTo(cx - 15, cy + 110, cx - 3, cy + 95, cx - 2, cy + 80); ctx.stroke()
      // Left leaf vein
      ctx.beginPath(); ctx.moveTo(cx - 2, cy + 82); ctx.lineTo(cx - 30, cy + 82); ctx.stroke()
      // Right leaf
      ctx.beginPath(); ctx.moveTo(cx + 2, cy + 100)
      ctx.bezierCurveTo(cx + 40, cy + 85, cx + 55, cy + 110, cx + 30, cy + 120)
      ctx.bezierCurveTo(cx + 15, cy + 128, cx + 3, cy + 115, cx + 2, cy + 100); ctx.stroke()
      // Right leaf vein
      ctx.beginPath(); ctx.moveTo(cx + 2, cy + 104); ctx.lineTo(cx + 30, cy + 104); ctx.stroke()
      // Petals (6 big ones)
      const petalR = 38
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6 - Math.PI / 2
        const px = cx + Math.cos(angle) * 42
        const py = cy + Math.sin(angle) * 42
        ctx.beginPath(); ctx.ellipse(px, py, petalR, 22, angle, 0, Math.PI * 2); ctx.stroke()
      }
      // Center
      ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.stroke()
      // Center details (little dots)
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI * 2) / 6
        ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 10, cy + Math.sin(a) * 10, 3, 0, Math.PI * 2); ctx.stroke()
      }
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.stroke()
    }
  },
  {
    name: 'Car',
    icon: '🚗',
    category: 'Vehicles',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2 + 10
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      // Car body
      ctx.beginPath()
      ctx.moveTo(cx - 100, cy + 10)
      ctx.lineTo(cx - 100, cy - 10)
      ctx.quadraticCurveTo(cx - 95, cy - 15, cx - 85, cy - 15)
      ctx.lineTo(cx - 55, cy - 15)
      ctx.lineTo(cx - 40, cy - 60)
      ctx.quadraticCurveTo(cx - 35, cy - 65, cx - 30, cy - 65)
      ctx.lineTo(cx + 40, cy - 65)
      ctx.quadraticCurveTo(cx + 50, cy - 65, cx + 55, cy - 55)
      ctx.lineTo(cx + 80, cy - 15)
      ctx.lineTo(cx + 100, cy - 15)
      ctx.quadraticCurveTo(cx + 110, cy - 15, cx + 110, cy - 5)
      ctx.lineTo(cx + 110, cy + 10)
      ctx.quadraticCurveTo(cx + 110, cy + 20, cx + 100, cy + 20)
      ctx.lineTo(cx - 90, cy + 20)
      ctx.quadraticCurveTo(cx - 100, cy + 20, cx - 100, cy + 10)
      ctx.stroke()
      // Windshield
      ctx.beginPath()
      ctx.moveTo(cx - 35, cy - 15); ctx.lineTo(cx - 20, cy - 55)
      ctx.lineTo(cx + 5, cy - 55); ctx.lineTo(cx + 5, cy - 15); ctx.stroke()
      // Rear window
      ctx.beginPath()
      ctx.moveTo(cx + 15, cy - 15); ctx.lineTo(cx + 15, cy - 55)
      ctx.lineTo(cx + 40, cy - 55); ctx.lineTo(cx + 55, cy - 25)
      ctx.lineTo(cx + 55, cy - 15); ctx.stroke()
      // Door line
      ctx.beginPath(); ctx.moveTo(cx + 10, cy - 15); ctx.lineTo(cx + 10, cy + 15); ctx.stroke()
      // Door handles
      ctx.beginPath(); ctx.moveTo(cx - 10, cy - 2); ctx.lineTo(cx + 0, cy - 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 20, cy - 2); ctx.lineTo(cx + 30, cy - 2); ctx.stroke()
      // Headlight
      ctx.beginPath(); ctx.ellipse(cx + 100, cy - 5, 8, 6, 0, 0, Math.PI * 2); ctx.stroke()
      // Taillight
      ctx.beginPath(); ctx.ellipse(cx - 95, cy - 5, 5, 6, 0, 0, Math.PI * 2); ctx.stroke()
      // Bumper details
      roundRect(ctx, cx + 85, cy + 8, 20, 6, 3)
      roundRect(ctx, cx - 105, cy + 8, 15, 6, 3)
      // Wheels
      ctx.beginPath(); ctx.arc(cx - 55, cy + 25, 22, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 55, cy + 25, 12, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 55, cy + 25, 4, 0, Math.PI * 2); ctx.fill()
      // Wheel spokes
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        ctx.beginPath(); ctx.moveTo(cx - 55 + Math.cos(a) * 5, cy + 25 + Math.sin(a) * 5)
        ctx.lineTo(cx - 55 + Math.cos(a) * 12, cy + 25 + Math.sin(a) * 12); ctx.stroke()
      }
      ctx.beginPath(); ctx.arc(cx + 60, cy + 25, 22, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 60, cy + 25, 12, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 60, cy + 25, 4, 0, Math.PI * 2); ctx.fill()
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        ctx.beginPath(); ctx.moveTo(cx + 60 + Math.cos(a) * 5, cy + 25 + Math.sin(a) * 5)
        ctx.lineTo(cx + 60 + Math.cos(a) * 12, cy + 25 + Math.sin(a) * 12); ctx.stroke()
      }
      // Road line
      ctx.setLineDash([8, 8])
      ctx.beginPath(); ctx.moveTo(cx - 130, cy + 50); ctx.lineTo(cx + 140, cy + 50); ctx.stroke()
      ctx.setLineDash([])
    }
  },
  {
    name: 'Dinosaur',
    icon: '🦕',
    category: 'Animals',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2 + 20
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      // Body
      ctx.beginPath()
      ctx.moveTo(cx - 20, cy - 60)
      ctx.bezierCurveTo(cx + 50, cy - 80, cx + 90, cy - 40, cx + 80, cy + 10)
      ctx.bezierCurveTo(cx + 75, cy + 40, cx + 40, cy + 50, cx - 10, cy + 45)
      ctx.bezierCurveTo(cx - 50, cy + 40, cx - 70, cy + 10, cx - 60, cy - 20)
      ctx.bezierCurveTo(cx - 55, cy - 45, cx - 35, cy - 58, cx - 20, cy - 60)
      ctx.stroke()
      // Neck
      ctx.beginPath()
      ctx.moveTo(cx - 40, cy - 30)
      ctx.bezierCurveTo(cx - 70, cy - 60, cx - 100, cy - 100, cx - 95, cy - 120)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cx - 55, cy - 20)
      ctx.bezierCurveTo(cx - 80, cy - 50, cx - 110, cy - 90, cx - 110, cy - 115)
      ctx.stroke()
      // Head
      ctx.beginPath()
      ctx.moveTo(cx - 95, cy - 120)
      ctx.bezierCurveTo(cx - 85, cy - 145, cx - 115, cy - 150, cx - 125, cy - 130)
      ctx.bezierCurveTo(cx - 130, cy - 118, cx - 115, cy - 110, cx - 110, cy - 115)
      ctx.stroke()
      // Eye
      ctx.beginPath(); ctx.arc(cx - 105, cy - 132, 5, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 104, cy - 131, 2, 0, Math.PI * 2); ctx.fill()
      // Smile
      ctx.beginPath(); ctx.arc(cx - 118, cy - 125, 5, 0, Math.PI * 0.7); ctx.stroke()
      // Belly
      ctx.beginPath()
      ctx.moveTo(cx - 30, cy + 40)
      ctx.bezierCurveTo(cx - 10, cy + 55, cx + 30, cy + 55, cx + 50, cy + 40)
      ctx.stroke()
      // Spikes along back
      const spikes = [[cx + 15, cy - 70], [cx + 35, cy - 65], [cx + 55, cy - 55], [cx + 70, cy - 35], [cx + 75, cy - 10]]
      for (const [sx, sy] of spikes) {
        ctx.beginPath()
        ctx.moveTo(sx - 10, sy + 8)
        ctx.lineTo(sx, sy - 12)
        ctx.lineTo(sx + 10, sy + 8)
        ctx.stroke()
      }
      // Tail
      ctx.beginPath()
      ctx.moveTo(cx + 75, cy + 20)
      ctx.bezierCurveTo(cx + 100, cy + 30, cx + 120, cy + 10, cx + 130, cy - 10)
      ctx.bezierCurveTo(cx + 135, cy - 20, cx + 130, cy - 30, cx + 120, cy - 25)
      ctx.stroke()
      // Legs
      // Front left
      ctx.beginPath(); ctx.moveTo(cx - 25, cy + 40)
      ctx.lineTo(cx - 30, cy + 75); ctx.lineTo(cx - 40, cy + 80)
      ctx.lineTo(cx - 20, cy + 80); ctx.lineTo(cx - 15, cy + 75)
      ctx.lineTo(cx - 15, cy + 42); ctx.stroke()
      // Front right
      ctx.beginPath(); ctx.moveTo(cx - 5, cy + 43)
      ctx.lineTo(cx - 8, cy + 75); ctx.lineTo(cx - 18, cy + 80)
      ctx.lineTo(cx + 2, cy + 80); ctx.lineTo(cx + 5, cy + 75)
      ctx.lineTo(cx + 5, cy + 43); ctx.stroke()
      // Back left
      ctx.beginPath(); ctx.moveTo(cx + 35, cy + 43)
      ctx.lineTo(cx + 32, cy + 75); ctx.lineTo(cx + 22, cy + 80)
      ctx.lineTo(cx + 42, cy + 80); ctx.lineTo(cx + 45, cy + 75)
      ctx.lineTo(cx + 45, cy + 43); ctx.stroke()
      // Back right
      ctx.beginPath(); ctx.moveTo(cx + 55, cy + 38)
      ctx.lineTo(cx + 54, cy + 72); ctx.lineTo(cx + 44, cy + 78)
      ctx.lineTo(cx + 64, cy + 78); ctx.lineTo(cx + 65, cy + 72)
      ctx.lineTo(cx + 62, cy + 38); ctx.stroke()
      // Ground
      ctx.setLineDash([4, 6])
      ctx.beginPath(); ctx.moveTo(cx - 60, cy + 82); ctx.lineTo(cx + 90, cy + 82); ctx.stroke()
      ctx.setLineDash([])
      // Grass tufts
      ctx.beginPath(); ctx.moveTo(cx - 50, cy + 82); ctx.lineTo(cx - 55, cy + 70); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 47, cy + 82); ctx.lineTo(cx - 45, cy + 72); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 75, cy + 82); ctx.lineTo(cx + 72, cy + 70); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 80, cy + 82); ctx.lineTo(cx + 82, cy + 72); ctx.stroke()
    }
  },
  {
    name: 'Rocket',
    icon: '🚀',
    category: 'Vehicles',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      // Body
      ctx.beginPath()
      ctx.moveTo(cx, cy - 110)
      ctx.bezierCurveTo(cx + 10, cy - 100, cx + 30, cy - 60, cx + 30, cy + 20)
      ctx.lineTo(cx + 30, cy + 55)
      ctx.lineTo(cx - 30, cy + 55)
      ctx.lineTo(cx - 30, cy + 20)
      ctx.bezierCurveTo(cx - 30, cy - 60, cx - 10, cy - 100, cx, cy - 110)
      ctx.stroke()
      // Nose cone stripe
      ctx.beginPath(); ctx.moveTo(cx - 22, cy - 50); ctx.lineTo(cx + 22, cy - 50); ctx.stroke()
      // Window (porthole)
      ctx.beginPath(); ctx.arc(cx, cy - 20, 18, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx, cy - 20, 12, 0, Math.PI * 2); ctx.stroke()
      // Window shine
      ctx.beginPath(); ctx.arc(cx - 4, cy - 24, 4, 0, Math.PI * 2); ctx.stroke()
      // Body stripes
      ctx.beginPath(); ctx.moveTo(cx - 30, cy + 15); ctx.lineTo(cx + 30, cy + 15); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 30, cy + 30); ctx.lineTo(cx + 30, cy + 30); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 30, cy + 45); ctx.lineTo(cx + 30, cy + 45); ctx.stroke()
      // Left fin
      ctx.beginPath()
      ctx.moveTo(cx - 30, cy + 20)
      ctx.lineTo(cx - 60, cy + 65)
      ctx.lineTo(cx - 55, cy + 70)
      ctx.lineTo(cx - 30, cy + 55)
      ctx.stroke()
      // Right fin
      ctx.beginPath()
      ctx.moveTo(cx + 30, cy + 20)
      ctx.lineTo(cx + 60, cy + 65)
      ctx.lineTo(cx + 55, cy + 70)
      ctx.lineTo(cx + 30, cy + 55)
      ctx.stroke()
      // Bottom nozzle
      ctx.beginPath()
      ctx.moveTo(cx - 20, cy + 55)
      ctx.lineTo(cx - 15, cy + 70)
      ctx.lineTo(cx + 15, cy + 70)
      ctx.lineTo(cx + 20, cy + 55)
      ctx.stroke()
      // Flames
      ctx.beginPath()
      ctx.moveTo(cx - 12, cy + 70)
      ctx.bezierCurveTo(cx - 15, cy + 90, cx - 5, cy + 95, cx, cy + 110)
      ctx.bezierCurveTo(cx + 5, cy + 95, cx + 15, cy + 90, cx + 12, cy + 70)
      ctx.stroke()
      // Inner flame
      ctx.beginPath()
      ctx.moveTo(cx - 6, cy + 70)
      ctx.bezierCurveTo(cx - 8, cy + 82, cx - 2, cy + 88, cx, cy + 95)
      ctx.bezierCurveTo(cx + 2, cy + 88, cx + 8, cy + 82, cx + 6, cy + 70)
      ctx.stroke()
      // Stars around
      const drawStar = (sx: number, sy: number, size: number) => {
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
          const a = (i * 4 * Math.PI) / 5 - Math.PI / 2
          const method = i === 0 ? 'moveTo' : 'lineTo'
          ctx[method](sx + Math.cos(a) * size, sy + Math.sin(a) * size)
        }
        ctx.closePath(); ctx.stroke()
      }
      drawStar(cx - 70, cy - 70, 8)
      drawStar(cx + 65, cy - 50, 6)
      drawStar(cx - 60, cy + 30, 5)
      drawStar(cx + 70, cy + 10, 7)
      // Small dots (distant stars)
      ctx.beginPath(); ctx.arc(cx - 80, cy - 20, 2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + 80, cy - 80, 2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx + 55, cy + 50, 2, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(cx - 55, cy + 65, 2, 0, Math.PI * 2); ctx.fill()
    }
  },
  {
    name: 'House',
    icon: '🏠',
    category: 'Places',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2 + 15
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      // Main house body
      roundRect(ctx, cx - 80, cy - 30, 160, 100, 4)
      // Roof
      ctx.beginPath()
      ctx.moveTo(cx - 95, cy - 30)
      ctx.lineTo(cx, cy - 100)
      ctx.lineTo(cx + 95, cy - 30)
      ctx.closePath(); ctx.stroke()
      // Roof tiles
      ctx.beginPath(); ctx.moveTo(cx - 70, cy - 50); ctx.lineTo(cx, cy - 80); ctx.lineTo(cx + 70, cy - 50); ctx.stroke()
      // Door
      roundRect(ctx, cx - 18, cy + 15, 36, 55, 4)
      // Door handle
      ctx.beginPath(); ctx.arc(cx + 10, cy + 44, 3, 0, Math.PI * 2); ctx.stroke()
      // Door panel lines
      ctx.beginPath(); ctx.moveTo(cx - 12, cy + 20); ctx.lineTo(cx - 12, cy + 38); ctx.lineTo(cx - 3, cy + 38); ctx.lineTo(cx - 3, cy + 20); ctx.closePath(); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 12, cy + 42); ctx.lineTo(cx - 12, cy + 64); ctx.lineTo(cx - 3, cy + 64); ctx.lineTo(cx - 3, cy + 42); ctx.closePath(); ctx.stroke()
      // Left window
      ctx.beginPath(); ctx.arc(cx - 48, cy + 5, 18, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 48, cy - 13); ctx.lineTo(cx - 48, cy + 23); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 66, cy + 5); ctx.lineTo(cx - 30, cy + 5); ctx.stroke()
      // Right window
      roundRect(ctx, cx + 30, cy - 12, 35, 35, 3)
      ctx.beginPath(); ctx.moveTo(cx + 47, cy - 12); ctx.lineTo(cx + 47, cy + 23); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 30, cy + 5); ctx.lineTo(cx + 65, cy + 5); ctx.stroke()
      // Chimney
      ctx.beginPath()
      ctx.moveTo(cx + 40, cy - 70); ctx.lineTo(cx + 40, cy - 100)
      ctx.lineTo(cx + 60, cy - 100); ctx.lineTo(cx + 60, cy - 55); ctx.stroke()
      // Chimney top
      roundRect(ctx, cx + 36, cy - 105, 28, 8, 2)
      // Smoke puffs
      ctx.beginPath(); ctx.arc(cx + 55, cy - 115, 6, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 60, cy - 128, 8, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 55, cy - 142, 5, 0, Math.PI * 2); ctx.stroke()
      // Path/walkway
      ctx.beginPath()
      ctx.moveTo(cx - 15, cy + 70); ctx.lineTo(cx - 25, cy + 110)
      ctx.lineTo(cx + 25, cy + 110); ctx.lineTo(cx + 15, cy + 70); ctx.stroke()
      // Path lines
      ctx.beginPath(); ctx.moveTo(cx - 18, cy + 80); ctx.lineTo(cx + 18, cy + 80); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 21, cy + 90); ctx.lineTo(cx + 21, cy + 90); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - 23, cy + 100); ctx.lineTo(cx + 23, cy + 100); ctx.stroke()
      // Flower bushes
      ctx.beginPath(); ctx.arc(cx - 90, cy + 60, 12, Math.PI, 0); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 105, cy + 60, 10, Math.PI, 0); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 78, cy + 60, 10, Math.PI, 0); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 90, cy + 60, 12, Math.PI, 0); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 78, cy + 60, 10, Math.PI, 0); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 105, cy + 60, 10, Math.PI, 0); ctx.stroke()
      // Sun
      ctx.beginPath(); ctx.arc(cx - 80, cy - 90, 15, 0, Math.PI * 2); ctx.stroke()
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(cx - 80 + Math.cos(a) * 19, cy - 90 + Math.sin(a) * 19)
        ctx.lineTo(cx - 80 + Math.cos(a) * 27, cy - 90 + Math.sin(a) * 27)
        ctx.stroke()
      }
      // Ground line
      ctx.beginPath(); ctx.moveTo(cx - 130, cy + 70); ctx.lineTo(cx + 130, cy + 70); ctx.stroke()
    }
  },
  {
    name: 'Rainbow',
    icon: '🌈',
    category: 'Nature',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2 + 40
      ctx.strokeStyle = '#333'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
      // Rainbow arcs (7 bands)
      for (let i = 0; i < 7; i++) {
        const r = 130 - i * 14
        ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 0); ctx.stroke()
      }
      // Clouds at base
      // Left cloud
      ctx.beginPath(); ctx.arc(cx - 110, cy, 20, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 130, cy + 5, 18, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 95, cy + 5, 16, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 115, cy + 18, 15, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx - 100, cy + 18, 14, 0, Math.PI * 2); ctx.stroke()
      // Right cloud
      ctx.beginPath(); ctx.arc(cx + 110, cy, 20, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 130, cy + 5, 18, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 95, cy + 5, 16, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 115, cy + 18, 15, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(cx + 100, cy + 18, 14, 0, Math.PI * 2); ctx.stroke()
      // Sun peeking above
      ctx.beginPath(); ctx.arc(cx, cy - 130, 25, 0.3, Math.PI - 0.3); ctx.stroke()
      for (let i = 0; i < 5; i++) {
        const a = Math.PI * 0.2 + (i / 4) * Math.PI * 0.6
        ctx.beginPath()
        ctx.moveTo(cx + Math.cos(a) * 30, cy - 130 + Math.sin(a) * 30 * -1)
        ctx.lineTo(cx + Math.cos(a) * 40, cy - 130 + Math.sin(a) * 40 * -1)
        ctx.stroke()
      }
      // Ground with flowers
      ctx.beginPath(); ctx.moveTo(cx - 140, cy + 35); ctx.lineTo(cx + 140, cy + 35); ctx.stroke()
      // Simple flowers on ground
      const drawTinyFlower = (fx: number, fy: number) => {
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy + 15); ctx.stroke()
        for (let p = 0; p < 5; p++) {
          const pa = (p / 5) * Math.PI * 2 - Math.PI / 2
          ctx.beginPath(); ctx.arc(fx + Math.cos(pa) * 6, fy + Math.sin(pa) * 6, 4, 0, Math.PI * 2); ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI * 2); ctx.stroke()
      }
      drawTinyFlower(cx - 60, cy + 20)
      drawTinyFlower(cx + 50, cy + 22)
      drawTinyFlower(cx, cy + 25)
    }
  },
];

export default function Drawing({ onBack, pet }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<DrawMode>('menu');
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(8);
  const [drawingIdx, setDrawingIdx] = useState(0);
  const drawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const outlineDataRef = useRef<ImageData | null>(null);
  const outlineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const initCanvas = useCallback((drawOutline: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (drawOutline) {
      DRAWINGS[drawingIdx].draw(ctx, rect.width, rect.height);
      outlineDataRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      // Pre-render outline canvas (only dark pixels) for fast redraw
      const oc = document.createElement('canvas');
      oc.width = canvas.width;
      oc.height = canvas.height;
      const octx = oc.getContext('2d')!;
      octx.putImageData(outlineDataRef.current, 0, 0);
      const oData = octx.getImageData(0, 0, oc.width, oc.height);
      const d = oData.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] >= 200 && d[i + 1] >= 200 && d[i + 2] >= 200) {
          d[i + 3] = 0; // Make white pixels transparent
        }
      }
      octx.putImageData(oData, 0, 0);
      outlineCanvasRef.current = oc;
    } else {
      outlineDataRef.current = null;
      outlineCanvasRef.current = null;
    }
  }, [drawingIdx]);

  useEffect(() => {
    if (mode === 'free' || mode === 'coloring') {
      setTimeout(() => initCanvas(mode === 'coloring'), 50);
    }
  }, [mode, initCanvas]);

  function getPos(e: React.TouchEvent | React.MouseEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function startDraw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    const pos = getPos(e);
    drawingRef.current = true;
    lastPosRef.current = pos;

    if (tool === 'fill') {
      floodFill(Math.round(pos.x), Math.round(pos.y), color);
      drawingRef.current = false;
      return;
    }

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault();
    if (!drawingRef.current || tool === 'fill') return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(255,255,255,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
    }

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    // For eraser in coloring mode: restore white background under erased area
    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.globalCompositeOperation = 'source-over';

      // Redraw outline if in coloring mode
      if (mode === 'coloring' && outlineDataRef.current) {
        // We need to keep the outline intact - draw it on top
        redrawOutline(ctx);
      }
    }

    lastPosRef.current = pos;
  }

  function endDraw() {
    drawingRef.current = false;
  }

  function redrawOutline(ctx: CanvasRenderingContext2D) {
    if (!outlineCanvasRef.current || !canvasRef.current) return;
    // Use pre-rendered outline canvas — no per-pixel iteration needed
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset to raw pixel coords
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(outlineCanvasRef.current, 0, 0);
    ctx.restore();
  }

  // Flood fill algorithm
  function floodFill(startX: number, startY: number, fillColor: string) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const w = canvas.width;
    const h = canvas.height;

    // Scale CSS-pixel coords to physical-pixel coords for ImageData access
    const dpr = window.devicePixelRatio || 1;
    const pxX = Math.round(startX * dpr);
    const pxY = Math.round(startY * dpr);
    if (pxX < 0 || pxX >= w || pxY < 0 || pxY >= h) return;

    // Parse fill color
    const temp = document.createElement('canvas');
    temp.width = 1; temp.height = 1;
    const tc = temp.getContext('2d')!;
    tc.fillStyle = fillColor;
    tc.fillRect(0, 0, 1, 1);
    const fc = tc.getImageData(0, 0, 1, 1).data;
    const fr = fc[0], fg = fc[1], fb = fc[2];

    const idx = (pxY * w + pxX) * 4;
    const sr = data[idx], sg = data[idx + 1], sb = data[idx + 2];

    // Don't fill if clicking on the same color or on a border
    if (sr === fr && sg === fg && sb === fb) return;
    // Don't fill dark border lines
    if (sr < 80 && sg < 80 && sb < 80) return;

    const tolerance = 40;
    function matches(i: number) {
      return Math.abs(data[i] - sr) < tolerance &&
             Math.abs(data[i + 1] - sg) < tolerance &&
             Math.abs(data[i + 2] - sb) < tolerance;
    }

    const stack: [number, number][] = [[pxX, pxY]];
    const visited = new Uint8Array(w * h);
    let filled = 0;
    const maxFill = w * h;

    while (stack.length > 0 && filled < maxFill) {
      const [x, y] = stack.pop()!;
      if (x < 0 || x >= w || y < 0 || y >= h) continue;
      const vi = y * w + x;
      if (visited[vi]) continue;
      visited[vi] = 1;

      const pi = vi * 4;
      if (!matches(pi)) continue;

      data[pi] = fr;
      data[pi + 1] = fg;
      data[pi + 2] = fb;
      data[pi + 3] = 255;
      filled++;

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
    // Redraw outlines on top
    if (mode === 'coloring' && outlineDataRef.current) {
      redrawOutline(ctx);
    }
    } catch (e) {
      logError(ErrorCode.CNV_FLOOD_FILL, 'Flood fill operation failed', { error: e, component: 'Drawing' });
    }
  }

  function clearCanvas() {
    initCanvas(mode === 'coloring');
  }

  // ===== MENU =====
  if (mode === 'menu') return (
    <div style={{
      minHeight: '100vh', padding: 16, fontFamily: "'Nunito', 'Quicksand', sans-serif",
      background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)'
    }}>
      {pet && <div style={{ position: 'fixed', bottom: 70, right: 12, fontSize: 36, zIndex: 50, opacity: .85 }}>{pet}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <button onClick={onBack} style={backBtn}>⬅️ Back</button>
        <h2 style={{ margin: 0, fontSize: 22, color: '#2E7D32', flex: 1, textAlign: 'center' }}>🎨 Drawing & Coloring</h2>
      </div>

      <button onClick={() => setMode('free')} style={{
        ...menuCard, background: '#66BB6A'
      }}>
        <span style={{ fontSize: 42 }}>✏️</span>
        <div>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>Free Drawing</div>
          <div style={{ fontSize: 14, opacity: .85 }}>Empty canvas - draw anything!</div>
        </div>
      </button>

      {['Animals', 'Nature', 'Vehicles', 'Places'].map(cat => {
        const items = DRAWINGS.filter(d => d.category === cat)
        if (items.length === 0) return null
        return (
          <div key={cat}>
            <h3 style={{ color: '#2E7D32', margin: '16px 0 8px', fontSize: 18 }}>
              {cat === 'Animals' ? '🐾' : cat === 'Nature' ? '🌿' : cat === 'Vehicles' ? '🚗' : '🏠'} {cat}
            </h3>
            <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
              {items.map(d => {
                const idx = DRAWINGS.indexOf(d)
                return (
                  <button key={idx} onClick={() => { setDrawingIdx(idx); setMode('coloring'); }} style={{
                    ...menuCard, background: '#43A047', padding: 12, justifyContent: 'center', flexDirection: 'column' as const, gap: 4
                  }}>
                    <span style={{ fontSize: 32 }}>{d.icon}</span>
                    <span style={{ fontSize: 15, fontWeight: 'bold' }}>{d.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  );

  // ===== DRAWING CANVAS =====
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#F5F5F5', fontFamily: "'Nunito', 'Quicksand', sans-serif"
    }}>
      {pet && <div style={{ position: 'fixed', bottom: 70, right: 12, fontSize: 36, zIndex: 50, opacity: .85 }}>{pet}</div>}

      {/* Top toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
        background: '#2E7D32', color: 'white', flexWrap: 'wrap'
      }}>
        <button onClick={() => { setMode('menu'); }} style={{
          border: 'none', background: '#1B5E20', color: 'white', borderRadius: 8,
          padding: '6px 12px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold'
        }}>⬅️</button>

        {/* Tool buttons */}
        {([
          ['brush', '🖌️'],
          ['eraser', '🧹'],
          ['fill', '🪣'],
        ] as [Tool, string][]).map(([t, icon]) => (
          <button key={t} onClick={() => setTool(t)} style={{
            border: tool === t ? '2px solid #FFEB3B' : '2px solid transparent',
            background: tool === t ? 'rgba(255,255,255,.25)' : 'transparent',
            borderRadius: 8, padding: '6px 10px', fontSize: 20, cursor: 'pointer',
          }}>{icon}</button>
        ))}

        <button onClick={clearCanvas} style={{
          border: 'none', background: '#C62828', color: 'white', borderRadius: 8,
          padding: '6px 10px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold',
          marginLeft: 'auto'
        }}>🗑️ Clear</button>
      </div>

      {/* Color palette */}
      <div style={{
        display: 'flex', gap: 4, padding: '6px 12px', background: '#E8E8E8',
        justifyContent: 'center', flexWrap: 'wrap'
      }}>
        {COLORS.map(c => (
          <button key={c} onClick={() => { setColor(c); if (tool === 'eraser') setTool('brush'); }} style={{
            width: 32, height: 32, borderRadius: '50%', border: color === c && tool !== 'eraser' ? '3px solid #333' : '2px solid #999',
            background: c, cursor: 'pointer', flexShrink: 0
          }} />
        ))}
      </div>

      {/* Brush size */}
      {tool !== 'fill' && (
        <div style={{
          display: 'flex', gap: 8, padding: '4px 12px', background: '#E0E0E0',
          alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: 12 }}>Size:</span>
          {BRUSH_SIZES.map(s => (
            <button key={s} onClick={() => setBrushSize(s)} style={{
              width: 36, height: 36, borderRadius: 8, border: brushSize === s ? '2px solid #333' : '1px solid #999',
              background: brushSize === s ? '#BBDEFB' : 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                width: Math.min(s, 20), height: Math.min(s, 20), borderRadius: '50%',
                background: tool === 'eraser' ? '#999' : color
              }} />
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        style={{ flex: 1, cursor: tool === 'fill' ? 'crosshair' : 'default', touchAction: 'none' }}
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
    </div>
  );
}

const backBtn: React.CSSProperties = {
  border: 'none', borderRadius: 20, padding: '12px 20px', fontSize: 16,
  background: 'linear-gradient(135deg, #43A047, #66BB6A)', color: 'white', fontWeight: 'bold', cursor: 'pointer',
  fontFamily: "'Nunito', 'Quicksand', sans-serif"
};

const menuCard: React.CSSProperties = {
  border: 'none', borderRadius: 16, padding: 16, cursor: 'pointer',
  color: 'white', display: 'flex', alignItems: 'center', gap: 14,
  fontFamily: "'Nunito', 'Quicksand', sans-serif", width: '100%', textAlign: 'left',
  marginBottom: 0
};
