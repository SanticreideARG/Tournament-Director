import { useEffect, useRef, type ReactNode } from 'react';
import { useIsMobile } from '../lib/useIsMobile';

/**
 * En desktop/tablet envuelve el contenido en un lienzo fijo 1920×1080 escalado al
 * viewport (ideal para TV/proyector). En mobile cambia a un layout FLUIDO (sin escalar)
 * para que cada pantalla pueda reacomodarse con CSS responsive (ver styles/mobile.css).
 */
export default function ScaledStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const fluid = useIsMobile();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (fluid) {
      // limpiar el transform/posición del modo escalado
      el.style.transform = '';
      el.style.left = '';
      el.style.top = '';
      return;
    }
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
  }, [fluid]);

  return (
    <div ref={ref} className={`stage-screen${fluid ? ' fluid' : ''}`}>
      {children}
    </div>
  );
}
