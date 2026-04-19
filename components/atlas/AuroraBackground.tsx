'use client';

import { useEffect, useRef } from 'react';

export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const t0 = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const blobs = [
      { hue: 28,  x: 0.20, y: 0.20, r: 0.55, sp: 0.00006, ph: 0.0 },
      { hue: 335, x: 0.82, y: 0.78, r: 0.50, sp: 0.00008, ph: 1.4 },
      { hue: 210, x: 0.85, y: 0.18, r: 0.50, sp: 0.00007, ph: 2.7 },
      { hue: 265, x: 0.15, y: 0.85, r: 0.45, sp: 0.00009, ph: 3.9 },
    ];
    let w = 0, h = 0;
    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);
    const draw = (now: number) => {
      const t = now - t0;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const b of blobs) {
        const dx = Math.sin(t * b.sp + b.ph) * 0.14;
        const dy = Math.cos(t * b.sp * 0.8 + b.ph * 1.3) * 0.10;
        const cx = (b.x + dx) * w;
        const cy = (b.y + dy) * h;
        const rad = Math.min(w, h) * b.r;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        g.addColorStop(0,   `hsla(${b.hue},75%,72%,0.40)`);
        g.addColorStop(0.5, `hsla(${b.hue},70%,65%,0.12)`);
        g.addColorStop(1,   `hsla(${b.hue},60%,55%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <video
        autoPlay loop muted playsInline
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      >
        <source
          src="https://res.cloudinary.com/dqesvrisb/video/upload/v1776479082/Untitled_online-video-cutter.com_pvzxhg.mp4"
          type="video/mp4"
        />
      </video>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          filter: 'blur(40px)', mixBlendMode: 'screen', opacity: 0.85, pointerEvents: 'none',
        }}
      />
      {/* grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.10) 1px, transparent 1px)',
        backgroundSize: '3px 3px', mixBlendMode: 'overlay', opacity: 0.28,
      }} />
      {/* vignette bloom */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(900px 600px at 50% 45%, rgba(255,255,255,0.28), transparent 65%), radial-gradient(1200px 700px at 20% 10%, rgba(255,255,255,0.20), transparent 70%)',
      }} />
      {/* white veil */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.20)', pointerEvents: 'none' }} />
    </div>
  );
}
