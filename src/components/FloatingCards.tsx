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

const POSITIONS = [
  { x: 120, y: 380 },
  { x: 1680, y: 380 },
  { x: 60, y: 720 },
  { x: 1750, y: 720 },
  { x: 200, y: 900 },
  { x: 1620, y: 240 },
];

/** Cartas de póker decorativas que flotan en el fondo. */
export default function FloatingCards() {
  const cards = useMemo(
    () =>
      DECK.map((card, i) => ({
        card,
        pos: POSITIONS[i % POSITIONS.length],
        dur: 9 + Math.random() * 5,
        del: Math.random() * 7,
      })),
    [],
  );

  return (
    <div className="cards-container">
      {cards.map(({ card, pos, dur, del }, i) => (
        <div
          key={i}
          className="poker-card"
          style={{
            left: pos.x,
            top: pos.y,
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
