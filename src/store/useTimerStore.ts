import { create } from 'zustand';
import type { Level, Tournament } from '../types/tournament';

interface TimerState {
  tournament: Tournament | null;
  currentIndex: number;
  remaining: number; // segundos restantes del nivel actual
  running: boolean;
  finished: boolean;
  /** evita disparar el aviso de 10s mas de una vez por nivel */
  warned: boolean;

  load: (t: Tournament) => void;
  tick: (deltaSeconds: number) => void;
  togglePause: () => void;
  setRunning: (v: boolean) => void;
  goToLevel: (index: number) => void;
  next: () => void;
  prev: () => void;
  markWarned: () => void;
  reset: () => void;

  currentLevel: () => Level | null;
  nextLevel: () => Level | null;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  tournament: null,
  currentIndex: 0,
  remaining: 0,
  running: false,
  finished: false,
  warned: false,

  load: (t) =>
    set({
      tournament: t,
      currentIndex: 0,
      remaining: t.levels[0]?.durationSeconds ?? 0,
      running: true,
      finished: false,
      warned: false,
    }),

  tick: (delta) => {
    const { running, finished, remaining } = get();
    if (!running || finished) return;
    const next = remaining - delta;
    if (next > 0) {
      set({ remaining: next });
    } else {
      get().next();
    }
  },

  togglePause: () => set((s) => ({ running: !s.running })),
  setRunning: (running) => set({ running }),

  goToLevel: (index) => {
    const t = get().tournament;
    if (!t) return;
    const i = Math.max(0, Math.min(index, t.levels.length - 1));
    set({
      currentIndex: i,
      remaining: t.levels[i]?.durationSeconds ?? 0,
      warned: false,
      finished: false,
    });
  },

  next: () => {
    const { tournament, currentIndex } = get();
    if (!tournament) return;
    const ni = currentIndex + 1;
    if (ni >= tournament.levels.length) {
      set({ finished: true, running: false, remaining: 0 });
      return;
    }
    set({
      currentIndex: ni,
      remaining: tournament.levels[ni].durationSeconds,
      warned: false,
    });
  },

  prev: () => {
    const { currentIndex } = get();
    get().goToLevel(Math.max(0, currentIndex - 1));
  },

  markWarned: () => set({ warned: true }),

  reset: () =>
    set({ tournament: null, currentIndex: 0, remaining: 0, running: false, finished: false, warned: false }),

  currentLevel: () => {
    const { tournament, currentIndex } = get();
    return tournament?.levels[currentIndex] ?? null;
  },
  nextLevel: () => {
    const { tournament, currentIndex } = get();
    return tournament?.levels[currentIndex + 1] ?? null;
  },
}));
