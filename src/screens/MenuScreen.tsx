import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ScaledStage from '../components/ScaledStage';
import FloatingCards from '../components/FloatingCards';
import { unlockAudio } from '../lib/audio';
import './MenuScreen.css';

export default function MenuScreen() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const go = (path: string) => {
    unlockAudio();
    navigate(path);
  };

  return (
    <ScaledStage>
      <FloatingCards />

      <div className="menu-brand brand-block">
        <div className="brand-mark">
          <span className="suit-flank">♠</span>
          <h1 className="brand-name" style={{ fontSize: 88 }}>PokerHouse</h1>
          <span className="suit-flank">♣</span>
        </div>
        <div className="brand-tagline">{t('brand.tagline')}</div>
      </div>

      <div className="menu-list">
        <button className="menu-item primary" onClick={() => go('/start')}>
          <span className="menu-icon">
            <svg viewBox="0 0 32 32">
              <circle cx="16" cy="17" r="11" />
              <path d="M16 11v6l4 3" />
              <path d="M12 3h8" />
              <path d="M16 3v3" />
            </svg>
          </span>
          <span className="menu-text">
            <span className="menu-title">{t('menu.start')}</span>
            <span className="menu-sub">{t('menu.startSub')}</span>
          </span>
          <span className="menu-arrow">›</span>
        </button>

        <button className="menu-item" onClick={() => go('/config')}>
          <span className="menu-icon">
            <svg viewBox="0 0 32 32">
              <rect x="5" y="6" width="22" height="20" rx="2" />
              <path d="M5 12h22" />
              <path d="M11 6V3M21 6V3" />
              <path d="M10 18h4M10 22h8" />
            </svg>
          </span>
          <span className="menu-text">
            <span className="menu-title">{t('menu.configure')}</span>
            <span className="menu-sub">{t('menu.configureSub')}</span>
          </span>
          <span className="menu-arrow">›</span>
        </button>

        <button className="menu-item" onClick={() => go('/settings')}>
          <span className="menu-icon">
            <svg viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="3" />
              <path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2.1 2.1M22.4 22.4l2.1 2.1M7.5 24.5l2.1-2.1M22.4 9.6l2.1-2.1" />
            </svg>
          </span>
          <span className="menu-text">
            <span className="menu-title">{t('menu.settings')}</span>
            <span className="menu-sub">{t('menu.settingsSub')}</span>
          </span>
          <span className="menu-arrow">›</span>
        </button>
      </div>
    </ScaledStage>
  );
}
