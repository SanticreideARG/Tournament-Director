import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScaledStage from '../components/ScaledStage';
import { useSettingsStore } from '../store/useSettingsStore';
import { THEMES, BACKGROUND_IDS } from '../lib/themes';
import type { BackgroundId, LanguageCode } from '../types/tournament';
import './SettingsScreen.css';

const LANGS: { code: LanguageCode; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
  { code: 'pt', label: 'Português' },
];

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const {
    theme, language, wallpaper, soundEnabled, warnSeconds, showTimerCards, footerText,
    setTheme, setLanguage, setWallpaper, setSoundEnabled, setWarnSeconds,
    setShowTimerCards, setFooterText,
  } = useSettingsStore();

  const darkThemes = THEMES.filter((th) => th.mode === 'dark');
  const lightThemes = THEMES.filter((th) => th.mode === 'light');
  const isImage = !((BACKGROUND_IDS as string[]).includes(wallpaper));

  const onImage = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setWallpaper(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <ScaledStage>
      <div className="set-wrap scroll">
        <button className="btn back-btn" onClick={() => navigate('/')}>‹ {t('common.back')}</button>
        <h1 className="set-title">{t('settings.title')}</h1>

        <div className="set-grid">
          {/* Tema */}
          <section className="panel set-section set-span">
            <h2>{t('settings.theme')}</h2>
            <div className="set-theme-group">
              <span className="set-group-label">{t('settings.themesDark')}</span>
              <div className="set-swatches">
                {darkThemes.map((th) => (
                  <button key={th.id} className={`swatch ${theme === th.id ? 'on' : ''}`} onClick={() => setTheme(th.id)}>
                    <span className="swatch-dot" style={{ background: th.swatch }} />
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="set-theme-group">
              <span className="set-group-label">{t('settings.themesLight')}</span>
              <div className="set-swatches">
                {lightThemes.map((th) => (
                  <button key={th.id} className={`swatch ${theme === th.id ? 'on' : ''}`} onClick={() => setTheme(th.id)}>
                    <span className="swatch-dot" style={{ background: th.swatch }} />
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Fondo */}
          <section className="panel set-section set-span">
            <h2>{t('settings.wallpaper')}</h2>
            <div className="set-options">
              {BACKGROUND_IDS.map((bg: BackgroundId) => (
                <button key={bg} className={`chip ${wallpaper === bg ? 'on' : ''}`} onClick={() => setWallpaper(bg)}>
                  {t(`settings.bg.${bg}`)}
                </button>
              ))}
              <button className={`chip ${isImage ? 'on' : ''}`} onClick={() => fileRef.current?.click()}>
                {t('settings.chooseImage')}
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onImage(e.target.files?.[0])} />
            </div>
            {isImage && <div className="set-preview" style={{ backgroundImage: `url(${wallpaper})` }} />}
          </section>

          {/* Idioma */}
          <section className="panel set-section">
            <h2>{t('settings.language')}</h2>
            <div className="set-options">
              {LANGS.map((l) => (
                <button key={l.code} className={`chip ${language === l.code ? 'on' : ''}`} onClick={() => setLanguage(l.code)}>
                  {l.label}
                </button>
              ))}
            </div>
          </section>

          {/* Pantalla */}
          <section className="panel set-section set-span">
            <h2>{t('settings.display')}</h2>
            <div className="set-theme-group">
              <span className="set-group-label">{t('settings.timerCards')}</span>
              <div className="set-options">
                <button className={`chip ${showTimerCards ? 'on' : ''}`} onClick={() => setShowTimerCards(true)}>
                  {t('settings.soundOn')}
                </button>
                <button className={`chip ${!showTimerCards ? 'on' : ''}`} onClick={() => setShowTimerCards(false)}>
                  {t('settings.soundOff')}
                </button>
              </div>
            </div>
            <label className="set-field set-field-wide">
              {t('settings.footer')}
              <input
                type="text"
                value={footerText}
                maxLength={80}
                placeholder={t('settings.footerPlaceholder')}
                onChange={(e) => setFooterText(e.target.value)}
              />
            </label>
          </section>

          {/* Sonido */}
          <section className="panel set-section">
            <h2>{t('settings.sound')}</h2>
            <div className="set-options">
              <button className={`chip ${soundEnabled ? 'on' : ''}`} onClick={() => setSoundEnabled(true)}>
                {t('settings.soundOn')}
              </button>
              <button className={`chip ${!soundEnabled ? 'on' : ''}`} onClick={() => setSoundEnabled(false)}>
                {t('settings.soundOff')}
              </button>
            </div>
            <label className="set-field">
              {t('settings.warnSeconds')}
              <input type="number" min={0} max={120} value={warnSeconds}
                onChange={(e) => setWarnSeconds(parseInt(e.target.value, 10) || 0)} />
            </label>
          </section>
        </div>
      </div>
    </ScaledStage>
  );
}
