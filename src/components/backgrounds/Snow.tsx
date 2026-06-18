import { useEffect, useRef } from 'react';

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
  phase: number;
}

/** Nieve cayendo (Canvas 2D). En temas claros usa un gris azulado suave. */
export default function Snow({ dark = true }: { dark?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let flakes: Flake[] = [];

    const build = () => {
      const count = Math.round((w * h) / 16000); // densidad por área
      flakes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.5 + 0.8,
        speed: Math.random() * 30 + 18,
        drift: Math.random() * 24 - 12,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    };
    resize();
    window.addEventListener('resize', resize);

    const color = dark ? '255,255,255' : '120,140,170';
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        f.y += f.speed * dt;
        f.phase += dt;
        f.x += Math.sin(f.phase) * f.drift * dt;
        if (f.y - f.r > h) { f.y = -f.r; f.x = Math.random() * w; }
        if (f.x > w + 5) f.x = -5;
        else if (f.x < -5) f.x = w + 5;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${color},${0.5 + (f.r / 3.3) * 0.5})`;
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [dark]);

  return <canvas ref={ref} className="bg-canvas" />;
}
