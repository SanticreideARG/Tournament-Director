import { useEffect, useRef, type ReactNode } from 'react';

/** Envuelve el contenido en un lienzo fijo 1920×1080 escalado al viewport. */
export default function ScaledStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const resize = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / 1920, vh / 1080);
      el.style.transform = `scale(${scale})`;
      el.style.left = `${(vw - 1920 * scale) / 2}px`;
      el.style.top = `${(vh - 1080 * scale) / 2}px`;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <div ref={ref} className="stage-screen">
      {children}
    </div>
  );
}
