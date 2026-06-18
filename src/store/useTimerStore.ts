import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Level, Tournament } from '../types/tournament';

/**
 * Reloj de torneo basado en TIMESTAMP (`levelEndsAt`) en lugar de un contador que
 * decrementa. Ventajas: es exacto contra el reloj real, sobrevive a la navegación
 * y a las recargas (se persiste en localStorage), y avanza de nivel en tiempo real
 * aunque la pantalla del timer no esté montada (un intervalo global lo gobierna).
 *
 * - Mientras CORRE: `levelEndsAt` marca cuándo termina el nivel; `getRemaining()`
 *   deriva los segundos restantes de `Date.now()`.
 * - En PAUSA: `pausedRemaining` congela los segundos restantes y `levelEndsAt` es null.
 * - Al arrancar en frío (recarga/reapertura) se retoma EN PAUSA donde quedó.
 */

let intervalId: ReturnType<typeof setInterval> | null = null;

interface TimerState {
  tournament: Tournament | null;
  currentIndex: number;
  running: boolean;
  finished: boolean;
  warned: boolean;
  /** epoch ms en que termina el nivel actual (solo si corriendo) */
  levelEndsAt: number | null;
  /** segundos restantes congelados (solo si en pausa) */
  pausedRemaining: number;

  load: (t: Tournament) => void;
  play: () => void;
  pause: () => void;
  togglePause: () => void;
  goToLevel: (index: number) => void;
  next: () => void;
  prev: () => void;
  markWarned: () => void;
  reset: () => void;
  tick: () => void;

  getRemaining: () => number;
  currentLevel: () => Level | null;
  nextLevel: () => Level | null;
  hasActive: () => boolean;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      tournament: null,
      currentIndex: 0,
      running: false,
      finished: false,
      warned: false,
      levelEndsAt: null,
      pausedRemaining: 0,

      load: (t) => {
        const dur = t.levels[0]?.durationSeconds ?? 0;
        set({
          tournament: t,
          currentIndex: 0,
          running: true,
          finished: false,
          warned: false,
          levelEndsAt: Date.now() + dur * 1000,
          pausedRemaining: dur,
        });
        startTicking();
      },

      play: () => {
        const { finished, tournament, pausedRemaining } = get();
        if (finished || !tournament) return;
        set({ running: true, levelEndsAt: Date.now() + Math.max(0, pausedRemaining) * 1000 });
        startTicking();
      },

      pause: () => {
        const { running, levelEndsAt, pausedRemaining } = get();
        if (!running) return;
        const rem = levelEndsAt != null ? Math.max(0, (levelEndsAt - Date.now()) / 1000) : pausedRemaining;
        stopTicking();
        set({ running: false, pausedRemaining: rem, levelEndsAt: null });
      },

      togglePause: () => {
        if (get().running) get().pause();
        else get().play();
      },

      goToLevel: (index) => {
        const t = get().tournament;
        if (!t) return;
        const i = Math.max(0, Math.min(index, t.levels.length - 1));
        const dur = t.levels[i]?.durationSeconds ?? 0;
        const running = get().running;
        set({
          currentIndex: i,
          finished: false,
          warned: false,
          pausedRemaining: dur,
          levelEndsAt: running ? Date.now() + dur * 1000 : null,
        });
        if (running) startTicking();
      },

      next: () => {
        const { tournament, currentIndex } = get();
        if (!tournament) return;
        if (currentIndex + 1 >= tournament.levels.length) {
          stopTicking();
          set({ finished: true, running: false, levelEndsAt: null, pausedRemaining: 0 });
          return;
        }
        get().goToLevel(currentIndex + 1);
      },

      prev: () => get().goToLevel(get().currentIndex - 1),

      markWarned: () => set({ warned: true }),

      reset: () => {
        stopTicking();
        set({
          tournament: null,
          currentIndex: 0,
          running: false,
          finished: false,
          warned: false,
          levelEndsAt: null,
          pausedRemaining: 0,
        });
      },

      // Llamado por el intervalo global (cada 1s). Solo gestiona el cambio de nivel;
      // los segundos restantes se derivan en getRemaining().
      tick: () => {
        const { running, finished, levelEndsAt, tournament, currentIndex } = get();
        if (!running || finished || levelEndsAt == null || !tournament) return;
        const now = Date.now();
        if (levelEndsAt - now > 0) return;

        let idx = currentIndex;
        let endAt = levelEndsAt;
        while (endAt - now <= 0) {
          const ni = idx + 1;
          if (ni >= tournament.levels.length) {
            stopTicking();
            set({ finished: true, running: false, levelEndsAt: null, pausedRemaining: 0, currentIndex: idx });
            return;
          }
          idx = ni;
          endAt += tournament.levels[ni].durationSeconds * 1000;
        }
        set({ currentIndex: idx, levelEndsAt: endAt, warned: false, pausedRemaining: Math.max(0, (endAt - now) / 1000) });
      },

      getRemaining: () => {
        const { running, levelEndsAt, pausedRemaining } = get();
        if (running && levelEndsAt != null) return Math.max(0, (levelEndsAt - Date.now()) / 1000);
        return Math.max(0, pausedRemaining);
      },

      currentLevel: () => {
        const { tournament, currentIndex } = get();
        return tournament?.levels[currentIndex] ?? null;
      },
      nextLevel: () => {
        const { tournament, currentIndex } = get();
        return tournament?.levels[currentIndex + 1] ?? null;
      },
      hasActive: () => {
        const { tournament, finished } = get();
        return !!tournament && !finished;
      },
    }),
    {
      name: 'td-timer',
      partialize: (s) => ({
        tournament: s.tournament,
        currentIndex: s.currentIndex,
        running: s.running,
        finished: s.finished,
        warned: s.warned,
        levelEndsAt: s.levelEndsAt,
        pausedRemaining: s.pausedRemaining,
      }),
      onRehydrateStorage: () => (state) => {
        // Arranque en frío: retomar EN PAUSA donde quedó.
        if (!state || !state.tournament || state.finished) return;
        let rem = state.pausedRemaining;
        if (state.running && state.levelEndsAt != null) {
          rem = Math.max(0, (state.levelEndsAt - Date.now()) / 1000);
          const lvl = state.tournament.levels[state.currentIndex];
          if (lvl) rem = Math.min(rem, lvl.durationSeconds);
        }
        state.running = false;
        state.levelEndsAt = null;
        state.pausedRemaining = rem;
      },
    },
  ),
);

function startTicking() {
  if (intervalId) return;
  intervalId = setInterval(() => useTimerStore.getState().tick(), 1000);
}

function stopTicking() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
