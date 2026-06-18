import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import ScaledStage from '../components/ScaledStage';
import { useTimerStore } from '../store/useTimerStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { formatClock, formatBlind } from '../lib/time';
import { playWarning, playLevelChange, unlockAudio } from '../lib/audio';
import './TimerScreen.css';

const R = 196;
const CIRC = 2 * Math.PI * R;

/** Tinte de fondo distinto por nivel, para marcar el cambio. */
function levelTint(index: number, isBreak: boolean): string {
  if (isBreak) return 'rgba(40, 90, 120, 0.55)';
  const hue = (200 + index * 47) % 360;
  return `hsla(${hue}, 60%, 25%, 0.45)`;
}

interface Banner {
  text: string;
  kind: 'start' | 'end';
}

export default function TimerScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const {
    tournament, currentIndex, running, finished, warned,
    togglePause, next, prev, markWarned, currentLevel, nextLevel, getRemaining,
  } = useTimerStore();

  const { soundEnabled, warnSeconds, language } = useSettingsStore();

  const [banner, setBanner] = useState<Banner | null>(null);
  const firstMount = useRef(true);
  const bannerTimer = useRef<number | undefined>(undefined);
  const [, forceTick] = useState(0);

  // Sin torneo cargado: volver al inicio.
  useEffect(() => {
    if (!tournament) navigate('/');
  }, [tournament, navigate]);

  // Ticker local: re-renderiza para reflejar el tiempo derivado del timestamp.
  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 200);
    return () => window.clearInterval(id);
  }, []);

  // Cambio de nivel: sonido + mensaje de inicio.
  useEffect(() => {
    const lvl = useTimerStore.getState().currentLevel();
    if (!lvl) return;
    if (!firstMount.current && soundEnabled) playLevelChange();
    firstMount.current = false;
    if (lvl.startMessage) showBanner({ text: lvl.startMessage, kind: 'start' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex]);

  const remaining = getRemaining();
  const lowZone = running && !finished && remaining > 0 && remaining <= warnSeconds;

  // Aviso de fin de nivel (10s antes por defecto).
  useEffect(() => {
    if (lowZone && !warned) {
      if (soundEnabled) playWarning();
      markWarned();
      const lvl = useTimerStore.getState().currentLevel();
      if (lvl?.endMessage) showBanner({ text: lvl.endMessage, kind: 'end' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lowZone, warned]);

  // Atajos de teclado.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); unlockAudio(); togglePause(); }
      else if (e.code === 'ArrowRight') next();
      else if (e.code === 'ArrowLeft') prev();
      else if (e.code === 'Escape') navigate('/');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePause, next, prev, navigate]);

  function showBanner(b: Banner) {
    setBanner(b);
    window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), 6000);
  }

  if (!tournament) return null;

  const lvl = currentLevel();
  const nxt = nextLevel();
  const total = lvl?.durationSeconds || 1;
  const pct = Math.max(0, Math.min(1, remaining / total));
  const ringColor = pct < 0.15 ? '#e03020' : pct < 0.3 ? '#e08020' : 'url(#timerGrad)';

  return (
    <ScaledStage>
      {/* Tinte de fondo por nivel */}
      <motion.div
        className="timer-tint"
        animate={{ backgroundColor: lvl ? levelTint(currentIndex, lvl.isBreak) : 'transparent' }}
        transition={{ duration: 1.2 }}
      />

      {/* Top bar: nombre del torneo */}
      <div className="timer-topbar">
        <div className="timer-tname">
          <span>{t('brand.tagline')}</span>
          {tournament.name}
        </div>
      </div>

      {/* Centro */}
      <div className="timer-center">
        <div className="timer-level-label">
          {lvl?.isBreak ? t('timer.break') : `${t('timer.level')} ${currentIndex + 1}`}
          {lvl && !lvl.isBreak ? ` · ${lvl.name}` : ''}
        </div>

        <div className="timer-ring">
          <svg className="timer-svg" viewBox="0 0 420 420">
            <defs>
              <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#f0d080" />
                <stop offset="100%" stopColor="#e0a030" />
              </linearGradient>
            </defs>
            <circle className="timer-bg-circle" cx="210" cy="210" r={R} />
            <circle
              className="timer-progress"
              cx="210" cy="210" r={R}
              style={{
                stroke: ringColor,
                strokeDasharray: CIRC,
                strokeDashoffset: CIRC * (1 - pct),
              }}
            />
          </svg>
          <div className={`timer-display ${lowZone ? 'low' : ''}`}>{formatClock(Math.ceil(remaining))}</div>
        </div>

        {lvl && !lvl.isBreak && (
          <div className="timer-blinds-section">
            <div className="timer-blinds-label">{t('timer.blinds')}</div>
            <div className="timer-blinds-value">
              {formatBlind(lvl.smallBlind, language)} / {formatBlind(lvl.bigBlind, language)}
            </div>
            {lvl.ante != null && (
              <div className="timer-ante">{t('timer.ante')} · {formatBlind(lvl.ante, language)}</div>
            )}
          </div>
        )}

        {nxt && (
          <div className="timer-next">
            {t('timer.nextLevel')}:{' '}
            <strong>
              {nxt.isBreak
                ? t('timer.break')
                : `${formatBlind(nxt.smallBlind, language)} / ${formatBlind(nxt.bigBlind, language)}`}
            </strong>
            {nxt.ante != null && !nxt.isBreak ? ` · ${t('timer.ante')} ${formatBlind(nxt.ante, language)}` : ''}
          </div>
        )}
      </div>

      {/* Brand inferior */}
      <div className="timer-bottombar">
        <div className="timer-brand">PokerHouse · Tournament Director</div>
      </div>

      <div className="timer-hint">{t('timer.clickHint')}</div>

      {/* Mensaje de inicio/fin */}
      <AnimatePresence>
        {banner && (
          <motion.div
            className={`timer-banner ${banner.kind}`}
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
          >
            {banner.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pausa */}
      <AnimatePresence>
        {!running && !finished && (
          <motion.div
            className="timer-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => { unlockAudio(); togglePause(); }}
          >
            <div className="timer-overlay-text pulse">{t('timer.paused')}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fin */}
      <AnimatePresence>
        {finished && (
          <motion.div className="timer-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="timer-overlay-text">{t('timer.finished')}</div>
            <button className="btn primary" onClick={() => navigate('/')}>{t('common.back')}</button>
          </motion.div>
        )}
      </AnimatePresence>
    </ScaledStage>
  );
}
