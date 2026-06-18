import { useMemo } from 'react';
import './backgrounds.css';

const COUNT = 18;

/** Orbes dorados desenfocados que ascienden lentamente (estética casino). */
export default function Bokeh() {
  const orbs = useMemo(
    () =>
      Array.from({ length: COUNT }, () => {
        const size = Math.random() * 90 + 30;
        return {
          size,
          left: Math.random() * 100,
          duration: Math.random() * 18 + 14,
          delay: -Math.random() * 30,
          opacity: Math.random() * 0.4 + 0.3,
        };
      }),
    [],
  );

  return (
    <div className="bg-fx bokeh" style={{ background: 'var(--bg)' }}>
      {orbs.map((o, i) => (
        <div
          key={i}
          className="bokeh-orb"
          style={{
            width: o.size,
            height: o.size,
            left: `${o.left}vw`,
            bottom: `-${o.size}px`,
            animationDuration: `${o.duration}s`,
            animationDelay: `${o.delay}s`,
            ['--orb-opacity' as string]: o.opacity,
          }}
        />
      ))}
    </div>
  );
}
