import React, { useState, useRef, useEffect, useCallback } from 'react';
import { logError, ErrorCode } from '../utils/errorLogger';

interface Props { onBack: () => void; pet?: string }

type Tool = 'brush' | 'eraser' | 'fill';
type DrawMode = 'menu' | 'free' | 'coloring';

const COLORS = ['#FF0000','#FF6600','#FFCC00','#33CC33','#0099FF','#6633CC','#FF69B4','#8B4513','#000000','#FFFFFF'];
const BRUSH_SIZES = [4, 8, 14, 22];

// Simple vehicle outlines - defined as paths to draw on canvas
const VEHICLES: { name: string; icon: string; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }[] = [
  {
    name: 'Excavator',
    icon: '🏗️',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2;
      ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      // body
      ctx.beginPath(); ctx.rect(cx - 80, cy + 20, 160, 60); ctx.stroke();
      // cab
      ctx.beginPath(); ctx.rect(cx + 20, cy - 30, 60, 50); ctx.stroke();
      // window
      ctx.beginPath(); ctx.rect(cx + 30, cy - 20, 40, 25); ctx.stroke();
      // arm
      ctx.beginPath(); ctx.moveTo(cx - 40, cy - 30); ctx.lineTo(cx - 100, cy - 100);
      ctx.lineTo(cx - 60, cy - 120); ctx.stroke();
      // bucket
      ctx.beginPath(); ctx.moveTo(cx - 60, cy - 120); ctx.lineTo(cx - 80, cy - 90);
      ctx.lineTo(cx - 40, cy - 90); ctx.closePath(); ctx.stroke();
      // tracks
      ctx.beginPath();
      ctx.ellipse(cx - 50, cy + 100, 40, 20, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx + 50, cy + 100, 40, 20, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.rect(cx - 90, cy + 80, 180, 40); ctx.stroke();
    }
  },
  {
    name: 'Dump Truck',
    icon: '🚚',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2;
      ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      // truck bed
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy - 60); ctx.lineTo(cx + 80, cy - 60);
      ctx.lineTo(cx + 80, cy + 30); ctx.lineTo(cx - 100, cy + 30); ctx.closePath(); ctx.stroke();
      // cab
      ctx.beginPath(); ctx.rect(cx + 80, cy - 30, 60, 60); ctx.stroke();
      // window
      ctx.beginPath(); ctx.rect(cx + 90, cy - 20, 40, 30); ctx.stroke();
      // wheels
      ctx.beginPath(); ctx.arc(cx - 60, cy + 50, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx - 60, cy + 50, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 60, cy + 50, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 60, cy + 50, 8, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 120, cy + 50, 22, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 120, cy + 50, 8, 0, Math.PI * 2); ctx.stroke();
      // chassis
      ctx.beginPath(); ctx.moveTo(cx - 100, cy + 30); ctx.lineTo(cx + 150, cy + 30); ctx.stroke();
    }
  },
  {
    name: 'Bulldozer',
    icon: '🚜',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2;
      ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      // body
      ctx.beginPath(); ctx.rect(cx - 60, cy - 20, 120, 50); ctx.stroke();
      // cab
      ctx.beginPath(); ctx.rect(cx, cy - 60, 50, 40); ctx.stroke();
      // window
      ctx.beginPath(); ctx.rect(cx + 8, cy - 52, 34, 22); ctx.stroke();
      // blade
      ctx.beginPath();
      ctx.moveTo(cx - 100, cy - 40); ctx.lineTo(cx - 100, cy + 50);
      ctx.lineTo(cx - 60, cy + 30); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 60, cy); ctx.lineTo(cx - 100, cy); ctx.stroke();
      // tracks
      ctx.beginPath();
      const trackY = cy + 50;
      ctx.moveTo(cx - 60, trackY); ctx.lineTo(cx + 60, trackY);
      ctx.arc(cx + 60, trackY + 15, 15, -Math.PI / 2, Math.PI / 2);
      ctx.lineTo(cx - 60, trackY + 30);
      ctx.arc(cx - 60, trackY + 15, 15, Math.PI / 2, -Math.PI / 2);
      ctx.stroke();
      // track lines
      for (let x = cx - 50; x <= cx + 50; x += 20) {
        ctx.beginPath(); ctx.moveTo(x, trackY); ctx.lineTo(x, trackY + 30); ctx.stroke();
      }
    }
  },
  {
    name: 'Crane',
    icon: '🏗️',
    draw: (ctx, w, h) => {
      const cx = w / 2, cy = h / 2;
      ctx.strokeStyle = '#333'; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      // base
      ctx.beginPath(); ctx.rect(cx - 50, cy + 40, 100, 40); ctx.stroke();
      // tower
      ctx.beginPath(); ctx.rect(cx - 15, cy - 120, 30, 160); ctx.stroke();
      // cross bracing
      for (let y = cy - 100; y < cy + 30; y += 30) {
        ctx.beginPath(); ctx.moveTo(cx - 15, y); ctx.lineTo(cx + 15, y + 30); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 15, y); ctx.lineTo(cx - 15, y + 30); ctx.stroke();
      }
      // boom arm
      ctx.beginPath(); ctx.moveTo(cx, cy - 120); ctx.lineTo(cx + 120, cy - 120); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 110); ctx.lineTo(cx + 120, cy - 110); ctx.stroke();
      // cable
      ctx.beginPath(); ctx.moveTo(cx + 100, cy - 110); ctx.lineTo(cx + 100, cy - 40); ctx.stroke();
      // hook
      ctx.beginPath(); ctx.arc(cx + 100, cy - 35, 8, 0, Math.PI); ctx.stroke();
      // wheels
      ctx.beginPath(); ctx.arc(cx - 30, cy + 100, 20, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 30, cy + 100, 20, 0, Math.PI * 2); ctx.stroke();
    }
  },
];

export default function Drawing({ onBack, pet }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<DrawMode>('menu');
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState('#FF0000');
  const [brushSize, setBrushSize] = useState(8);
  const [vehicleIdx, setVehicleIdx] = useState(0);
  const drawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const outlineDataRef = useRef<ImageData | null>(null);
  const outlineCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const initCanvas = useCallback((drawVehicle: boolean) => {
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

    if (drawVehicle) {
      VEHICLES[vehicleIdx].draw(ctx, rect.width, rect.height);
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
  }, [vehicleIdx]);

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
      minHeight: '100vh', padding: 16, fontFamily: '"Comic Sans MS", cursive',
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

      <h3 style={{ color: '#2E7D32', margin: '16px 0 8px', fontSize: 18 }}>🚧 Color Construction Vehicles</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {VEHICLES.map((v, i) => (
          <button key={i} onClick={() => { setVehicleIdx(i); setMode('coloring'); }} style={{
            ...menuCard, background: '#43A047'
          }}>
            <span style={{ fontSize: 36 }}>{v.icon}</span>
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>{v.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ===== DRAWING CANVAS =====
  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      background: '#F5F5F5', fontFamily: '"Comic Sans MS", cursive'
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
  fontFamily: '"Comic Sans MS", cursive'
};

const menuCard: React.CSSProperties = {
  border: 'none', borderRadius: 16, padding: 16, cursor: 'pointer',
  color: 'white', display: 'flex', alignItems: 'center', gap: 14,
  fontFamily: '"Comic Sans MS", cursive', width: '100%', textAlign: 'left',
  marginBottom: 0
};
