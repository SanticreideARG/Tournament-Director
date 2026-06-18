import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  r: number;
  base: number;
  twSpeed: number;
  twPhase: number;
}

interface Shooting {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  len: number;
}

/** Cielo estrellado con parpadeo + estrellas fugaces ocasionales (Canvas 2D). */
export default function Starfield({ dark = true }: { dark?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let shooting: Shooting[] = [];

    const build = () => {
      const count = Math.round((w * h) / 2400);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.3,
        base: Math.random() * 0.5 + 0.35,
        twSpeed: Math.random() * 2 + 0.5,
        twPhase: Math.random() * Math.PI * 2,
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

    const starRGB = dark ? '255,255,255' : '90,100,120';
    const goldRGB = '240,210,140';

    const spawnShooting = () => {
      const fromLeft = Math.random() > 0.5;
      const speed = Math.random() * 500 + 500;
      const angle = (Math.random() * 0.3 + 0.15) * Math.PI; // hacia abajo-diagonal
      shooting.push({
        x: fromLeft ? Math.random() * w * 0.4 : w - Math.random() * w * 0.4,
        y: Math.random() * h * 0.4,
        vx: Math.cos(angle) * speed * (fromLeft ? 1 : -1),
        vy: Math.sin(angle) * speed,
        life: 1,
        len: Math.random() * 120 + 80,
      });
    };

    let raf = 0;
    let last = performance.now();
    let nextShoot = 1.5 + Math.random() * 4;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      ctx.clearRect(0, 0, w, h);

      for (const s of stars) {
        s.twPhase += s.twSpeed * dt;
        const a = s.base + Math.sin(s.twPhase) * 0.35;
        ctx.beginPath();
        ctx.fillStyle = `rgba(${starRGB},${Math.max(0, a)})`;
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      nextShoot -= dt;
      if (nextShoot <= 0 && dark) { spawnShooting(); nextShoot = 3 + Math.random() * 6; }

      shooting = shooting.filter((sh) => sh.life > 0);
      for (const sh of shooting) {
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.life -= dt * 0.8;
        const nx = sh.x - (sh.vx / Math.hypot(sh.vx, sh.vy)) * sh.len;
        const ny = sh.y - (sh.vy / Math.hypot(sh.vx, sh.vy)) * sh.len;
        const grad = ctx.createLinearGradient(sh.x, sh.y, nx, ny);
        grad.addColorStop(0, `rgba(${goldRGB},${Math.max(0, sh.life)})`);
        grad.addColorStop(1, 'rgba(240,210,140,0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sh.x, sh.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
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
