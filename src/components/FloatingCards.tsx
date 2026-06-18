import { useMemo } from 'react';

interface CardDef {
  r: string;
  s: string;
  c: 'red' | 'black';
}

const DECK: CardDef[] = [
  { r: 'A', s: '♠', c: 'black' },
  { r: 'K', s: '♥', c: 'red' },
  { r: 'Q', s: '♦', c: 'red' },
  { r: 'J', s: '♣', c: 'black' },
  { r: 'A', s: '♥', c: 'red' },
  { r: '10', s: '♠', c: 'black' },
];

/** Posiciones en % del contenedor (sirven tanto en el lienzo escalado como en fluido). */
const LAYOUTS: Record<'sides' | 'topbottom', { x: number; y: number }[]> = {
  sides: [
    { x: 6, y: 34 },
    { x: 90, y: 30 },
    { x: 3, y: 64 },
    { x: 92, y: 66 },
    { x: 9, y: 86 },
    { x: 88, y: 16 },
  ],
  topbottom: [
    { x: 12, y: 7 },
    { x: 74, y: 6 },
    { x: 42, y: 4 },
    { x: 18, y: 88 },
    { x: 64, y: 90 },
    { x: 86, y: 84 },
  ],
};

interface Props {
  /** 'sides' = a los lados (desktop); 'topbottom' = arriba y abajo (mobile timer). */
  layout?: 'sides' | 'topbottom';
}

/** Cartas de póker decorativas que flotan en el fondo. */
export default function FloatingCards({ layout = 'sides' }: Props) {
  const cards = useMemo(
    () =>
      DECK.map((card, i) => ({
        card,
        pos: LAYOUTS[layout][i % LAYOUTS[layout].length],
        dur: 9 + Math.random() * 5,
        del: Math.random() * 7,
      })),
    [layout],
  );

  return (
    <div className="cards-container">
      {cards.map(({ card, pos, dur, del }, i) => (
        <div
          key={i}
          className="poker-card"
          style={{
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            animation: `floatCard ${dur}s ${del}s ease-in-out infinite`,
          }}
        >
          <div className="card-face card-front">
            <div className="card-suit-tl">
              <span className={`card-rank ${card.c}`}>{card.r}</span>
              <span className={`card-suit-icon ${card.c}`}>{card.s}</span>
            </div>
            <span className={`card-center-suit ${card.c}`}>{card.s}</span>
            <div className="card-suit-br">
              <span className={`card-rank ${card.c}`}>{card.r}</span>
              <span className={`card-suit-icon ${card.c}`}>{card.s}</span>
            </div>
          </div>
          <div className="card-face card-back">
            <span className="card-back-suit">♠</span>
            <span className="card-back-logo">PokerHouse</span>
            <span className="card-back-suit">♠</span>
          </div>
        </div>
      ))}
    </div>
  );
}
