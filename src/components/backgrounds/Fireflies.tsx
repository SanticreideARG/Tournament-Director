import { useMemo } from 'react';
import './backgrounds.css';

const QUANTITY = 15;
const rand = (n: number) => Math.floor(Math.random() * n);

/**
 * Luciérnagas (port del SCSS provisto). Genera, por instancia, las keyframes de
 * movimiento aleatorio y las duraciones de deriva/parpadeo, inyectadas en un <style>.
 */
export default function Fireflies() {
  const css = useMemo(() => {
    let out = '';
    for (let i = 1; i <= QUANTITY; i++) {
      const steps = rand(12) + 16;
      const rotation = rand(10) + 8; // s
      const flashDur = rand(6000) + 5000; // ms
      const flashDelay = rand(8000) + 500; // ms

      out += `.fireflies .firefly:nth-child(${i}){animation-name:ff-move${i};}`;
      out += `.fireflies .firefly:nth-child(${i})::before{animation-duration:${rotation}s;}`;
      out += `.fireflies .firefly:nth-child(${i})::after{animation-duration:${rotation}s,${flashDur}ms;animation-delay:0ms,${flashDelay}ms;}`;

      out += `@keyframes ff-move${i}{`;
      for (let s = 0; s <= steps; s++) {
        const pct = (s * (100 / steps)).toFixed(2);
        const x = rand(100) - 50;
        const y = rand(100) - 50;
        const scale = rand(75) / 100 + 0.25;
        out += `${pct}%{transform:translateX(${x}vw) translateY(${y}vh) scale(${scale});}`;
      }
      out += `}`;
    }
    return out;
  }, []);

  return (
    <div className="bg-fx fireflies">
      <style>{css}</style>
      {Array.from({ length: QUANTITY }, (_, i) => (
        <div className="firefly" key={i} />
      ))}
    </div>
  );
}
