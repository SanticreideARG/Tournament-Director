/** "HH:MM:SS" o "MM:SS" -> segundos. Tolera espacios y comillas. */
export function parseDuration(raw: string): number {
  const clean = raw.replace(/['"]/g, '').trim();
  if (!clean) return 0;
  const parts = clean.split(':').map((p) => parseInt(p.trim(), 10) || 0);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

/** segundos -> "MM:SS" (o "H:MM:SS" si supera la hora) */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

/** segundos -> "HH:MM:SS" para exportar/editar config */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** Formatea blinds con separador de miles segun locale */
export function formatBlind(value: number | null, locale = 'es'): string {
  if (value == null) return '—';
  return value.toLocaleString(locale === 'en' ? 'en-US' : locale === 'pt' ? 'pt-BR' : 'es-ES');
}
