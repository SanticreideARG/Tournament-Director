export interface Level {
  id: string;
  /** Etiqueta visible, ej. "Nivel 1" o "Break" */
  name: string;
  isBreak: boolean;
  durationSeconds: number;
  smallBlind: number | null;
  bigBlind: number | null;
  ante: number | null;
  startMessage: string;
  endMessage: string;
}

export interface Tournament {
  id: string;
  /** Nombre mostrado en la pantalla principal */
  name: string;
  createdAt: number;
  updatedAt: number;
  levels: Level[];
}

export type ThemeName = 'royal' | 'crimson' | 'emerald' | 'ivory' | 'platinum' | 'champagne';
export type ThemeMode = 'dark' | 'light';
export type LanguageCode = 'es' | 'en' | 'pt';

/** IDs de fondos animados integrados. Cualquier otro valor = dataURL/URL de imagen propia. */
export type BackgroundId = 'shader' | 'fireflies' | 'snow' | 'starfield' | 'aurora' | 'bokeh' | 'none';
export type Wallpaper = BackgroundId | (string & {});
