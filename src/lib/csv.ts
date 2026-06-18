import Papa from 'papaparse';
import type { Level, Tournament } from '../types/tournament';
import { parseDuration, formatDuration } from './time';

const uid = () =>
  (crypto.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(36).slice(2)}`);

/**
 * Tokeniza una fila tolerando el formato real del usuario:
 * comillas simples O dobles, espacios alrededor de las comas, comas dentro
 * de campos entrecomillados y comilla final sobrante.
 */
function splitRow(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  const n = line.length;
  while (true) {
    while (i < n && (line[i] === ' ' || line[i] === '\t')) i++; // espacios iniciales
    let value = '';
    if (i < n && (line[i] === "'" || line[i] === '"')) {
      const q = line[i++];
      let buf = '';
      while (i < n) {
        if (line[i] === q) {
          if (line[i + 1] === q) { buf += q; i += 2; continue; } // comilla escapada ''
          i++;
          break;
        }
        buf += line[i++];
      }
      value = buf;
      while (i < n && line[i] !== ',') i++; // descarta resto hasta la coma
    } else {
      let buf = '';
      while (i < n && line[i] !== ',') buf += line[i++];
      value = buf.trim();
    }
    fields.push(value);
    if (i < n && line[i] === ',') { i++; continue; }
    break;
  }
  return fields;
}

function toNumber(cell: string | undefined): number | null {
  const s = (cell ?? '').replace(/[.,\s]/g, '');
  if (s === '') return null;
  const num = parseInt(s, 10);
  return Number.isNaN(num) ? null : num;
}

const HEADER_HINTS = ['nivel', 'level', 'time', 'tiempo', 'blind', 'ciega'];

/**
 * Parsea un CSV con el formato:
 * Nivel, Time, Small Blind, Big Blind, Ante, Starting message, Ending Message
 */
export function parseTournamentCsv(text: string): Level[] {
  const lines = text.split(/\r?\n/);
  const rows = lines
    .map(splitRow)
    .filter((r) => r.some((c) => c.trim() !== ''));
  if (rows.length === 0) return [];

  const first = rows[0].map((c) => c.toLowerCase());
  const looksLikeHeader = HEADER_HINTS.some((h) => first.some((c) => c.includes(h) && !/\d/.test(c)));
  const bodyRows = looksLikeHeader ? rows.slice(1) : rows;

  return bodyRows.map((cols) => {
    const name = (cols[0] ?? '').trim();
    const durationSeconds = parseDuration(cols[1] ?? '');
    const smallBlind = toNumber(cols[2]);
    const bigBlind = toNumber(cols[3]);
    const ante = toNumber(cols[4]);
    const startMessage = (cols[5] ?? '').trim();
    const endMessage = (cols[6] ?? '').trim();
    const isBreak = /break|descanso|pausa|intervalo/i.test(name) || (smallBlind == null && bigBlind == null);

    const level: Level = {
      id: uid(),
      name: name || 'Nivel',
      isBreak,
      durationSeconds,
      smallBlind,
      bigBlind,
      ante,
      startMessage,
      endMessage,
    };
    return level;
  });
}

/** Serializa un torneo al CSV (comillas dobles estándar; el importador lo re-lee igual). */
export function tournamentToCsv(t: Tournament): string {
  const header = ['Nivel', 'Time', 'Small Blind', 'Big Blind', 'Ante', 'Starting message', 'Ending Message'];
  const rows = t.levels.map((l) => [
    l.name,
    formatDuration(l.durationSeconds),
    l.smallBlind ?? '',
    l.bigBlind ?? '',
    l.ante ?? '',
    l.startMessage,
    l.endMessage,
  ]);
  return Papa.unparse([header, ...rows]);
}

export { uid };
