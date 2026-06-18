import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Level, Tournament } from '../types/tournament';
import { uid } from '../lib/csv';

export function makeLevel(partial: Partial<Level> = {}): Level {
  return {
    id: uid(),
    name: partial.name ?? 'Nivel',
    isBreak: partial.isBreak ?? false,
    durationSeconds: partial.durationSeconds ?? 20 * 60,
    smallBlind: partial.smallBlind ?? null,
    bigBlind: partial.bigBlind ?? null,
    ante: partial.ante ?? null,
    startMessage: partial.startMessage ?? '',
    endMessage: partial.endMessage ?? '',
  };
}

export function makeTournament(name = 'Nuevo torneo', levels: Level[] = []): Tournament {
  const now = Date.now();
  return { id: uid(), name, createdAt: now, updatedAt: now, levels };
}

interface TournamentState {
  tournaments: Tournament[];
  upsert: (t: Tournament) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => void;
  get: (id: string) => Tournament | undefined;
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, getState) => ({
      tournaments: [],
      upsert: (t) =>
        set((s) => {
          const updated = { ...t, updatedAt: Date.now() };
          const idx = s.tournaments.findIndex((x) => x.id === t.id);
          if (idx === -1) return { tournaments: [...s.tournaments, updated] };
          const next = s.tournaments.slice();
          next[idx] = updated;
          return { tournaments: next };
        }),
      remove: (id) => set((s) => ({ tournaments: s.tournaments.filter((t) => t.id !== id) })),
      duplicate: (id) =>
        set((s) => {
          const src = s.tournaments.find((t) => t.id === id);
          if (!src) return s;
          const copy = makeTournament(`${src.name} (copia)`, src.levels.map((l) => ({ ...l, id: uid() })));
          return { tournaments: [...s.tournaments, copy] };
        }),
      get: (id) => getState().tournaments.find((t) => t.id === id),
    }),
    { name: 'td-tournaments' },
  ),
);
