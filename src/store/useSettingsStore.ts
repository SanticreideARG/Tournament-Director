import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LanguageCode, ThemeName, Wallpaper } from '../types/tournament';
import { setLanguage } from '../i18n';
import { THEME_IDS } from '../lib/themes';

interface SettingsState {
  theme: ThemeName;
  language: LanguageCode;
  wallpaper: Wallpaper;
  soundEnabled: boolean;
  warnSeconds: number;
  setTheme: (t: ThemeName) => void;
  setLanguage: (l: LanguageCode) => void;
  setWallpaper: (w: Wallpaper) => void;
  setSoundEnabled: (v: boolean) => void;
  setWarnSeconds: (n: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'royal',
      language: 'es',
      wallpaper: 'shader',
      soundEnabled: true,
      warnSeconds: 10,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => {
        setLanguage(language);
        set({ language });
      },
      setWallpaper: (wallpaper) => set({ wallpaper }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setWarnSeconds: (warnSeconds) => set({ warnSeconds: Math.max(0, warnSeconds) }),
    }),
    {
      name: 'td-settings',
      version: 1,
      migrate: (persisted) => {
        // V0 usaba theme 'dark'/'light'; mapear a los temas nombrados.
        const s = persisted as Record<string, unknown> | undefined;
        if (s && typeof s.theme === 'string' && !THEME_IDS.includes(s.theme as ThemeName)) {
          s.theme = s.theme === 'light' ? 'ivory' : 'royal';
        }
        return s as unknown as SettingsState;
      },
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (!THEME_IDS.includes(state.theme)) state.theme = 'royal';
        setLanguage(state.language);
      },
    },
  ),
);
