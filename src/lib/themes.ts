import type { ThemeMode, ThemeName, BackgroundId } from '../types/tournament';

export interface ThemeDef {
  id: ThemeName;
  label: string;
  mode: ThemeMode;
  /** color representativo para el swatch del selector */
  swatch: string;
}

export const THEMES: ThemeDef[] = [
  { id: 'royal', label: 'Royal Navy', mode: 'dark', swatch: '#0a1830' },
  { id: 'crimson', label: 'Carmesí', mode: 'dark', swatch: '#3a0c12' },
  { id: 'emerald', label: 'Esmeralda', mode: 'dark', swatch: '#0a2a1c' },
  { id: 'ivory', label: 'Marfil', mode: 'light', swatch: '#f3efe6' },
  { id: 'platinum', label: 'Platino', mode: 'light', swatch: '#e7ebf1' },
  { id: 'champagne', label: 'Champán', mode: 'light', swatch: '#f0e6d2' },
];

export const THEME_IDS = THEMES.map((t) => t.id);

export function getTheme(id: string): ThemeDef {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

export function isLightTheme(id: string): boolean {
  return getTheme(id).mode === 'light';
}

export const BACKGROUND_IDS: BackgroundId[] = [
  'shader',
  'fireflies',
  'snow',
  'starfield',
  'aurora',
  'bokeh',
  'none',
];
