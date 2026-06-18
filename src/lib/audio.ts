/**
 * Alarma sintetizada con Web Audio API. Sin dependencias ni archivos.
 * Se usa un AudioContext perezoso que debe "despertarse" tras un gesto del usuario.
 */
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

/** Llamar tras un click/tecla del usuario para habilitar el audio en navegadores. */
export function unlockAudio(): void {
  const c = getCtx();
  if (c && c.state === 'suspended') void c.resume();
}

/** Un beep simple. freq en Hz, dur en segundos. */
function beep(freq: number, start: number, dur: number, gainValue = 0.25): void {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(gainValue, start + 0.02);
  gain.gain.linearRampToValueAtTime(0, start + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

/** Aviso de "10 segundos para el cambio": tres pitidos ascendentes. */
export function playWarning(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const t = c.currentTime;
  beep(660, t, 0.18);
  beep(880, t + 0.25, 0.18);
  beep(1175, t + 0.5, 0.3, 0.3);
}

/** Sonido de cambio de nivel: un acorde corto y brillante. */
export function playLevelChange(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  const t = c.currentTime;
  beep(523, t, 0.4, 0.2);
  beep(659, t, 0.4, 0.2);
  beep(784, t, 0.5, 0.22);
}
