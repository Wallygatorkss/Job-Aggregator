import { useEffect, useRef } from 'react';

type Particle = { x: number; baseY: number; size: number; alpha: number; speed: number; phase: number };

export function GridBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let stopped = false;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;
    let maxX = 0;
    let particles: Particle[] = [];

    function buildParticles() {
      const count = Math.min(220, Math.round((width * height) / 7000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * maxX,
        baseY: height * 0.65 + (Math.random() - 0.5) * 140,
        size: 0.6 + Math.random() * 2.2,
        alpha: 0.4 + Math.random() * 0.6,
        speed: 0.2 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      const ct = c.getContext('2d');
      if (!ct) return;
      width = window.innerWidth;
      height = window.innerHeight;
      maxX = width * 0.55;
      c.width = Math.round(width * dpr);
      c.height = Math.round(height * dpr);
      c.style.width = width + 'px';
      c.style.height = height + 'px';
      ct.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
    }

    resize();
    window.addEventListener('resize', resize);

    function step(now: number) {
      if (stopped) return;
      const c = canvasRef.current;
      if (!c) return;
      const ct = c.getContext('2d');
      if (!ct) return;
      const t = now * 0.0006;

      ct.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.speed;
        if (p.x > maxX + 20) {
          p.x = -20;
        }

        const wave = Math.sin((p.x / maxX) * Math.PI * 2 + t + p.phase) * 40;
        const y = p.baseY + wave + Math.sin(t * 0.8 + p.phase) * 6;

        ct.beginPath();
        ct.fillStyle = `rgba(201,168,76,${p.alpha})`;
        ct.shadowColor = 'rgba(201,168,76,0.6)';
        ct.shadowBlur = 8;
        ct.arc(p.x, y, p.size, 0, Math.PI * 2);
        ct.fill();
      }

      requestAnimationFrame(step);
    }

    const raf = requestAnimationFrame(step);

    return () => {
      stopped = true;
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none" style={{ background: '#0a0a0a' }} />
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-[1]" />
    </>
  );
}
